export type FastWeighEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  tenantId: string;
  resourceId: string;
  resourceVersion?: string;
  payload: Record<string, unknown>;
  enrichment?: Record<string, unknown>;
  signatureVerified: boolean;
  source: "webhook" | "reconciliation";
};

export type ConnectorDeliveryResult = {
  connectorName: string;
  success: boolean;
  details?: string;
};
