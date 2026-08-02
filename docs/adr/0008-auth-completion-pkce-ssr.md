# Auth completion: PKCE SSR, verified guards, request-derived redirects

Ticket #3 completes the Member auth surface (sign-up, OAuth, forgot/reset,
confirm, protected-route guards) on top of the cookie-session seam from #2
(`src/server/lib/supabase.ts`, ADR-1, ADR-4). This record captures the
non-obvious API decisions relied on; it does not contradict 0001–0007.

## Decisions

### 1. SSR auth uses PKCE end-to-end; a `/auth/callback` route exchanges the code

`@supabase/ssr`'s `createServerClient` **forces `flowType: 'pkce'`** (verified in
`@supabase/ssr@0.12.4` source). Under PKCE, OAuth and email-link redirects
deliver a `?code=` query parameter — **not** a hash fragment — that must be
exchanged server-side via `exchangeCodeForSession(code)`. This is the inverse of
the source SPA, which relied on supabase-js's `detectSessionInUrl` to complete
the flow client-side with no callback route.

Consequences:

- OAuth uses `signInWithOAuth({ options: { skipBrowserRedirect: true } })`, which
  returns a consent URL the browser navigates to. The PKCE **code verifier is
  stored in a cookie by `setAll`**, so the auth mutation **must** `flushCookies()`
  before the browser leaves (otherwise the verifier is lost and code exchange
  fails) — the same flush-after-await discipline documented in AGENTS.md.
- A new `/auth/callback` route reads `?code=`, calls an `exchangeAuthCode` server
  function, flushes cookies, and redirects. The same `exchangeAuthCode` is reused
  by `/confirm-email` and `/reset-password`, whose email links also carry `?code=`
  under PKCE.

### 2. Route guards verify identity with `getClaims()`, not `getSession()`

`getSession()` reads tokens from the request cookie and returns a session object
whose fields are **not trusted** for authorization (a client can tamper with
cookie storage). Supabase flags this in the GoTrueClient TSDoc and the SSR
best-practices guide. During #2's E2E, Supabase emitted this warning.

The current best practice (available in `@supabase/ssr@0.12.4`) is
`supabase.auth.getClaims()`, which parses the access-token JWT and verifies its
signature — locally via WebCrypto for asymmetric keys (no network round-trip),
or against the Auth server for symmetric keys. Route `beforeLoad` guards and the
session-auth middleware now use a `getVerifiedUser()` helper built on
`getClaims()`, returning a minimal `{ id, email }` or `null`.

`requireUserClient()` (the RLS-scoped client builder used by `authMiddleware`)
verifies via `getClaims()` first, then reads the session tokens. RLS re-validates
the token at the Postgres layer on every query, so the session tokens are only
ever used as a carrier, never as an authorization decision. The lightweight
`getSession` *server function* that routes used to call is replaced by
`getAuthState()`.

### 3. Redirect URLs are derived from the incoming request, not an env var

The source SPA built redirect URLs from `window.location.origin`. Under SSR there
is no `window`. Rather than add a `SITE_URL` env var (which must be kept in sync
with the deployment and the Supabase allowlist), auth server functions derive the
origin from the request via `getRequestUrl({ xForwardedHost: true,
xForwardedProto: true })` (re-exported from `@tanstack/react-start/server`).
This resolves correctly on localhost (`http://localhost:3000`) and behind Vercel's
proxy (honoring `x-forwarded-host`/`x-forwarded-proto`).

The three redirect destinations, all built from the request origin:

- OAuth: `${origin}/auth/callback`
- Email confirmation: `${origin}/confirm-email`
- Password reset: `${origin}/reset-password`

**Operations follow-up (not a code blocker):** each of these origins (per
environment) must be added to the Supabase project's **Redirect URLs** allowlist,
or Supabase will silently substitute `site_url`. As of #2 the allowlist reflected
the source `talsek.com` domain. This is tracked alongside the other environment
steps from #2's handoff.

The sign-up → confirmation flow also assumes **Email confirmation is enabled** in
the project (`Auth → Email → Confirm email`). With it on (the source setting),
`signUp` returns no session and the user is routed to `/confirm-email`; with it
off, the same code path still works but confirmation is effectively a no-op (the
`/confirm-email` `beforeLoad` bounces an already-authenticated user to
`/dashboard`). This is an environment precondition, not a code branch.

### 4. Return-to-URL is carried through OAuth via a short-lived cookie

The acceptance criterion requires redirecting an unauthenticated visitor back to
their intended destination after sign-in. For email/password this is trivial: the
guard redirects to `/signin?redirect=<path>` and the client navigates there on
success.

OAuth cannot round-trip an arbitrary path through Google. `signInWithGoogle`
stashes the validated return path in an `auth-return-to` cookie; the callback
route reads and clears it after the code exchange. `redirect` params are
sanitized to relative paths (must start with `/`, must not start with `//`) to
prevent open-redirect abuse.

## Considered options

- **SPA-style `detectSessionInUrl` for OAuth.** Rejected — `createServerClient`
  disables it (it is a browser-only behaviour), and the verified-cookie model
  requires the server to perform the exchange so the session lands in an
  httpOnly cookie rather than `localStorage`.
- **`getUser()` for guards (handoff suggestion).** `getClaims()` supersedes it
  for the pure "is this a verified identity" decision: same verification
  guarantee, usually no network call. `getUser()` remains the choice only when
  fresh profile data is needed, which the guard does not require.
- **`SITE_URL` env var for redirects.** Rejected — request-derived origins are
  correct per-environment by construction and remove a configuration footgun.

## Consequences

- Every new auth mutation server function follows the existing
  `flushCookies()`-after-await discipline (AGENTS.md).
- The Supabase Redirect-URL allowlist and PKCE email-link behaviour are now load
 -bearing for sign-up confirmation, password reset, and OAuth — they are added to
  the environment checklist.
- `getSession()` remains in use only inside `requireUserClient()` (to obtain
  session tokens for the RLS client) and never as an authorization decision.
