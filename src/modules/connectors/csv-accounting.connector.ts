import { mkdir, access, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env.js";
import type { ConnectorDeliveryResult } from "../../types/events.js";
import type { FastWeighEvent } from "../../types/events.js";
import type { Connector } from "./types.js";

const headers = ["event_id", "event_type", "occurred_at", "tenant_id", "resource_id"];

function toCsvScalar(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

async function ensureCsvFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, `${headers.join(",")}\n`, "utf8");
  }
}

export class CsvAccountingConnector implements Connector {
  public readonly name = "csv-accounting";

  public supports(event: FastWeighEvent): boolean {
    return event.eventType.startsWith("ticket.") || event.eventType.startsWith("billing.");
  }

  public transform(event: FastWeighEvent): Record<string, unknown> {
    return {
      event_id: event.eventId,
      event_type: event.eventType,
      occurred_at: event.occurredAt,
      tenant_id: event.tenantId,
      resource_id: event.resourceId
    };
  }

  public async deliver(payload: Record<string, unknown>): Promise<ConnectorDeliveryResult> {
    await ensureCsvFile(env.CONNECTOR_CSV_PATH);
    const row = headers
      .map((header) => {
        const value = payload[header];
        return `"${toCsvScalar(value).replaceAll('"', '""')}"`;
      })
      .join(",");

    await appendFile(env.CONNECTOR_CSV_PATH, `${row}\n`, "utf8");
    return { connectorName: this.name, success: true };
  }
}
