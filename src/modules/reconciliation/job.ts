import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";

import { env } from "../../config/env.js";
import { setReconciliationDrift, trackQueueEvent, trackReconciliation } from "../../lib/metrics.js";
import { logger } from "../../lib/logger.js";
import { fetchChangedOrders, fetchChangedTickets } from "../graphql/client.js";
import { eventQueue } from "../processing/queue.js";
import {
  persistReconciliationReport,
  type ReconciliationEntityReport,
  type ReconciliationReport
} from "./report-store.js";
import { missingProcessedResources } from "../tracking/event-store.js";

async function replayMissingResources(
  entity: "ticket" | "order",
  tenantId: string,
  resourceIds: string[]
): Promise<number> {
  let replayed = 0;
  for (const resourceId of resourceIds) {
    await eventQueue.add("event", {
      event: {
        eventId: `recon_${entity}_${resourceId}_${Date.now()}`,
        eventType: `${entity}.reconciliation.missing`,
        occurredAt: new Date().toISOString(),
        tenantId,
        resourceId,
        payload: {
          source: "reconciliation",
          reason: "resource_changed_in_fast_weigh_not_seen_by_gateway",
          entity,
          resourceId
        },
        signatureVerified: true,
        source: "reconciliation"
      },
      auditId: "reconciliation",
      replayReason: "missing-resource-detected"
    });
    replayed += 1;
    trackQueueEvent("reconciliation_replay");
  }
  return replayed;
}

export function startReconciliationJob(): void {
  cron.schedule(env.RECONCILIATION_CRON, async () => {
    const startedMs = Date.now();
    const runId = uuidv4();
    const since = new Date(Date.now() - env.RECONCILIATION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const sinceTimestamp = since.getTime();
    const tenantId = "reconciliation";
    const entityReports: ReconciliationEntityReport[] = [];
    const errors: string[] = [];

    logger.info(
      { runId, since: since.toISOString(), lookbackDays: env.RECONCILIATION_LOOKBACK_DAYS },
      "Starting reconciliation run"
    );

    try {
      const [changedTickets, changedOrders] = await Promise.all([
        fetchChangedTickets(since.toISOString()),
        fetchChangedOrders(since.toISOString())
      ]);

      const ticketIds = changedTickets.map((resource) => resource.id);
      const orderIds = changedOrders.map((resource) => resource.id);

      const [missingTickets, missingOrders] = await Promise.all([
        missingProcessedResources("ticket", ticketIds, sinceTimestamp),
        missingProcessedResources("order", orderIds, sinceTimestamp)
      ]);

      let replayedTicketCount = 0;
      let replayedOrderCount = 0;
      if (env.RECONCILIATION_REPLAY_MISSING_EVENTS) {
        [replayedTicketCount, replayedOrderCount] = await Promise.all([
          replayMissingResources("ticket", tenantId, missingTickets),
          replayMissingResources("order", tenantId, missingOrders)
        ]);
      }

      const driftTotal = missingTickets.length + missingOrders.length;
      setReconciliationDrift(driftTotal);

      entityReports.push(
        {
          entity: "ticket",
          changedResources: ticketIds.length,
          missingResources: missingTickets.length,
          replayedResources: replayedTicketCount
        },
        {
          entity: "order",
          changedResources: orderIds.length,
          missingResources: missingOrders.length,
          replayedResources: replayedOrderCount
        }
      );

      const report: ReconciliationReport = {
        runId,
        startedAt: new Date(startedMs).toISOString(),
        finishedAt: new Date().toISOString(),
        lookbackDays: env.RECONCILIATION_LOOKBACK_DAYS,
        status: "success",
        entities: entityReports,
        errors
      };
      await persistReconciliationReport(report);
      trackReconciliation("success", Date.now() - startedMs);
      logger.info({ runId, driftTotal, entityReports }, "Reconciliation run completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reconciliation error";
      errors.push(message);
      const report: ReconciliationReport = {
        runId,
        startedAt: new Date(startedMs).toISOString(),
        finishedAt: new Date().toISOString(),
        lookbackDays: env.RECONCILIATION_LOOKBACK_DAYS,
        status: "failure",
        entities: entityReports,
        errors
      };
      await persistReconciliationReport(report);
      trackReconciliation("failure", Date.now() - startedMs);
      logger.error({ runId, err: error }, "Reconciliation run failed");
    }
  });
}
