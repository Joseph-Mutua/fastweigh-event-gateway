import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { redis } from "./lib/redis.js";
import { startTracing, stopTracing } from "./lib/tracing.js";
import { deadLetterQueue, eventQueue } from "./modules/processing/queue.js";
import { startReconciliationJob } from "./modules/reconciliation/job.js";
import { eventWorker, queueEvents } from "./modules/processing/worker.js";
import { createApp } from "./app.js";

await startTracing();

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Fast-Weigh Event Gateway listening");
});

startReconciliationJob();

async function shutdown(): Promise<void> {
  logger.info("Shutdown initiated");
  await Promise.all([
    eventWorker.close(),
    queueEvents.close(),
    eventQueue.close(),
    deadLetterQueue.close()
  ]);
  await stopTracing();
  await redis.quit();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
});
