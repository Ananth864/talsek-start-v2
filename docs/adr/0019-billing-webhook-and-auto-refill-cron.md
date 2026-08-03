# Billing webhook + auto-refill cron (Dodo / Vercel)

Ticket #14 ports the session-less billing backend: a signed Dodo webhook API
route that is the sole writer of subscription/payment/credit state, and a
secret-guarded Vercel Cron route that charges wallet mandates when balance is
below threshold.

## Decisions

### 1. Plain TanStack Start server routes (`server.handlers`)

`/api/webhooks/dodo` and `/api/cron/billing-auto-refill` use
`createFileRoute` + `server.handlers` (ADR-0002). Handlers receive the raw
`Request`, call `request.text()` before any JSON parse (signature needs the
raw body), and return `Response` / `Response.json`.

### 2. Service-role only; no Member session

Both routes use `getAdminClient()` after auth of the *caller* (webhook
signature or `CRON_SECRET`). No cookies / `flushCookies` (ADR-0004).

### 3. Webhook signature via Dodo SDK `unwrap`

Verification uses `dodo.webhooks.unwrap` with `DODO_PAYMENTS_WEBHOOK_SECRET`.
A dedicated `unwrapDodoWebhook` helper works under `BILLING_STUB` (local crypto
only — does not require a live API key).

### 4. Cron auth matches Vercel Cron

`CRON_SECRET` is validated as `Authorization: Bearer <secret>`. The route
accepts **GET** (Vercel Cron) and **POST** (manual/ops). Unset secret or
mismatched header → 401. Schedule: every 6 hours (`vercel.json`).

### 5. Credits: 1¢ = 1 credit; grant only on `payment.succeeded`

Pre-tax amount becomes ledger credits with 365-day expiry. `manual_topup` /
`auto_refill` charge types are ledger `source_type: "topup"`. Under
`BILLING_STUB`, auto-refill grants credits via the same helper (no live Dodo
charge + no fake signed webhook required in CI).

### 6. Auto-refill prefers `wallet_anchor`

The DB RPC joins any active subscription. The port dedupes by company and
prefers `plan_code = wallet_anchor` so dual-track companies charge the mandate.

### 7. Auto-refill settings on the Member billing surface

`AutoRefillSettings` + `fetchBillingSettings` / `updateBillingSettings`.
Reads/writes use the user-scoped client so RLS applies: any Member may SELECT;
only company admins may UPDATE/INSERT (`user_is_company_admin`).

## Consequences

- Member checkout/top-up from #13 remains charge-initiating; credits appear
  when this webhook processes `payment.succeeded` (or stub auto-refill grant).
- Failed webhook rows may be retried (unlike source, which skipped any prior
  `processed_webhook_events` row including `failed`).
- Production needs `DODO_PAYMENTS_WEBHOOK_SECRET`, `CRON_SECRET`, and Vercel
  Cron enabled on the project.
