# Workspace moved to the Talsek Start repo

Status: active

The teaching **vehicle** changed (mission, goals, and lesson plan unchanged). We moved the workspace from the Personal Manager repo into **`talsek_port/talsek_start`** (an ATS/recruiting product). Recorded because it changes every concrete example future lessons reference.

Key differences a learner will see, and how they map to what was already taught:

- **Auth:** Personal Manager used Clerk (`@clerk/...`); Talsek uses **Supabase Auth** (`@supabase/ssr`). The auth guard is now `_member.tsx`'s `beforeLoad`, which calls the `getAuthState()` server function (`src/server/fn/auth.ts`) via `queryClient.ensureQueryData` and redirects to `/signin` if there's no user. (Personal Manager's guard was a `requireAuth` server fn called directly in `beforeLoad`.)
- **Data access:** Personal Manager split domain CRUD across **tRPC over an API route**; Talsek uses **server functions for everything** (`src/server/fn/*.ts`) — e.g. `fetchJobs` (GET), `createJob` (POST). There is **no tRPC** in this repo.
- **The auth-middleware pattern is now first-class teaching material:** `authMiddleware` (`src/server/middleware/auth.ts`) is a real `createMiddleware({ type: 'function' }).server(...)` that does `next({ context: { supabase, session } })` — the canonical "enrich the handler's context" example, used by every protected server function (RLS scoping rides on that user-scoped `context.supabase`).
- **API routes** here are webhooks + cron (`src/routes/api/webhooks/{dodo,cal-booking,email}`, `src/routes/api/cron/*`) — the cleanest possible "external needs a URL" examples (Dodo payments webhook = POST from an outside service). The streaming-chat API route from Personal Manager is gone.
- **Routing examples remapped:** pathless layout `_authed` → `_member` (authed) + `_marketing` (public); splat example `api.trpc.$` → `docs/$.tsx` (`/docs/*`); dynamic params → `apply.$token`, `interview.$token`.

Implications: drop the tRPC thread from lessons 2 & 3 and the server-function-vs-API-route contrast (now a clean two-way split). The `authMiddleware → context.supabase` pattern becomes the anchor for Lesson 3's middleware section and Lesson 4's loader/beforeLoad lesson. All `src/...` example links in the rewritten lessons now resolve against this repo.
