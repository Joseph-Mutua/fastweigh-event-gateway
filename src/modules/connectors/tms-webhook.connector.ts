import { env } from "../../config/env.js";
import type { ConnectorDeliveryResult } from "../../types/events.js";
import type { FastWeighEvent } from "../../types/events.js";
import type { ConnectorDeliveryContext } from "./types.js";
import type { Connector } from "./types.js";

export class TmsWebhookConnector implements Connector {
  public readonly name = "tms-webhook";

  public supports(event: FastWeighEvent): boolean {
    return event.eventType.startsWith("dispatch.") || event.eventType.startsWith("pod.");
  }

  public transform(event: FastWeighEvent): Record<string, unknown> {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      tenantId: event.tenantId,
      resourceId: event.resourceId,
      payload: event.payload,
      enrichment: event.enrichment
    };
  }

  public async deliver(
    payload: Record<string, unknown>,
    context: ConnectorDeliveryContext
  ): Promise<ConnectorDeliveryResult> {
    if (!env.CONNECTOR_TMS_WEBHOOK_URL) {
      throw new Error("CONNECTOR_TMS_WEBHOOK_URL is required for tms-webhook connector.");
    }

    const response = await fetch(env.CONNECTOR_TMS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": context.idempotencyKey,
        "X-Event-Id": context.eventId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        connectorName: this.name,
        success: false,
        details: `TMS webhook delivery failed with status ${response.status}`
      };
    }
    return { connectorName: this.name, success: true };
  }
}
