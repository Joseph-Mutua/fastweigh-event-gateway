import { redis } from "../../lib/redis.js";
import type { FastWeighEvent } from "../../types/events.js";

const eventStorePrefix = "event-store:canonical:";
const ttlSeconds = 60 * 60 * 24 * 30;

export type CanonicalEventRecord = {
  event: FastWeighEvent;
  auditId: string;
  receivedAt: string;
  rawBody: string;
  headers: Record<string, string>;
};

function keyFor(eventId: string): string {
  return `${eventStorePrefix}${eventId}`;
}

export async function storeCanonicalEvent(record: CanonicalEventRecord): Promise<void> {
  await redis.set(keyFor(record.event.eventId), JSON.stringify(record), "EX", ttlSeconds);
}

export async function getCanonicalEvent(eventId: string): Promise<CanonicalEventRecord | null> {
  const raw = await redis.get(keyFor(eventId));
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as CanonicalEventRecord;
}

export function buildCanonicalRecord(
  event: FastWeighEvent,
  auditId: string,
  rawBody: string,
  headers: Record<string, string>
): CanonicalEventRecord {
  return {
    event,
    auditId,
    receivedAt: new Date().toISOString(),
    rawBody,
    headers
  };
}
