# Fast-Weigh Event Gateway

A production-grade webhook event gateway for Fast-Weigh that verifies Svix signatures, guarantees delivery (idempotency + retries + Dead Letter Queue), enriches events via GraphQL V2, and routes data to downstream systems like ERP, TMS, accounting, and BI.

## Why I built This

Fast-Weigh webhooks are the fastest path to real-time integrations, but production webhook consumption is difficult:

- missed events during deploys/outages
- duplicate deliveries causing double writes
- no replay controls
- unclear observability when failures happen

This gateway provides a deployable, standardized integration pattern focused on reliability and recovery.

## Key Features

- Svix signature verification with secret rotation support
- Idempotency by `eventId` and optional `resourceId+resourceVersion`
- Durable queue with retries and exponential backoff
- Dead Letter Queue with replay (`/admin/dlq/replay`)
- GraphQL V2 enrichment (Bearer token API key auth)
- Connector framework for HTTP/database/file sinks
- Admin API + embedded React admin console (`/admin/ui`)
- Structured logging + Prometheus metrics
- Security controls: rate limiting, IP allowlists, admin API key, TLS guidance

## Implementation Status Against Original Notes

- Implemented:
  - signature verification, idempotency, queueing, retry/DLQ/replay
  - GraphQL enrichment layer and reconciliation drift/replay workflow
  - connector framework with 3 reference connectors
  - admin API + admin UI + Prometheus endpoint
  - Docker packaging and Terraform starter templates
- Partial:
  - distributed tracing is trace-ready but full OpenTelemetry pipeline/export is not wired yet
  - connector-level idempotency guarantees are strong for `postgres-warehouse` and HTTP key propagation, but CSV sink is append-only by design

## Architecture

### High-Level Component Diagram

```mermaid
flowchart LR
  FW[Fast-Weigh Platform] -->|Webhook Events| SV[Svix Webhooks]
  SV -->|Signed HTTP POST| IN[Ingress API]
  IN -->|Verify + Persist Raw| EV[(Event Store)]
  IN -->|Enqueue| Q[Queue]
  Q --> WK[Workers]
  WK -->|Enrich| GQL[GraphQL V2 API]
  WK -->|Transform| TR[Transformer]
  TR -->|Deliver| CN[Connectors]
  CN --> ERP[ERP]
  CN --> TMS[TMS]
  CN --> AC[Accounting]
  CN --> DWH[Data Warehouse]
  WK -->|Failures| DLQ[DLQ]
  UI[Admin Console] --> EV
  UI --> Q
  UI --> DLQ
```

### Event Processing Sequence

```mermaid
sequenceDiagram
  participant SV as Svix
  participant IN as Ingress API
  participant EV as Event Store
  participant Q as Queue
  participant WK as Worker
  participant GQL as GraphQL V2
  participant CN as Connector

  SV->>IN: POST /webhooks/fastweigh (signed payload)
  IN->>IN: Verify signature + normalize event
  IN->>EV: Store raw event + metadata
  IN->>Q: Enqueue event
  WK->>Q: Dequeue event
  WK->>WK: Idempotency gate check
  WK->>GQL: Query latest state (Bearer token)
  GQL-->>WK: Enriched resource data
  WK->>CN: Deliver transformed payload
  CN-->>WK: Ack / Nack
  alt Failure
    WK->>Q: Retry with backoff
  else Repeated failures
    WK->>DLQ: Send to DLQ
  end
```

## Supported Starter Use Cases

- Ticket created/updated -> ERP and invoicing sync
- Dispatch lifecycle updates -> TMS and customer ETA sync
- POD captured -> closeout + billing triggers
- Customer/order updates -> CRM/pricing sync

## Reliability Guarantees

- At-least-once delivery with idempotent processing gate
- Durable queue buffering for transient downtime
- Replayable history for audit and recovery
- Safe downstream writes through connector contracts and replay controls

## Internal Event Envelope

All events are normalized to:

- `eventId`
- `eventType`
- `occurredAt`
- `tenantId`
- `resourceId`
- `payload`
- `signatureVerified`
- `resourceVersion` (optional)
- `source` (`webhook` or `reconciliation`)

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

3. Set required values in `.env`:

- `FAST_WEIGH_WEBHOOK_SECRET`
- `FAST_WEIGH_API_KEY`

4. Set Redis connection (`REDIS_URL`) with one option:

Option A: Hosted Redis:

```env
REDIS_URL=rediss://<username>:<password>@<host>:<port>
```

Option B: Local Redis via Docker:

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

Option C: Local Redis via WSL:

```bash
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start
redis-cli ping
```

Then use:

```env
REDIS_URL=redis://127.0.0.1:6379
```

5. Start the app:

```bash
npm run dev
```

6. Verify:

```bash
curl http://localhost:3000/health
```

7. Open admin UI:

- `http://localhost:3000/admin/ui`

## Redis Troubleshooting

If you see `ECONNREFUSED ... 127.0.0.1:6379` or `::1:6379`, Redis is not reachable.

1. Confirm `.env` `REDIS_URL` is correct.
2. For host app, use `redis://127.0.0.1:6379`.
3. For docker-compose app container, use `redis://redis:6379`.
4. Validate connectivity:

```powershell
Test-NetConnection 127.0.0.1 -Port 6379
```

## Admin Endpoints

- `GET /admin/ui`
- `GET /admin/health`
- `GET /admin/metrics`
- `GET /admin/metrics/prometheus`
- `GET /admin/events?limit=50`
- `GET /admin/failures?limit=50`
- `GET /admin/reconciliation/latest`
- `GET /admin/reconciliation/reports?limit=10`
- `POST /admin/dlq/replay`

If `ADMIN_API_KEY` is set, send `x-admin-api-key` on `/admin/*` requests.

## Test and Validate

```bash
npm run lint
npm run test
npm run build
```

## Deployment

- Docker: `Dockerfile`, `docker-compose.yml`
- Terraform (AWS ECS Fargate template): `infra/terraform/README.md`

## Related Docs

- contracts/event map: `docs/contracts/`
- security runbooks: `docs/security/`
- observability/grafana: `docs/observability/`
- success KPIs: `docs/operations/success-metrics.md`
- quickstart flow: `docs/quickstart/portal-svix-gateway-downstream.md`
