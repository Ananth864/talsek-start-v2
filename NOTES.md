# Teaching Notes

## User profile (baseline — session 1)
- **React + TypeScript:** comfortable but rusty. Refresh uncommon hooks/types briefly when used; do not teach fundamentals.
- **Framework background:** React Router only. No SSR / meta-framework experience. → Lean on React-Router analogies; the server/client boundary is NEW and must be made explicit in early lessons.
- **Goal:** verification fluency, not memorisation. Teach mental models + pattern recognition so the user can read Start code, spot non-idiomatic AI output, and direct AI. Syntax reference docs serve this; do not drill rote syntax.

## Teaching preferences
- Hands-on examples should reference the **Talsek Start repo (`src/`)** — real, idiomatic code the user owns.
- Prefer "does this look right?" exercises (catch the red flag) over "write from memory" exercises.

## Vehicle (workspace) — MOVED
- **Was:** the Personal Manager repo (`/Users/ananthacharya/Documents/personal manager`) — Clerk auth, server-function auth guards, tRPC-over-API-route for CRUD, raw API route for streaming chat.
- **Now (session 4):** the **Talsek Start** repo (`talsek_port/talsek_start`) — an ATS. Supabase Auth; **server functions for all data access** (`src/server/fn/`, e.g. `fetchJobs`, `createJob`, `getAuthState`); `authMiddleware` (`src/server/middleware/auth.ts`) injects a user-scoped `context.supabase`; **API routes only for webhooks + cron** (`src/routes/api/webhooks`, `src/routes/api/cron`); pathless layouts `_marketing` (public) and `_member` (authed).
- **Net effect on lessons:** drop the tRPC thread entirely (this repo has none) → the server-function-vs-API-route contrast is a clean two-way split. Remap all concrete examples. See [LR-0004](./learning-records/0004-workspace-moved-to-talsek-start.md).

## Planned lesson arc
1. **Execution model — what runs where** (server / client / isomorphic). [DONE — 0001]
2. File-based routing & the route tree (React Router → TanStack Router; codegen; layouts / pathless routes; splat `docs/$`). [DONE — 0002; ref: routing.html]
3. Server functions in depth (`createServerFn`: validator → middleware → handler; `authMiddleware` → `context.supabase`; server-fn-vs-API-route). [DONE — 0003; ref: server-functions.html]
4. Loaders, `beforeLoad` & router context (data loading; the `_member` auth-guard pattern via `getAuthState` + TanStack Query).
5. API routes (`server.handlers`; `api/webhooks/dodo` as the webhook case; `api/cron/*`).
6. Middleware & `createStart` (request pipeline + server-function middleware; Supabase auth).
7. SSR options & hydration (`ssr: true | false | 'data-only'`, streaming).
8. Integrations (Supabase + TanStack Query SSR; how the pieces compose). _No tRPC in this vehicle._

## Todo for next sessions
- Glossary covers lessons 1–3; extend each lesson.
- Verify the community links in `RESOURCES.md` resolve before recommending strongly.
- Lesson-4 emphasis: the `_member` `beforeLoad` uses `queryClient.ensureQueryData` to call `getAuthState()` — a great combined loader/server-fn/auth example; teach the lifecycle there.
