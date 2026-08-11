# talsek-start-v2

Talsek ATS on TanStack Start (SSR), deployed to Vercel. Supabase is the data and
identity layer; product logic runs in TanStack server functions (plus API routes
for webhooks/streaming and Vercel Cron for scheduled jobs).

- **Glossary:** `CONTEXT.md`
- **Decisions:** `docs/adr/`
- **Agent notes:** `AGENTS.md`

## Getting started

```bash
cp .env.local.example .env.local   # fill in Supabase + E2E creds
bun install
bun run dev                         # http://localhost:3000
```

Verify:

```bash
bun run typecheck
bun run build                       # produces .vercel/output (Nitro Vercel preset)
bun run lint
```

E2E:

```bash
bun e2e:install
E2E_EMAIL=… E2E_PASSWORD=… bun e2e
E2E_EMAIL=… E2E_PASSWORD=… bun run e2e:layout-parity
```

Deploy (after `vercel link`):

```bash
bun run deploy
```
