import { trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

let tracingSdk: NodeSDK | undefined;

function parseOtlpHeaders(input: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!input.trim()) {
    return headers;
  }
  const pairs = input.split(",");
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    if (!rawKey || rest.length === 0) {
      continue;
    }
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (!key || !value) {
      continue;
    }
    headers[key] = value;
  }
  return headers;
}

export async function startTracing(): Promise<void> {
  if (!env.OTEL_ENABLED) {
    return;
  }

  const exporter = new OTLPTraceExporter({
    url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: parseOtlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS)
  });

  tracingSdk = new NodeSDK({
    serviceName: env.OTEL_SERVICE_NAME,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  await tracingSdk.start();
  logger.info({ service: env.OTEL_SERVICE_NAME }, "OpenTelemetry tracing started");
}

export async function stopTracing(): Promise<void> {
  if (!tracingSdk) {
    return;
  }
  await tracingSdk.shutdown();
  logger.info("OpenTelemetry tracing stopped");
}

export function tracer(scope: string) {
  return trace.getTracer(scope);
}
