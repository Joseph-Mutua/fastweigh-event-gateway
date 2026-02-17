# Contract Assumptions (Public Baseline)

This folder is a public, no-access baseline for implementing a Fast-Weigh integration before tenant API/schema access is available.

Related mapping and use-case routing:

- `docs/contracts/event-catalog.md`

## Confirmed From Public Documentation

- GraphQL V2 endpoint format and auth model:
  - `https://graphql.fast-weigh.com/`
  - `Authorization: Bearer <API-KEY>`
- Webhook feature exists and event names include:
  - `ticket.created`
  - `ticket.updated`
  - `ticket.voided`
- GraphQL docs show customer fields such as:
  - `customerID`
  - `customerName`
  - `contactName`
  - `contactPhone`

## Inferred For Starter Implementation

- Generic webhook envelope keys: `id`, `type`, `createdAt`, `tenantId`, `resourceId`, `data`
- Generic ticket/order lookup query shapes:
  - `ticket(id: ID!)`
  - `order(id: ID!)`
- Reconciliation query shape:
  - `tickets(updatedSince: DateTime!)`
  - `orders(updatedSince: DateTime!)`

These inferred fields are placeholders and can differ in a real tenant schema.

## Upgrade Path Once Access Is Granted

1. Use GraphQL introspection in the Fast-Weigh explorer to pull the exact schema.
2. Replace all baseline queries in `docs/contracts/graphql-public-baseline.graphql`.
3. Capture real webhook payloads from Svix test/replay and replace sample JSON files.
4. Align gateway runtime queries in `src/modules/graphql/client.ts` with confirmed fields.

## Suggested Validation Checklist

- Verify each webhook event type includes a stable unique `id`.
- Verify resource identity key for tickets/orders (`id`, `ticketId`, or other).
- Verify timestamp field names and timezone semantics.
- Verify enum values for ticket/order statuses.
- Verify pagination/filter argument names for reconciliation queries.
