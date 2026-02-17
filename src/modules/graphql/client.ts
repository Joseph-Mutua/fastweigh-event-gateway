import { GraphQLClient, gql } from "graphql-request";

import { env } from "../../config/env.js";

export const graphqlClient = new GraphQLClient(env.FAST_WEIGH_GRAPHQL_URL, {
  headers: {
    Authorization: `Bearer ${env.FAST_WEIGH_API_KEY}`
  }
});

export type GraphqlResource = {
  id: string;
  updatedAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractResources(value: unknown): GraphqlResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: GraphqlResource[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record || typeof record.id !== "string") {
      continue;
    }
    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : undefined;
    result.push({ id: record.id, updatedAt });
  }
  return result;
}

export async function fetchTicketById(ticketId: string): Promise<Record<string, unknown>> {
  const query = gql`
    query TicketById($id: ID!) {
      ticket(id: $id) {
        id
        ticketNumber
        status
        createdAt
        updatedAt
        netWeight
        customer {
          id
          customerID
          customerName
        }
        order {
          id
          status
        }
      }
    }
  `;

  return graphqlClient.request<Record<string, unknown>>(query, { id: ticketId });
}

export async function fetchOrderById(orderId: string): Promise<Record<string, unknown>> {
  const query = gql`
    query OrderById($id: ID!) {
      order(id: $id) {
        id
        orderNumber
        status
        updatedAt
        customer {
          id
          customerID
          customerName
        }
      }
    }
  `;

  return graphqlClient.request<Record<string, unknown>>(query, { id: orderId });
}

export async function fetchChangedTickets(sinceIso: string): Promise<GraphqlResource[]> {
  const query = gql`
    query ChangedTickets($since: DateTime!) {
      tickets(updatedSince: $since) {
        id
        updatedAt
      }
    }
  `;
  const response = await graphqlClient.request<Record<string, unknown>>(query, { since: sinceIso });
  return extractResources(response.tickets);
}

export async function fetchChangedOrders(sinceIso: string): Promise<GraphqlResource[]> {
  const query = gql`
    query ChangedOrders($since: DateTime!) {
      orders(updatedSince: $since) {
        id
        updatedAt
      }
    }
  `;
  const response = await graphqlClient.request<Record<string, unknown>>(query, { since: sinceIso });
  return extractResources(response.orders);
}
