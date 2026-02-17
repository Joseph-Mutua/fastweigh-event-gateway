import { env } from "../../config/env.js";
import { redis } from "../../lib/redis.js";

const recentEventsKey = "tracking:events:recent";
const recentFailuresKey = "tracking:events:failures";
const processedTicketResourcesKey = "tracking:processed:tickets";
const processedOrderResourcesKey = "tracking:processed:orders";
const maxResourceRetentionMs = 1000 * 60 * 60 * 24 * 30;

export type EventHistoryRecord = {
  timestamp: string;
  status: "accepted" | "duplicate" | "processed" | "failed" | "replayed";
  eventId: string;
  eventType: string;
  tenantId: string;
  resourceId: string;
  auditId?: string;
  detail?: string;
};

function processedResourceKey(entity: "ticket" | "order"): string {
  return entity === "ticket" ? processedTicketResourcesKey : processedOrderResourcesKey;
}

async function appendCappedJsonList(key: string, record: EventHistoryRecord): Promise<void> {
  const payload = JSON.stringify(record);
  await redis.multi().lpush(key, payload).ltrim(key, 0, env.EVENT_HISTORY_LIMIT - 1).exec();
}

export async function recordEvent(record: EventHistoryRecord): Promise<void> {
  await appendCappedJsonList(recentEventsKey, record);
}

export async function recordFailure(record: EventHistoryRecord): Promise<void> {
  await appendCappedJsonList(recentFailuresKey, record);
  await appendCappedJsonList(recentEventsKey, record);
}

async function readJsonList(key: string, limit: number): Promise<EventHistoryRecord[]> {
  const items = await redis.lrange(key, 0, Math.max(0, limit - 1));
  return items.map((item) => JSON.parse(item) as EventHistoryRecord);
}

export async function getRecentEvents(limit: number): Promise<EventHistoryRecord[]> {
  return readJsonList(recentEventsKey, limit);
}

export async function getRecentFailures(limit: number): Promise<EventHistoryRecord[]> {
  return readJsonList(recentFailuresKey, limit);
}

export async function markResourceProcessed(
  entity: "ticket" | "order",
  resourceId: string,
  timestamp: number
): Promise<void> {
  const key = processedResourceKey(entity);
  const cutoff = timestamp - maxResourceRetentionMs;
  await redis
    .multi()
    .zadd(key, timestamp, resourceId)
    .zremrangebyscore(key, "-inf", cutoff)
    .exec();
}

export async function missingProcessedResources(
  entity: "ticket" | "order",
  resourceIds: string[],
  sinceTimestamp: number
): Promise<string[]> {
  if (resourceIds.length === 0) {
    return [];
  }

  const key = processedResourceKey(entity);
  const pipeline = redis.pipeline();
  for (const resourceId of resourceIds) {
    pipeline.zscore(key, resourceId);
  }
  const results = await pipeline.exec();
  if (!results) {
    return resourceIds;
  }
  const missing: string[] = [];

  for (const [index, result] of results.entries()) {
    const [, score] = result;
    const scoreNumber = score ? Number(score) : Number.NaN;
    if (!Number.isFinite(scoreNumber) || scoreNumber < sinceTimestamp) {
      const resourceId = resourceIds[index];
      if (resourceId) {
        missing.push(resourceId);
      }
    }
  }

  return missing;
}
