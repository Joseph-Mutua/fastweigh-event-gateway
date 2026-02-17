import { QueueEvents, Worker } from "bullmq";

import { env } from "../../config/env.js";
import {
  trackConnectorDelivery,
  trackQueueDepth,
  trackQueueEvent,
  trackWorkerJob
} from "../../lib/metrics.js";
import { logger } from "../../lib/logger.js";
import { tracer } from "../../lib/tracing.js";
import { applicableConnectors } from "../connectors/registry.js";
import { enrichEvent } from "../enrichment/enricher.js";
import { getCanonicalEvent } from "../events/canonical-store.js";
import { claimConnectorDelivery } from "../idempotency/connector-delivery.js";
import { claimEvent } from "../idempotency/store.js";
import { transformForConnector } from "../transform/transformer.js";
import {
  markResourceProcessed,
  recordEvent,
  recordFailure,
  type EventHistoryRecord
} from "../tracking/event-store.js";
import { deadLetterQueue, eventQueue, type QueueJobData } from "./queue.js";

function eventEntity(eventType: string): "ticket" | "order" | null {
  if (eventType.startsWith("ticket.")) {
    return "ticket";
  }
  if (eventType.startsWith("order.")) {
    return "order";
  }
  return null;
}

function historyRecordFromEvent(
  event: {
    eventId: string;
    eventType: string;
    tenantId: string;
    resourceId: string;
  },
  auditId: string | undefined,
  status: EventHistoryRecord["status"],
  detail?: string
): EventHistoryRecord {
  return {
    timestamp: new Date().toISOString(),
    status,
    eventId: event.eventId,
    eventType: event.eventType,
    tenantId: event.tenantId,
    resourceId: event.resourceId,
    auditId,
    detail
  };
}

export const eventWorker = new Worker<QueueJobData, void, string>(
  env.QUEUE_NAME,
  async (job) => {
    const startedMs = Date.now();
    const { eventId, replayReason } = job.data;
    const workerTracer = tracer("event-worker");
    const record = await getCanonicalEvent(eventId);
    if (!record) {
      throw new Error(`Canonical event not found for eventId=${eventId}`);
    }

    const { event, auditId } = record;

    const isNewEvent = await claimEvent(event.eventId, event.resourceId, event.resourceVersion);
    if (!isNewEvent) {
      await recordEvent(
        historyRecordFromEvent(event, auditId, "duplicate", "Duplicate event skipped at worker.")
      );
      trackWorkerJob("success", Date.now() - startedMs);
      return;
    }

    try {
      await workerTracer.startActiveSpan("worker.processEvent", async (span) => {
        try {
          const enrichment = await enrichEvent(event.eventType, event.resourceId);
          const enrichedEvent = {
            ...event,
            enrichment: enrichment?.graphQlSnapshot
          };
          const connectors = applicableConnectors(enrichedEvent);

          for (const connector of connectors) {
            const canDeliver = await claimConnectorDelivery(connector.name, event.eventId);
            if (!canDeliver) {
              logger.info(
                { connector: connector.name, eventId: event.eventId },
                "Connector delivery already processed; skipping."
              );
              continue;
            }

            const transformed = transformForConnector(connector, enrichedEvent);
            const delivery = await connector.deliver(transformed.payload, {
              eventId: event.eventId,
              idempotencyKey: transformed.idempotencyKey
            });
            if (!delivery.success) {
              trackConnectorDelivery(connector.name, "failure");
              throw new Error(delivery.details ?? `${connector.name} delivery failed`);
            }
            trackConnectorDelivery(connector.name, "success");
            logger.info(
              { connector: connector.name, eventId: event.eventId, auditId, replayReason },
              "Connector delivery succeeded"
            );
          }

          const entity = eventEntity(event.eventType);
          if (entity) {
            const occurredTimestamp = Date.parse(event.occurredAt);
            await markResourceProcessed(
              entity,
              event.resourceId,
              Number.isFinite(occurredTimestamp) ? occurredTimestamp : Date.now()
            );
          }

          await recordEvent(
            historyRecordFromEvent(
              event,
              auditId,
              replayReason ? "replayed" : "processed",
              replayReason ? `Replay reason: ${replayReason}` : undefined
            )
          );

          trackWorkerJob("success", Date.now() - startedMs);
        } catch (error) {
          span.recordException(error instanceof Error ? error : new Error(String(error)));
          throw error;
        } finally {
        span.end();
        }
      });
    } catch (error) {
      trackWorkerJob("failure", Date.now() - startedMs);
      await recordFailure(
        historyRecordFromEvent(
          event,
          auditId,
          "failed",
          error instanceof Error ? error.message : "Unknown worker failure"
        )
      );
      throw error;
    }
  },
  { connection: { url: env.REDIS_URL } }
);

export const queueEvents = new QueueEvents(env.QUEUE_NAME, { connection: { url: env.REDIS_URL } });

queueEvents.on("failed", ({ jobId, failedReason }) => {
  void (async () => {
    if (!jobId) {
      return;
    }

    const job = await eventQueue.getJob(jobId);
    if (!job) {
      return;
    }

    const attempts = job.opts.attempts ?? env.MAX_RETRY_ATTEMPTS;
    if (job.attemptsMade < attempts) {
      trackQueueEvent("retry");
      return;
    }

    await deadLetterQueue.add("dead-letter", job.data);
    trackQueueEvent("dlq");
    logger.error(
      { eventId: job.data.eventId, jobId, failedReason, attempts: job.attemptsMade },
      "Event moved to DLQ"
    );
  })();
});

queueEvents.on("active", () => {
  void (async () => {
    const [waiting, active, failed, delayed] = await Promise.all([
      eventQueue.getWaitingCount(),
      eventQueue.getActiveCount(),
      eventQueue.getFailedCount(),
      eventQueue.getDelayedCount()
    ]);
    trackQueueDepth("waiting", waiting);
    trackQueueDepth("active", active);
    trackQueueDepth("failed", failed);
    trackQueueDepth("delayed", delayed);
  })();
});
