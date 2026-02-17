import { Client } from "pg";

import { env } from "../../config/env.js";
import type { ConnectorDeliveryResult } from "../../types/events.js";
import type { FastWeighEvent } from "../../types/events.js";
import type { Connector } from "./types.js";

export class PostgresWarehouseConnector implements Connector {
  public readonly name = "postgres-warehouse";

  public supports(): boolean {
    return true;
  }

  public transform(event: FastWeighEvent): Record<string, unknown> {
    return {
      event_id: event.eventId,
      event_type: event.eventType,
      occurred_at: event.occurredAt,
      tenant_id: event.tenantId,
      resource_id: event.resourceId,
      payload: event.payload,
      enrichment: event.enrichment
    };
  }

  public async deliver(payload: Record<string, unknown>): Promise<ConnectorDeliveryResult> {
    if (!env.CONNECTOR_POSTGRES_URL) {
      throw new Error("CONNECTOR_POSTGRES_URL is required for postgres-warehouse connector.");
    }

    const client = new Client({ connectionString: env.CONNECTOR_POSTGRES_URL });
    await client.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS fastweigh_event_sink (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL,
          tenant_id TEXT NOT NULL,
          resource_id TEXT NOT NULL,
          payload JSONB NOT NULL
        )
      `);

      await client.query(
        `
          INSERT INTO fastweigh_event_sink (
            event_id, event_type, occurred_at, tenant_id, resource_id, payload
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (event_id) DO UPDATE SET
            event_type = EXCLUDED.event_type,
            occurred_at = EXCLUDED.occurred_at,
            tenant_id = EXCLUDED.tenant_id,
            resource_id = EXCLUDED.resource_id,
            payload = EXCLUDED.payload
        `,
        [
          payload.event_id,
          payload.event_type,
          payload.occurred_at,
          payload.tenant_id,
          payload.resource_id,
          JSON.stringify({
            payload: payload.payload,
            enrichment: payload.enrichment
          })
        ]
      );
      return { connectorName: this.name, success: true };
    } finally {
      await client.end();
    }
  }
}
