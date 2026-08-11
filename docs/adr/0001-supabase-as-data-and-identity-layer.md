# Supabase stays as the data + identity layer

Talsek on TanStack Start keeps all four Supabase pillars — Postgres, Auth,
Realtime, and Storage — and uses `@supabase/ssr` with httpOnly cookies for
Auth, validated inside a TanStack Start `authMiddleware`, instead of the SPA
localStorage `AuthContext` pattern. Server-side business logic runs in TanStack
Start server functions, not Supabase Edge Functions; Supabase itself stays the
data and identity layer.

## Considered options

- **Keep all four pillars (chosen).** Re-plumb only the auth transport. Minimal
  blast radius; preserves the data model, RLS policies, and identity provider.
- **Replace Auth with better-auth / custom JWT.** Rejected — doubles the scope
  for no functional or UX gain, and re-implements what Supabase Auth
  already does (OAuth, magic links, password reset).

## Consequences

- Every protected server function composes `authMiddleware` to read the session.
- Supabase service-role key lives server-side only; client uses the anon key +
  RLS.
- Realtime token flow must be re-issued from the cookie session under SSR.
