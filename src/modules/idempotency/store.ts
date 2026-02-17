import { redis } from "../../lib/redis.js";

const eventDedupePrefix = "idempotency:fw-event:";
const resourceVersionPrefix = "idempotency:fw-resource-version:";
const ttlSeconds = 60 * 60 * 24 * 14;

export async function claimEvent(
  eventId: string,
  resourceId?: string,
  resourceVersion?: string
): Promise<boolean> {
  const tx = redis.multi();
  tx.set(`${eventDedupePrefix}${eventId}`, "1", "EX", ttlSeconds, "NX");

  if (resourceId && resourceVersion) {
    tx.set(
      `${resourceVersionPrefix}${resourceId}:${resourceVersion}`,
      eventId,
      "EX",
      ttlSeconds,
      "NX"
    );
  }

  const results = await tx.exec();
  if (!results || results.length === 0) {
    return false;
  }
  const eventResult = results[0];
  if (!eventResult || eventResult[0]) {
    return false;
  }
  const isEventNew = eventResult[1] === "OK";
  if (!isEventNew) {
    return false;
  }

  if (resourceId && resourceVersion) {
    const resourceResult = results[1];
    if (!resourceResult || resourceResult[0]) {
      return false;
    }
    return resourceResult[1] === "OK";
  }

  return true;
}
