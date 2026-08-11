# Mission: TanStack Start

## Why
Ship and maintain TanStack Start apps without leaning on AI as a crutch. The user currently relies on AI to write Start code because they don't understand the framework. The goal is to recognise the framework's patterns well enough to **direct AI deliberately, verify its output against the idiomatic shape, and modify existing apps** with confidence.

## Success looks like
- Read any file in the **Talsek Start** codebase (`talsek_start`) and explain what runs on the **server** vs the **client**, and why.
- Spot non-idiomatic or insecure Start code in AI output (a database call landing in client code, an unvalidated server function, a secret read at module scope) and correct it.
- Scaffold a new route, server function, and API route from a correct mental model, then use AI to **accelerate** — not to **decide**.
- Reason about Start's layered architecture (Router + Start server layer) when debugging, instead of cargo-culting snippets.

## Constraints
- **React + TypeScript:** comfortable but rusty. Refresh less-common hooks/types briefly when used; do not teach fundamentals.
- **Framework background:** React Router only — no SSR meta-framework. Start is their first. Lean on React-Router analogies; the server/client boundary and SSR are genuinely new and must be taught explicitly.
- **Vehicle:** the **Talsek Start** repo in this workspace (`talsek_start`, an ATS/recruiting product) is the primary hands-on example. It uses **Supabase Auth** (not Clerk), **server functions** for all data access (`src/server/fn/`), and **API routes** only for webhooks + cron (`src/routes/api/`). No tRPC. New projects will still be AI-assisted; fluency is for **verification and direction, not memorisation**.

## Out of scope (for now)
- React Server Components (Start's RSC support is experimental; not on the critical path).
- Deployment/adapter internals beyond awareness (a Vercel adapter is configured).
- Deep Supabase / TanStack Query / Dodo-payments internals — covered only where they intersect with Start.
