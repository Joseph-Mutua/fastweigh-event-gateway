import { env } from "../../config/env.js";
import type { FastWeighEvent } from "../../types/events.js";
import type { Connector } from "./types.js";
import { CsvAccountingConnector } from "./csv-accounting.connector.js";
import { PostgresWarehouseConnector } from "./postgres-warehouse.connector.js";
import { TmsWebhookConnector } from "./tms-webhook.connector.js";

const connectors: Connector[] = [new CsvAccountingConnector()];

if (env.CONNECTOR_TMS_WEBHOOK_URL) {
  connectors.push(new TmsWebhookConnector());
}

if (env.CONNECTOR_POSTGRES_URL) {
  connectors.push(new PostgresWarehouseConnector());
}

export function enabledConnectors(): Connector[] {
  return connectors;
}

export function applicableConnectors(event: FastWeighEvent): Connector[] {
  return connectors.filter((connector) => connector.supports(event));
}
