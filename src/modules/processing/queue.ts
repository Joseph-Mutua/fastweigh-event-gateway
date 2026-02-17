import { Queue } from "bullmq";

import { env } from "../../config/env.js";
export type QueueJobData = {
  eventId: string;
  replayReason?: string;
};

export const eventQueue = new Queue<QueueJobData, void, string>(env.QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: env.MAX_RETRY_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.RETRY_BACKOFF_MS
    },
    removeOnComplete: 5000,
    removeOnFail: 5000
  }
});

export const deadLetterQueue = new Queue<QueueJobData, void, string>(`${env.QUEUE_NAME}-dlq`, {
  connection: { url: env.REDIS_URL }
});
