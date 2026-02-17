import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

function parseBoolean(value: string): boolean {
  return value === "true";
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  TRUST_PROXY: z
    .string()
    .default("false")
    .transform(parseBoolean),
  LOG_LEVEL: z.string().default("info"),
  FAST_WEIGH_WEBHOOK_SECRET: z.string().min(1),
  FAST_WEIGH_WEBHOOK_SECRET_PREVIOUS: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional()
  ),
  FAST_WEIGH_GRAPHQL_URL: z.url().default("https://graphql.fast-weigh.com/"),
  FAST_WEIGH_API_KEY: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  QUEUE_NAME: z.string().default("fastweigh-events"),
  WEBHOOK_ROUTE: z.string().default("/webhooks/fastweigh"),
  MAX_WEBHOOK_BODY_BYTES: z.string().default("1mb"),
  MAX_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RETRY_BACKOFF_MS: z.coerce.number().int().positive().default(5000),
  ENRICHMENT_ENABLED: z
    .string()
    .default("true")
    .transform(parseBoolean),
  CONNECTOR_TMS_WEBHOOK_URL: z.preprocess(emptyStringToUndefined, z.url().optional()),
  CONNECTOR_CSV_PATH: z.string().default("./data/connectors/accounting-export.csv"),
  CONNECTOR_POSTGRES_URL: z.preprocess(emptyStringToUndefined, z.string().optional()),
  RECONCILIATION_CRON: z.string().default("0 2 * * *"),
  RECONCILIATION_LOOKBACK_DAYS: z.coerce.number().int().positive().default(1),
  RECONCILIATION_REPLAY_MISSING_EVENTS: z
    .string()
    .default("true")
    .transform(parseBoolean),
  RECONCILIATION_REPORT_PATH: z.string().default("./data/reconciliation"),
  EVENT_HISTORY_LIMIT: z.coerce.number().int().positive().default(500),
  METRICS_ENABLED: z
    .string()
    .default("true")
    .transform(parseBoolean),
  WEBHOOK_IP_ALLOWLIST: z.string().default(""),
  ADMIN_IP_ALLOWLIST: z.string().default(""),
  ADMIN_API_KEY: z.preprocess(emptyStringToUndefined, z.string().min(8).optional())
});

export const env = envSchema.parse(process.env);
