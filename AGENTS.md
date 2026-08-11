# AGENTS.md

Notes for any agent working in this repo (`talsek_start` — Talsek ATS on TanStack Start).

## Look up documentation first

Prefer verified docs over memory for fast-moving stacks:

- Use **Context7** for TanStack Start/Router, `@supabase/ssr`, Vercel AI SDK, shadcn/ui, and Tailwind v4.
- Capture any non-obvious API or product decision as an ADR under `docs/adr/`.

## Verify before committing

Require green:

- `bun run typecheck`
- `bun run build` (Nitro Vercel preset → `.vercel/output`)
- `bun run lint`

E2E when the change touches product journeys:

- Behavioural: `bun e2e` (needs `E2E_EMAIL` / `E2E_PASSWORD` in `.env.local`)
- Layout/UX structure: `bun run e2e:layout-parity` (see `e2e/layout-parity/`)

Prefer extending an existing journey over adding a near-duplicate sign-in test.

## Read these first

- `CONTEXT.md` — glossary / ubiquitous language.
- `docs/adr/` — architectural decisions. Do not contradict without a new ADR.

## Conventions

- Package manager: `bun`.
- Layout: `src/server/fn/` (server functions), `src/server/lib/` (server lib), `src/server/middleware/` (middleware), `src/routes/` (file routes), `src/integrations/` (Supabase types, query provider).
- DB access is user-scoped via `runAsUser`/RLS; `adminClient` is only for session-less operations (ADR-0004).
- When a server function awaits anything that touches Supabase auth, call `flushCookies()` on the returned client **synchronously after the await** — see `src/server/lib/supabase.ts`. This is the documented fix for Set-Cookie not reaching the `_serverFn` response.
