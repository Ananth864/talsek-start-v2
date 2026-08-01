# User-scoped DB access on the server; RLS owns company scoping

Protected server functions build a **per-request Supabase client from the
cookie session** (`runAsUser`), so Row-Level Security enforces company scoping
as the single source of truth. The service-role `adminClient` is reserved for
operations that have **no user session**: webhooks, cron, and the public
candidate flows (interview, apply, form-submit) that authenticate via a token
lookup. Fine-grained member permissions (`canCreateJob`, etc., on
`profiles.permissions`) stay enforced in application code within the server
function, since they are application concepts, not row-level ones.

## Considered options

- **User-scoped on server (chosen).** Deletes the redundant manual
  `.eq('company_id')` re-filtering scattered across the hooks (RLS owns it);
  matches TanStack Start's SSR strengths (route loaders read with the user's own
  privileges); keeps Realtime and Storage working because the client still holds
  the user JWT.
- **Service-role everywhere (faithful to edge functions).** Rejected — ports the
  repetitive manual-filtering pattern verbatim, and every forgotten filter is a
  data-leak.
- **Service-role + no direct client DB access.** Rejected — breaks Supabase
  Realtime (channels authorize via the user JWT) and client Storage uploads.

## Consequences

- An **RLS audit** is required, done **incrementally per domain** as each
  domain's server functions are ported (port billing fns → audit billing RLS →
  port candidate fns → audit candidate RLS). It is not a gate-0 blocker.
- `profiles.permissions` checks live inside server fns (or an
  `authorizationMiddleware`), not in RLS.
- Session-less ops (webhooks, cron, candidate token flows) keep using
  `adminClient` with their existing token-lookup / signature-verification auth.
