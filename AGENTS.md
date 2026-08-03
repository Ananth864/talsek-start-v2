# AGENTS.md

Notes for any agent working in this repo (`talsek_start`, the TanStack Start port of the Talsek ATS).

## Look up documentation first

This port targets **TanStack Start** (new, fast-moving) and **`@supabase/ssr`** (SSR cookie/auth patterns changed across versions). Prefer verified docs over memory:

- Use **Context7** (`context7_resolve-library-id` then `context7_query-docs`) for: TanStack Start/Router, `@supabase/ssr`, Vercel AI SDK, shadcn/ui, Tailwind v4.
- The **source app** at `../talsek` is the behavioural reference for *what* to port (React Router SPA + 27 Supabase edge functions). Read it to match UX and business logic, not framework idioms.
- Capture any non-obvious API fact you relied on as an ADR under `docs/adr/`.

## Verify before committing

Run all of these and require green:

- `bun run typecheck`
- `bun run build` (Nitro Vercel preset → `.vercel/output`)
- `bun run lint`
- ~~`bunx playwright test` with `E2E_TARGET=new`~~ **Paused for the port-completion batch (#19–#33).** Do not run Playwright until re-enabled. Writing/updating specs remains optional.

When implementing tickets (#19–#33 / `bun run orchestrate`), follow the `/implement` skill: implement → typecheck/build/lint → `/code-review` → commit → close the issue.

The E2E suite covers product journeys only — not brittle SSR HTML probes or cancel-only smoke. Prefer extending an existing journey over adding a near-duplicate sign-in test.

## Read these first

- `CONTEXT.md` — glossary / ubiquitous language.
- `docs/adr/0001-0007` — frozen architectural decisions. Do not contradict without a new ADR.
- `docs/spec/port-to-tanstack-start.md` — the spec.
- GitHub issues `Ananth864/talsek-start-v2` #2–#17 — tracer-bullet tickets (one `/implement` session each, fresh context, worked from the ticket).
- Port-completion follow-up: spec #18, tickets #19–#33. Work the frontier with `bun run orchestrate` (see `scripts/orchestrate-tickets.ts`); model is `grok-4.5` with `effort=high` and `fast=true`. Requires `CURSOR_API_KEY` in `.env.local`.

## Conventions

- Package manager: `bun`. Node required via `brew install node`.
- Layout: `src/server/fn/` (server functions), `src/server/lib/` (server lib), `src/server/middleware/` (middleware), `src/routes/` (file routes), `src/integrations/` (Supabase types, query provider).
- DB access is user-scoped via `runAsUser`/RLS; `adminClient` is only for session-less operations (ADR 0004).
- When a server function awaits anything that touches Supabase auth, it must call `flushCookies()` on the returned client **synchronously after the await** — see `src/server/lib/supabase.ts`. This is the documented fix for Set-Cookie not reaching the `_serverFn` response.
