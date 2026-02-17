# Secret Rotation Guide

This gateway supports webhook secret rotation without downtime.

## Webhook Secret Rotation

1. Set the old key in `FAST_WEIGH_WEBHOOK_SECRET_PREVIOUS`.
2. Set the new key in `FAST_WEIGH_WEBHOOK_SECRET`.
3. Deploy.
4. Rotate key in Fast-Weigh/Svix endpoint settings to the new key.
5. Observe successful signature verification.
6. Remove `FAST_WEIGH_WEBHOOK_SECRET_PREVIOUS` after a safe overlap window.

## API Key Rotation

1. Create a new Fast-Weigh API key in portal API settings.
2. Update `FAST_WEIGH_API_KEY` in secret storage.
3. Deploy.
4. Verify GraphQL enrichment and reconciliation calls.
5. Revoke old key.

## Admin Key Rotation

1. Set new `ADMIN_API_KEY`.
2. Deploy.
3. Update admin clients to send `x-admin-api-key`.
4. Remove old key from client configs.

## Operational Checks

- Monitor `/admin/metrics` and `/admin/failures` for auth/signature errors.
- Monitor `/admin/metrics/prometheus` counter spikes for rejected webhooks.
