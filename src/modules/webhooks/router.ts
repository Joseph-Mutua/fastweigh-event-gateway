import type { Request, Response, Router } from "express";
import express from "express";

import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { trackQueueEvent, trackWebhook } from "../../lib/metrics.js";
import { writeRawAudit } from "../audit/audit-store.js";
import { claimEvent } from "../idempotency/store.js";
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

  router.post(
    "/",
    express.raw({ type: "application/json", limit: env.MAX_WEBHOOK_BODY_BYTES }),
    async (request: Request, response: Response) => {
    const startedAtMs = Date.now();
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
      const isNewEvent = await claimEvent(event.eventId, event.resourceId, event.resourceVersion);

      if (!isNewEvent) {
        trackWebhook("duplicate", Date.now() - startedAtMs);
        await recordEvent({
          timestamp: new Date().toISOString(),
          status: "duplicate",
          eventId: event.eventId,
          eventType: event.eventType,
          tenantId: event.tenantId,
          resourceId: event.resourceId,
          detail: "Duplicate webhook ignored."
        });
        response.status(200).json({ accepted: true, duplicate: true, eventId: event.eventId });
        return;
      }

      const auditId = await writeRawAudit(rawBody, svixHeaders);
      await eventQueue.add("event", { event, auditId });
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
      logger.error({ err: error }, "Webhook handling failed");
      trackWebhook("rejected", Date.now() - startedAtMs);
      response.status(400).json({
        accepted: false,
        error: error instanceof Error ? error.message : "Webhook verification failed"
      });
    }
  });

  return router;
}
