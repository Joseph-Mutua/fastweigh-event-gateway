import type { FastWeighEvent } from "../../types/events.js";
import type { ConnectorDeliveryResult } from "../../types/events.js";

export interface Connector {
  name: string;
  supports: (event: FastWeighEvent) => boolean;
  transform: (event: FastWeighEvent) => Record<string, unknown>;
  deliver: (payload: Record<string, unknown>) => Promise<ConnectorDeliveryResult>;
}
