# Billing Member surface via Dodo (checkout, plans, invoice)

Ticket #13 ports the Member billing surface: Dodo checkout for a plan,
change plan, cancel subscription, credit top-up, and invoice download.
Webhook sync and auto-refill cron remain ticket #14.

## Decisions

### 1. Server functions for Member actions; webhook/cron stay API routes

Checkout, change-plan, cancel, top-up, and reads are `createServerFn`s under
`src/server/fn/billing.ts` (ADR-0002). Invoice PDF returns base64 across the
server-fn boundary (avoids inventing cookie-auth for a binary API route).
`/api/webhooks/dodo` and `/api/cron/billing-auto-refill` are ticket #14
(ADR-0019).

### 2. Resolve products by `plan_code`, not client product IDs

Source exposes `VITE_TIER1_PRODUCT_ID` / `VITE_WALLET_ANCHOR_PRODUCT_ID`. The
port looks up active rows in `billing_products_config` by `plan_code`
(`wallet_anchor`, `starter_monthly`, …) on the server so product IDs stay
server-side.

### 3. Reads on user-scoped client; writes that RLS forbids use admin

Members may SELECT company billing rows (subscriptions, payments, customers)
and active products. INSERT/UPDATE on those tables is service-role only.
`getOrCreateDodoCustomer` and cancel's local status update use `getAdminClient`
after the Member's company membership is proven via the user-scoped profile
(ADR-0004 incremental billing RLS audit).

### 4. Dual-track subscriptions preserved

A company may hold an active `wallet_anchor` (payment mandate for on-demand
charges) and one active normal plan (`starter_*` / `ent_*`) at once. Cancel
semantics match source: wallet → immediate; normal → `cancel_at_period_end`.

### 5. `BILLING_STUB` for E2E

When `BILLING_STUB` is `1`/`true` (Playwright injects it for `E2E_TARGET=new`),
Dodo API calls are skipped: checkout returns a same-origin return URL,
top-up/change-plan succeed without charging, cancel still updates local rows
when present, and invoice returns a minimal PDF. Live paths require
`DODO_PAYMENTS_API_KEY`.

## Consequences

- Credits from successful payments land when the #14 webhook grants them
  (ADR-0019); #13 starts the charge/checkout and surfaces history already in DB.
- Usage tab (#30) adds recharts daily + by-service charts and a per-Job table
  via `fetchUsageStats`, styled with `--chart-*` tokens.
