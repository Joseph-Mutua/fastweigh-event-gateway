import { redis } from "../../lib/redis.js";

const prefix = "idempotency:connector-delivery:";
const ttlSeconds = 60 * 60 * 24 * 30;

export async function claimConnectorDelivery(connectorName: string, eventId: string): Promise<boolean> {
  const key = `${prefix}${connectorName}:${eventId}`;
  const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
  return result === "OK";
}
