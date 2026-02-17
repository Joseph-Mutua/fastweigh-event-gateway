# Observability Setup

The gateway exports Prometheus metrics at:

- `GET /admin/metrics/prometheus`

OpenTelemetry traces are enabled with environment settings:

- `OTEL_ENABLED=true`
- `OTEL_SERVICE_NAME=fast-weigh-event-gateway`
- `OTEL_EXPORTER_OTLP_ENDPOINT=https://<collector>/v1/traces`
- `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <token>`

Key metrics:

- `fastweigh_gateway_webhook_requests_total`
- `fastweigh_gateway_webhook_duration_seconds`
- `fastweigh_gateway_worker_job_duration_seconds`
- `fastweigh_gateway_connector_deliveries_total`
- `fastweigh_gateway_queue_events_total`
- `fastweigh_gateway_queue_depth`
- `fastweigh_gateway_reconciliation_duration_seconds`
- `fastweigh_gateway_reconciliation_drift_resources`

Use these in Prometheus + Grafana dashboards.

Example scrape config:

```yaml
scrape_configs:
  - job_name: fastweigh-gateway
    metrics_path: /admin/metrics/prometheus
    static_configs:
      - targets: ["gateway.example.com"]
```
