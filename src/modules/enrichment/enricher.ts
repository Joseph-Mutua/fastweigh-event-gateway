import { env } from "../../config/env.js";
import { fetchOrderById, fetchTicketById } from "../graphql/client.js";

type EnrichmentResult = {
  graphQlSnapshot?: Record<string, unknown>;
};

export async function enrichEvent(
  eventType: string,
  resourceId: string
): Promise<EnrichmentResult | undefined> {
  if (!env.ENRICHMENT_ENABLED) {
    return undefined;
  }

  if (eventType.startsWith("ticket.")) {
    return {
      graphQlSnapshot: await fetchTicketById(resourceId)
    };
  }

  if (eventType.startsWith("order.")) {
    return {
      graphQlSnapshot: await fetchOrderById(resourceId)
    };
  }

  return undefined;
}
