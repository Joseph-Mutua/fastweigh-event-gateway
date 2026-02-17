# Success Metrics

Track these KPIs after rollout:

## Integration Velocity

- Time from endpoint provisioning to first successful downstream delivery
- Target: reduce to <= 2 days

## Reliability

- Webhook acceptance rate: accepted / total
- DLQ rate: dlq events / total jobs
- Replay recovery rate: replayed_success / replayed_total

## Support Load

- Count of integration-related support tickets per month
- Count of webhook retry/DLQ incidents per month

## Adoption

- Number of tenants with active dispatch/POD connector traffic
- Volume of `dispatch.*` and `pod.*` events delivered successfully

## Data Consistency

- Reconciliation drift count over time
- Mean time to drift resolution
