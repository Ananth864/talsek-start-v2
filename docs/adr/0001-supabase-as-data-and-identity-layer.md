# Supabase stays as the data + identity layer

When porting from React Router + Supabase Edge Functions to TanStack Start on
Vercel, we keep all four Supabase pillars — Postgres, Auth, Realtime, and
Storage — and migrate only the *transport* for Auth from the SPA's localStorage
`AuthContext` to `@supabase/ssr` with httpOnly cookies, validated inside a
TanStack Start `authMiddleware`. Edge functions are the thing being discarded,
not Supabase itself.

## Considered options

- **Keep all four pillars (chosen).** Re-plumb only the auth transport. Minimal
  blast radius; preserves the data model, RLS policies, and identity provider.
- **Replace Auth with better-auth / custom JWT.** Rejected — doubles the scope of
  the port for no functional or UX gain, and re-implements what Supabase Auth
  already does (OAuth, magic links, password reset).

## Consequences

- Every protected server function composes `authMiddleware` to read the session.
- Supabase service-role key lives server-side only; client uses the anon key +
  RLS.
- Realtime token flow must be re-issued from the cookie session under SSR.
