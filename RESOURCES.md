# TanStack Start Resources

> High-trust sources only. Knowledge is drawn from these, not from parametric guesses. Wisdom is sought in the communities below.

## Knowledge

- [Docs: TanStack Start Overview](https://tanstack.com/start/latest/docs/framework/react/overview)
  Authoritative framing — **Start = TanStack Router (100% of routing) + a server layer** (SSR, server functions, API routes, middleware). Use for: the big-picture mental model and feature list.
- [Docs: Execution Model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
  **The foundational concept.** Isomorphic-by-default, the server/client boundary, and the execution-control APIs (`createServerFn` / `createServerOnlyFn` / `createClientOnlyFn` / `createIsomorphicFn`). Use for: lesson 1, and any "where does this run?" question.
- [Docs: Selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)
  Per-route `ssr: true | false | 'data-only'` and exactly what runs where in each mode. Use for: SSR options and hydration behaviour.
- [Docs: Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection)
  `.server.*` / `.client.*` file suffixes and `server-only` / `client-only` side-effect imports that keep server code out of client bundles. Use for: the security side of the boundary.
- [Docs: Middleware](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
  `createMiddleware({ type: 'function' }).client().server()` and how `.server()` enriches the handler's `context`. Use for: lesson 3.
- [Docs: Authentication server primitives](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-server-primitives)
  The `authMiddleware &rarr; context.session` pattern. Use for: lesson 3 and the auth-guard pattern.
- [Docs: TanStack Router](https://tanstack.com/router)
  Start's routing substrate — file-based routing, the route tree, search params, loaders. Use for: everything routing (lessons 2 & 4).
  - [Routing Concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts) (layout &amp; pathless routes),
    [File Naming Conventions](https://tanstack.com/router/latest/docs/routing/file-naming-conventions),
    [File-Based Routing](https://tanstack.com/router/latest/docs/routing/file-based-routing).
- [Repo: Talsek Start (this workspace)](./src)
  Real, idiomatic Start app (an ATS). Uses **Supabase Auth**; **server functions** for all data access (`src/server/fn/`, e.g. `jobs.ts`, `auth.ts`) with `authMiddleware` injecting a user-scoped `context.supabase`; **API routes** only for webhooks + cron (`src/routes/api/webhooks`, `src/routes/api/cron`); pathless layouts `_marketing` (public) and `_member` (authed). Use for: **every hands-on example.** No tRPC.

## Wisdom (Communities)

- [TanStack Discord](https://tgdsc.gg/tanstack)
  Official community; `#start` and `#router` channels with core maintainers present. Use for: ambiguous API behaviour, Release-Candidate-stage gotchas.
- [r/Tanstack (Reddit)](https://www.reddit.com/r/Tanstack/)
  Use for: shared patterns, migration notes, broader discussion.
- [TanStack Router GitHub (Discussions & Issues)](https://github.com/TanStack/router)
  Start lives in the `router` repo. Use for: bugs, authoritative answers, RC behaviour straight from maintainers.

## Gaps
- No canonical "patterns cookbook" yet — Start is Release Candidate. Fill ad-hoc from Discord / GitHub as patterns surface in lessons.
- Community links above are **not yet verified to resolve** — confirm before strongly recommending in a lesson.
- This vehicle uses **no tRPC**; if the user later works on a tRPC-on-Start project, add a tRPC resource then.
