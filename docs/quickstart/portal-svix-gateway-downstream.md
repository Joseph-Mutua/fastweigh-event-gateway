# Quick Start Flow: Portal -> Svix -> Gateway -> Downstream

1. In Fast-Weigh portal, enable API/Webhooks for your subscription.
2. In webhook settings, point the destination URL to:
   - `https://<your-domain>/webhooks/fastweigh`
3. Set webhook secret:
   - same value as `FAST_WEIGH_WEBHOOK_SECRET`
4. Configure gateway connectors:
   - `CONNECTOR_TMS_WEBHOOK_URL` for TMS forwarding
   - `CONNECTOR_POSTGRES_URL` for warehouse sink
5. Validate with Svix test event:
   - Verify `202` response
   - Check `/admin/events`
   - Check connector destination logs
6. Enable reconciliation:
   - Confirm `RECONCILIATION_CRON`
   - Check `/admin/reconciliation/latest`
