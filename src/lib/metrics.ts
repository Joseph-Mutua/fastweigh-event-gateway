import client from "prom-client";

import { env } from "../config/env.js";

const metricPrefix = "fastweigh_gateway_";
const registry = new client.Registry();

if (env.METRICS_ENABLED) {
  client.collectDefaultMetrics({
    register: registry,
    prefix: metricPrefix
  });
}

const webhookRequests = new client.Counter({
  name: `${metricPrefix}webhook_requests_total`,
  help: "Total webhook intake requests.",
  labelNames: ["status"] as const,
  registers: [registry]
});

const webhookDurationSeconds = new client.Histogram({
  name: `${metricPrefix}webhook_duration_seconds`,
  help: "Webhook request latency in seconds.",
  labelNames: ["status"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry]
});

const workerJobDurationSeconds = new client.Histogram({
  name: `${metricPrefix}worker_job_duration_seconds`,
  help: "Queue worker processing latency in seconds.",
  labelNames: ["status"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [registry]
});

const connectorDeliveries = new client.Counter({
  name: `${metricPrefix}connector_deliveries_total`,
  help: "Connector delivery outcomes.",
  labelNames: ["connector", "status"] as const,
  registers: [registry]
});

const queueEvents = new client.Counter({
  name: `${metricPrefix}queue_events_total`,
  help: "Queue lifecycle events.",
  labelNames: ["type"] as const,
  registers: [registry]
});

const queueDepth = new client.Gauge({
  name: `${metricPrefix}queue_depth`,
  help: "Current queue depth by state.",
  labelNames: ["state"] as const,
  registers: [registry]
});

const reconciliationDurationSeconds = new client.Histogram({
  name: `${metricPrefix}reconciliation_duration_seconds`,
  help: "Reconciliation run duration in seconds.",
  labelNames: ["status"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry]
});

const reconciliationDriftCount = new client.Gauge({
  name: `${metricPrefix}reconciliation_drift_resources`,
  help: "Missing resources detected in latest reconciliation run.",
  registers: [registry]
});

function noop(): void {}

export function trackWebhook(status: "accepted" | "duplicate" | "rejected", durationMs: number): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  webhookRequests.inc({ status });
  webhookDurationSeconds.observe({ status }, durationMs / 1000);
}

export function trackWorkerJob(status: "success" | "failure", durationMs: number): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  workerJobDurationSeconds.observe({ status }, durationMs / 1000);
}

export function trackConnectorDelivery(connector: string, status: "success" | "failure"): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  connectorDeliveries.inc({ connector, status });
}

export function trackQueueEvent(
  type: "enqueued" | "retry" | "dlq" | "dlq_replay" | "reconciliation_replay"
): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  queueEvents.inc({ type });
}

export function trackQueueDepth(state: "waiting" | "active" | "failed" | "delayed", value: number): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  queueDepth.set({ state }, value);
}

export function trackReconciliation(status: "success" | "failure", durationMs: number): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  reconciliationDurationSeconds.observe({ status }, durationMs / 1000);
}

export function setReconciliationDrift(value: number): void {
  if (!env.METRICS_ENABLED) {
    return;
  }
  reconciliationDriftCount.set(value);
}

export async function getPrometheusMetrics(): Promise<string> {
  if (!env.METRICS_ENABLED) {
    noop();
    return "# metrics disabled\n";
  }
  return registry.metrics();
}

export function prometheusContentType(): string {
  return registry.contentType;
}
