import { z } from "zod";

import type { FastWeighEvent } from "../../types/events.js";

const incomingEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  createdAt: z.string().optional(),
  timestamp: z.string().optional(),
  tenantId: z.string().optional(),
  accountId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  resourceId: z.string().optional(),
  version: z.union([z.string(), z.number()]).optional()
});

export function normalizeEvent(payload: unknown): FastWeighEvent {
  const parsed = incomingEventSchema.parse(payload);
  const basePayload = parsed.data ?? parsed.payload ?? {};
  const resourceIdFromPayload =
    typeof basePayload.id === "string" ? basePayload.id : undefined;
  const versionFromPayload =
    typeof basePayload.version === "string" || typeof basePayload.version === "number"
      ? String(basePayload.version)
      : undefined;
  const explicitVersion =
    typeof parsed.version === "string" || typeof parsed.version === "number"
      ? String(parsed.version)
      : undefined;

  return {
    eventId: parsed.id,
    eventType: parsed.type,
    occurredAt: parsed.createdAt ?? parsed.timestamp ?? new Date().toISOString(),
    tenantId: parsed.tenantId ?? parsed.accountId ?? "unknown-tenant",
    resourceId: parsed.resourceId ?? resourceIdFromPayload ?? parsed.id,
    resourceVersion: explicitVersion ?? versionFromPayload,
    payload: basePayload,
    signatureVerified: true,
    source: "webhook"
  };
}
