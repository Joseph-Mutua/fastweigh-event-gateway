# TLS and Network Requirements

## Inbound Webhook Endpoint

- TLS version: 1.2+ (1.3 preferred)
- Valid public certificate from trusted CA
- Endpoint must be reachable by Fast-Weigh/Svix
- Do not terminate TLS on untrusted intermediaries

## Admin Surface

- Restrict `/admin/*` using:
  - `ADMIN_API_KEY` (`x-admin-api-key` header)
  - `ADMIN_IP_ALLOWLIST` CIDRs
- Disable broad CORS for admin routes in production if not needed.

## Egress Connections

- Use TLS for:
  - GraphQL endpoint (`https://graphql.fast-weigh.com/`)
  - TMS connector destinations
  - Cloud-managed Redis/Postgres endpoints when available

## Load Balancer Recommendations

- Enforce HTTPS redirect (80 -> 443)
- Use modern cipher policies
- Enable access logging and WAF where required
