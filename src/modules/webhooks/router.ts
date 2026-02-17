import type { Request, Response, Router } from "express";
import express from "express";

import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { trackQueueEvent, trackWebhook } from "../../lib/metrics.js";
import { tracer } from "../../lib/tracing.js";
import { writeRawAudit } from "../audit/audit-store.js";
import { buildCanonicalRecord, storeCanonicalEvent } from "../events/canonical-store.js";
import { eventQueue } from "../processing/queue.js";
import { recordEvent } from "../tracking/event-store.js";
import { normalizeEvent } from "./normalize-event.js";
import { verifySvixSignature } from "./verify-signature.js";

function requiredHeader(request: Request, key: string): string {
  const value = request.header(key);
  if (!value) {
    throw new Error(`Missing required header: ${key}`);
  }
  return value;
}

export function createWebhookRouter(): Router {
  const router = express.Router();
  const webhookTracer = tracer("webhooks-router");

  router.post(
    "/",
    express.raw({ type: "application/json", limit: env.MAX_WEBHOOK_BODY_BYTES }),
    async (request: Request, response: Response) => {
    const startedAtMs = Date.now();
    await webhookTracer.startActiveSpan("webhook.ingest", async (span) => {
      try {
      const rawBodyBuffer = request.body as Buffer;
      const rawBody = rawBodyBuffer.toString("utf8");
      const svixHeaders = {
        "svix-id": requiredHeader(request, "svix-id"),
        "svix-signature": requiredHeader(request, "svix-signature"),
        "svix-timestamp": requiredHeader(request, "svix-timestamp")
      };

      const verifiedPayload = verifySvixSignature(rawBody, svixHeaders);
      const event = normalizeEvent(verifiedPayload);

      const auditId = await writeRawAudit(rawBody, svixHeaders);
      await storeCanonicalEvent(buildCanonicalRecord(event, auditId, rawBody, svixHeaders));
      await eventQueue.add("event", { eventId: event.eventId });
      trackWebhook("accepted", Date.now() - startedAtMs);
      trackQueueEvent("enqueued");
      await recordEvent({
        timestamp: new Date().toISOString(),
        status: "accepted",
        eventId: event.eventId,
        eventType: event.eventType,
        tenantId: event.tenantId,
        resourceId: event.resourceId,
        auditId
      });
      response.status(202).json({ accepted: true, eventId: event.eventId, auditId });
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        logger.error({ err: error }, "Webhook handling failed");
        trackWebhook("rejected", Date.now() - startedAtMs);
        response.status(400).json({
          accepted: false,
          error: error instanceof Error ? error.message : "Webhook verification failed"
        });
      } finally {
        span.end();
      }
    });
  });

  return router;
}
