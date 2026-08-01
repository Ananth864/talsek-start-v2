# talsek-start-v2

TanStack Start (SSR) port of the Talsek ATS, deployed to Vercel. Supabase stays
as the data + identity layer; the Supabase Edge Functions are replaced by
TanStack server functions.

- **Spec:** `docs/spec/port-to-tanstack-start.md` (and issue #1)
- **Decisions:** `docs/adr/0001`–`0007`
- **Glossary:** `CONTEXT.md`

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

E2E (characterisation; same specs run against source or new app):

```bash
bun e2e:install
E2E_TARGET=new E2E_EMAIL=… E2E_PASSWORD=… bun e2e
```

Deploy (after `vercel link`):

```bash
bun run deploy
```
