import type { Router } from "express";
import express from "express";

import {
  getPrometheusMetrics,
  prometheusContentType,
  trackQueueDepth,
  trackQueueEvent
} from "../../lib/metrics.js";
import { enabledConnectors } from "../connectors/registry.js";
import { getCanonicalEvent } from "../events/canonical-store.js";
import { deadLetterQueue, eventQueue } from "../processing/queue.js";
import {
  getLatestReconciliationReport,
  listRecentReconciliationReports
} from "../reconciliation/report-store.js";
import { getRecentEvents, getRecentFailures, recordEvent } from "../tracking/event-store.js";
import { renderAdminConsoleHtml } from "./ui-html.js";

function parseLimit(input: unknown, fallback: number): number {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(value), 500);
}

export function createAdminRouter(): Router {
  const router = express.Router();

  router.get("/health", async (_request, response) => {
    const [waiting, active] = await Promise.all([
      eventQueue.getWaitingCount(),
      eventQueue.getActiveCount()
    ]);
    response.json({ ok: true, queue: { waiting, active } });
  });

  router.get("/ui", (_request, response) => {
    response.type("html").send(renderAdminConsoleHtml());
  });

  router.get("/metrics", async (_request, response) => {
    const [waiting, active, failed, delayed, completed, dlqWaiting] = await Promise.all([
      eventQueue.getWaitingCount(),
      eventQueue.getActiveCount(),
      eventQueue.getFailedCount(),
      eventQueue.getDelayedCount(),
      eventQueue.getCompletedCount(),
      deadLetterQueue.getWaitingCount()
    ]);

    trackQueueDepth("waiting", waiting);
    trackQueueDepth("active", active);
    trackQueueDepth("failed", failed);
    trackQueueDepth("delayed", delayed);

    response.json({
      queue: { waiting, active, failed, delayed, completed },
      dlq: { waiting: dlqWaiting },
      connectors: enabledConnectors().map((connector) => connector.name)
    });
  });

  router.get("/metrics/prometheus", async (_request, response) => {
    response.setHeader("Content-Type", prometheusContentType());
    response.send(await getPrometheusMetrics());
  });

  router.get("/events", async (request, response) => {
    const limit = parseLimit(request.query.limit, 50);
    response.json({ items: await getRecentEvents(limit) });
  });

  router.get("/failures", async (request, response) => {
    const limit = parseLimit(request.query.limit, 50);
    response.json({ items: await getRecentFailures(limit) });
  });

  router.get("/reconciliation/latest", async (_request, response) => {
    response.json({ report: await getLatestReconciliationReport() });
  });

  router.get("/reconciliation/reports", async (request, response) => {
    const limit = parseLimit(request.query.limit, 10);
    response.json({ items: await listRecentReconciliationReports(limit) });
  });

  router.post("/dlq/replay", async (_request, response) => {
    const jobs = await deadLetterQueue.getJobs(["waiting", "delayed"]);
    let replayed = 0;
    for (const job of jobs) {
      const canonical = await getCanonicalEvent(job.data.eventId);
      await eventQueue.add("event", {
        ...job.data,
        replayReason: "dlq-replay"
      });
      if (canonical) {
        await recordEvent({
          timestamp: new Date().toISOString(),
          status: "replayed",
          eventId: canonical.event.eventId,
          eventType: canonical.event.eventType,
          tenantId: canonical.event.tenantId,
          resourceId: canonical.event.resourceId,
          auditId: canonical.auditId,
          detail: "Replay requested from DLQ."
        });
      }
      await job.remove();
      replayed += 1;
      trackQueueEvent("dlq_replay");
    }
    response.json({ replayed });
  });

  return router;
}
