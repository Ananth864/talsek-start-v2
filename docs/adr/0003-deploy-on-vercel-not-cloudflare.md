# Deploy on Vercel, not Cloudflare Workers

The new TanStack Start app targets Vercel via the Nitro `vercel` preset, not
Cloudflare Workers. This reverts an earlier inclination toward Workers and
removes the Cloudflare wiring the installer added (`@cloudflare/vite-plugin`,
`wrangler.jsonc`, `instrument.server.mjs`).

## Considered options

- **Vercel (chosen).** Full Node.js runtime (so `xlsx`, `jspdf`, `html2canvas`,
  `node-fetch` work server-side unmodified); 2–4 GB memory vs Workers' 128 MB;
  function duration up to 800s (1800s extended beta) vs Workers' CPU ceiling,
  letting the resume-extraction → job-match-analysis chain run synchronously in
  one request; the existing app is already on Vercel so domain/env/DNS/billing
  carry over with zero infra migration; Vercel Cron is built-in.
- **Cloudflare Workers.** Rejected — `nodejs_compat` is not full Node; 128 MB
  memory ceiling pressures PDF/audio workloads; and although CPU time is
  raisable to 5 min, Vercel's longer durations remove the need for a queue layer
  for the chained AI pipeline.

## Consequences

- **No queue layer.** The fire-and-forget `fetch()` chain in `resume-extraction`
  becomes a direct `await` on the job-match server function. Cloudflare Queues
  are not introduced.
- **4.5 MB request body limit** — large binaries (audio, bulk resume uploads)
  must upload directly from the client to Supabase Storage; server functions
  receive a storage path, never raw bytes. `resume-extraction` already follows
  this pattern; `transcribe-audio` and `bulk-resume-upload` are refactored to
  match.
- **Cron** uses Vercel Cron hitting secret-guarded `/api/cron/*` routes.
