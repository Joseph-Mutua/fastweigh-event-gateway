# Fast-Weigh Event Catalog and Routing Map

This catalog defines how webhook event types map to Fast-Weigh portal modules and downstream workflows.

## Event Type Inventory

Confirmed from public docs:

- `ticket.created`
- `ticket.updated`
- `ticket.voided`

Inferred baseline for production design (validate in Svix before enabling):

- `order.created`
- `order.updated`
- `order.closed`
- `dispatch.requested`
- `dispatch.assigned`
- `dispatch.arrived`
- `dispatch.completed`
- `pod.captured`
- `billing.invoice.created`
- `billing.invoice.updated`

## Module and Use-Case Mapping

| Event Type | Portal Module | Downstream Use Cases |
|---|---|---|
| `ticket.created` | Tickets / In-Yard | Invoice line staging, haul pay accrual, customer notification |
| `ticket.updated` | Tickets / Orders | Billing correction sync, ERP adjustment, customer portal update |
| `ticket.voided` | Tickets / Billing | Credit memo trigger, AR hold, exception alert |
| `order.created` | Orders | Job initialization in TMS/ERP, capacity planning |
| `order.updated` | Orders / Dispatch | Dispatch re-plan, ETA refresh, customer status feed |
| `order.closed` | Orders / Billing | Final billing readiness, cost closeout |
| `dispatch.requested` | Dispatch | Broker/TMS tender creation |
| `dispatch.assigned` | Dispatch | Driver/vehicle update in external TMS |
| `dispatch.arrived` | Dispatch / Live Tracking | Customer ETA page update, SMS milestone |
| `dispatch.completed` | Dispatch / Hauler Pay | Delivery completion, pay item release |
| `pod.captured` | Dispatch / POD | Signature archive, billing trigger, dispute defense |
| `billing.invoice.created` | Billing / AR | Accounting sync (QBO/ERP), payment workflow start |
| `billing.invoice.updated` | Billing / AR | GL/AR correction sync |

## Internal Normalized Envelope

All inbound and replayed events must map to:

- `eventId`
- `eventType`
- `occurredAt`
- `tenantId`
- `resourceId`
- `payload`
- `signatureVerified`

Additional gateway metadata:

- `resourceVersion` (optional dedupe)
- `source` (`webhook` or `reconciliation`)

## Validation Workflow

1. Use Svix test/replay to capture real payloads.
2. Compare real event names against this catalog.
3. Mark each event as `confirmed` or `disabled` in connector routing policy.
4. Update connector allowlists before enabling production forwarding.
