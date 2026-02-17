# Fast-Weigh Event Gateway

Production-ready reference service for reliable Fast-Weigh webhook ingestion, processing, enrichment, replay, and downstream delivery.

## Delivered Scope

- Svix webhook signature verification with secret rotation support
- Normalized internal event envelope
- Idempotency by `eventId` plus optional `resourceId+resourceVersion`
- Durable queueing with BullMQ + retries + exponential backoff + DLQ
- GraphQL enrichment for ticket/order events
- Nightly reconciliation with drift detection and replay of missing resources
- Connector framework with 3 reference connectors:
  - CSV accounting export
  - TMS webhook push
  - PostgreSQL warehouse sink
- Admin APIs and React-based admin console (`/admin/ui`)
- Prometheus metrics endpoint and Grafana dashboard starter
- Security controls: rate limit, admin key auth, IP allowlists, TLS guidance
- Docker packaging and Terraform deployment templates

## Internal Event Envelope

The gateway normalizes all events to:

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

2. Create env file:

```bash
cp .env.example .env
```

3. Set required values in `.env`:

- `FAST_WEIGH_WEBHOOK_SECRET`
- `FAST_WEIGH_API_KEY`

4. Start Redis:

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

5. Start the app:

```bash
npm run dev
```

6. Verify:

```bash
curl http://localhost:3000/health
```

## Admin Endpoints

- `GET /admin/ui` - React admin console
- `GET /admin/metrics` - queue/connectors summary
- `GET /admin/metrics/prometheus` - Prometheus metrics
- `GET /admin/events?limit=50` - recent events
- `GET /admin/failures?limit=50` - recent failures
- `GET /admin/reconciliation/latest` - latest reconciliation report
- `GET /admin/reconciliation/reports?limit=10` - recent reports
- `POST /admin/dlq/replay` - replay DLQ jobs

If `ADMIN_API_KEY` is set, include `x-admin-api-key` header on all `/admin/*` calls.

## Test and Validate

```bash
npm run lint
npm run test
npm run build
```

## Webhook Testing Notes

- Inbound route defaults to `POST /webhooks/fastweigh`.
- Signature verification requires valid Svix headers.
- Use samples in `docs/contracts/` for payload shape baselines.

## Docs

- Contracts and event map: `docs/contracts/`
- Security runbooks: `docs/security/`
- Observability setup: `docs/observability/`
- Success KPIs: `docs/operations/success-metrics.md`
- Terraform deployment: `infra/terraform/`

## Deployment

- Docker: `Dockerfile`, `docker-compose.yml`
- Terraform (AWS ECS Fargate template): `infra/terraform/README.md`