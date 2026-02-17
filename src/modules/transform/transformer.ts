import type { Connector } from "../connectors/types.js";
import type { FastWeighEvent } from "../../types/events.js";

export type ConnectorTransformOutput = {
  payload: Record<string, unknown>;
  idempotencyKey: string;
};

export function transformForConnector(
  connector: Connector,
  event: FastWeighEvent
): ConnectorTransformOutput {
  const payload = connector.transform(event);
  return {
    payload,
    idempotencyKey: `${connector.name}:${event.eventId}`
  };
}
