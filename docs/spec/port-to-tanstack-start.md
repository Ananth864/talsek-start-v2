# Spec: Port Talsek to TanStack Start on Vercel

> Source: `talsek/` (Vite SPA + React Router + Supabase Edge Functions, on Vercel).
> Target: `talsek-start-v2/` (TanStack Start SSR on Vercel).
> This spec synthesises a grilling session; the frozen decisions live in
> `docs/adr/0001`–`0007`, and the canonical domain language lives in
> `CONTEXT.md`. Vocabulary below is drawn from that glossary.

## Problem Statement

Talsek today is a single-page app (Vite + React Router) backed by 27 Supabase
Deno Edge Functions. This shape carries costs the team wants gone: an SPA client
waterfall on every dashboard load, business logic split across a fragile Deno
edge layer and a browser client, two coexisting form libraries, an installer's
worth of unused framework scaffolding, and a transport (React Router, edge
functions) the team no longer wants to maintain. The team has chosen TanStack
Start as the replacement framework and wants the whole product moved onto it —
keeping every user-facing capability and the existing look and feel — while
removing the accumulated garbage and restoring a single, type-safe,
server-authoritative architecture.

## Solution

Rebuild the product on TanStack Start (SSR, React 19, TanStack Router) deployed
to Vercel via the Nitro preset. Keep the Supabase data, identity, realtime, and
storage layers intact; replace the edge-function layer with TanStack server
functions (plus plain API routes for streaming and third-party webhooks, and
Vercel Cron for scheduled jobs). Make the server the single authority: reads go
through user-scoped Supabase clients so Row-Level Security owns company scoping,
and the redundant manual company-filtering scattered across the client hooks is
deleted. Port the existing Vercel AI SDK resume/interview/email pipeline
near-verbatim. Regenerate the shadcn component set fresh into Tailwind v4, with
the current HSL theme values preserved verbatim so the product looks identical.
Ship behind a tracer bullet that proves the whole stack end-to-end before
replicating across the product's five domains.

## User Stories

### Authentication & access
1. As a Member, I want to sign in with email and password, so that I can reach my company's dashboard.
2. As a Member, I want to sign in with Google OAuth, so that I can avoid managing another password.
3. As a new visitor, I want to sign up and have my account created against the existing Supabase Auth user store, so that my identity carries over unchanged.
4. As a Member who forgot my password, I want to request a reset email, so that I can regain access.
5. As a Member, I want to set a new password from a reset link, so that I can sign back in.
6. As a new Member, I want my email confirmed before first login, so that my account is verified.
7. As a Member, I want my session to persist via httpOnly cookies across SSR renders, so that I see an authenticated page on first paint with no client-side auth waterfall.
8. As a Member, I want protected routes to redirect me to sign in when I lack a session, so that I never see a half-rendered protected page.
9. As an Applicant, I want to open a Job's application Form via its token URL with no account, so that I can apply without signing up.
10. As an Applicant, I want to open my Interview via its token URL with no account, so that I can take the interview without signing up.
11. As a malicious actor, I want to be rate-limited when I hammer token endpoints, so that I cannot abuse the public Applicant surface.

### Jobs
12. As a Member, I want to see a server-rendered list of my company's Jobs on first paint, so that the dashboard feels instant.
13. As a Member, I want to create a Job, so that I can start collecting applicants.
14. As a Member, I want to paste a raw job description and have it parsed into structured requirements, so that I do not hand-author them.
15. As a Member, I want to edit a Job's requirements after creation, so that I can refine what the pipeline scores against.
16. As a Member, I want to view a single Job's details and pipeline, so that I can manage its applicants.
17. As a Member, I want to configure a Job's application Form (questions, enabled state, expiry), so that Applicants submit the right information.
18. As a Member, I want my Job creation gated by the `canCreateJob` permission, so that only authorised Members can open roles.

### Candidates & the pipeline
19. As a Member, I want to view all Job Applications for a Job rendered on first paint, so that I can review applicants without waiting.
20. As a Member, I want each Job Application's parsed resume data and match score shown, so that I can triage quickly.
21. As a Member, I want to see a Job Application's Processing Status (processing / active / failed / failed_validation / rejected), so that I know whether the AI pipeline has finished.
22. As a Member, I want new and updated Job Applications to appear live via realtime without a manual refresh, so that my view stays current.
23. As a Member, I want to move a Job Application between Hiring Stages, so that I can advance candidates through the pipeline.
24. As a Member, I want to Shortlist a Job Application by sending a Reachout rendered from a Reachout Template, so that I can contact a candidate.
25. As a Member, I want Shortlist gated by the `canSendReachout` permission, so that only authorised Members can contact candidates.
26. As a Member, I want to reject one or many Job Applications, so that I can dismiss poor fits.
27. As a Member, I want to bulk-upload many resumes at once for a Job, so that I can import a pipeline of candidates.
28. As a Member, I want to bulk-shortlist candidates, so that I can move many forward at once.
29. As a Member, I want to star a Job Application, so that I can flag it for later.
30. As a Member, I want to export candidate data, so that I can work with it outside Talsek.
31. As a Member, I want candidate reads scoped strictly to my own company, so that I can never see another company's data.

### The AI pipeline
32. As a Member, I want each uploaded resume to be run through Resume Extraction, so that structured candidate data appears without manual entry.
33. As a Member, I want Job Match Analysis to run automatically once Resume Extraction completes, so that every candidate is scored against the Job.
34. As a Member, I want the Resume Extraction → Job Match Analysis chain to be reliable, so that a candidate is never left half-processed.
35. As a Member, I want Email Analysis to summarise an inbound candidate email's substance, so that I can assess it quickly.
36. As a Member, I want the AI pipeline to fall back across providers on failure, so that a single provider outage does not stall extraction.
37. As a Member, I want Job-description parsing to produce targeted interview questions, so that I can assess role readiness.

### Interviews (Applicant-facing)
38. As an Applicant, I want to start an Interview from my token and see my first question, so that I can begin.
39. As an Applicant, I want to record audio answers and have them transcribed, so that I can respond by voice.
40. As an Applicant, I want to answer manual-input, boolean, and display-only questions, so that the interview flows correctly.
41. As an Applicant, when I answer an AI-conversation question I want the AI to decide between a follow-up or moving on, so that the interview adapts to my answers.
42. As an Applicant, I want the Interview to complete cleanly and record my session, so that the Member can review it.
43. As an Applicant, I want an expired Interview token to be rejected, so that stale sessions cannot be used.

### Forms & applying (Applicant-facing)
44. As an Applicant, I want to load a Job's application Form from its token, so that I can see what to fill in.
45. As an Applicant, I want to submit my application including my resume, so that I am considered for the role.
46. As an Applicant, I want my large resume upload to succeed, so that I am not blocked by request-size limits.
47. As a Member, I want submitted Form Submissions to create Job Applications and trigger the AI pipeline, so that new applicants flow in automatically.

### Billing
48. As a Member, I want to start a Dodo checkout for a plan, so that I can subscribe.
49. As a Member, I want to change my plan, so that I can scale up or down.
50. As a Member, I want to cancel my subscription, so that I can stop billing.
51. As a Member, I want to top up credits, so that I can keep using paid features.
52. As a Member, I want auto-refill to purchase credits when my balance runs low, so that I am never interrupted.
53. As a Member, I want to download an invoice, so that I can do my accounting.
54. As Dodo's billing system, I want my signed webhook to update subscription and payment state, so that billing stays in sync with the provider.

### Team & admin
55. As an admin Member, I want to invite a new Member to my company, so that my team can collaborate.
56. As an admin Member, I want to resend an invite, so that a Member who lost their link can still join.
57. As an admin Member, I want to update a Member's permissions, so that I can control who can create Jobs, send Reachouts, manage templates, and manage forms.

### Reachouts & templates
58. As a Member, I want to manage Reachout Templates, so that I have reusable message bodies for contacting candidates.
59. As a Member, I want template management gated by the `canManageTemplates` permission, so that only authorised Members edit them.
60. As a Member, I want Form management gated by the `canManageForms` permission, so that only authorised Members edit application forms.

### Notifications & email
61. As a Member, I want to receive email notifications about pipeline events, so that I stay informed without watching the dashboard.
62. As a Member, I want to configure my notification preferences, so that I control what I am emailed about.
63. As a Member, I want a daily digest of activity, so that I get a summary rather than per-event noise.
64. As an Applicant, I want a Cal.com booking to trigger a confirmation email, so that scheduling is confirmed.
65. As a Member, I want inbound candidate emails to be received and processed, so that candidate replies are captured.

### Foundations & non-functional
66. As a Member, I want the app to look identical to the current product, so that the port is invisible to me.
67. As a Member, I want fast server-rendered pages across dashboard, candidates, and billing, so that the app feels snappier than the old SPA.
68. As a Member, I want runtime errors captured in Sentry, so that the team can diagnose issues I hit.
69. As a Member, I want my session and company scoping enforced even when a developer forgets a manual filter, so that my data is safe by default.
70. As an operator, I want the whole stack to deploy to Vercel as a single project, so that there is one deployment surface.
71. As a developer, I want full end-to-end type safety from UI through server function to database, so that refactors are caught at compile time.

## Implementation Decisions

> Frozen rationale lives in `docs/adr/`. This section records the decisions, not the reasoning.

**Supabase stays as the full platform (ADR-1).** Postgres, Auth, Realtime, and Storage all remain. Only the edge-function layer is discarded. Auth transport migrates from the SPA `AuthContext` (localStorage) to `@supabase/ssr` with httpOnly cookies, validated inside a TanStack Start auth middleware.

**TanStack server functions are the primary RPC; tRPC is removed (ADR-2).** All app-internal edge functions become `createServerFn` server functions grouped by domain. Plain API routes are used only where plain HTTP is required: streaming/SSE responses and third-party webhooks. The installer's tRPC scaffold and demo routes are deleted. Input validation via Zod on each server function's `.validator()` plus inferred return types gives full end-to-end type safety with no code generation; `superjson` is retained for richer serialization across the boundary.

**Deploy on Vercel, not Cloudflare (ADR-3).** The build targets the Nitro Vercel preset; the installer's Cloudflare wiring (`@cloudflare/vite-plugin`, `wrangler.jsonc`, `instrument.server.mjs`) is removed. Rationale: full Node runtime, 2–4 GB memory, function durations long enough to run the AI pipeline synchronously, and the product already lives on Vercel. A consequence is that **no queue layer is introduced** — the edge functions' fire-and-forget chaining becomes direct awaited calls. A second consequence: **large binaries never transit the server**; Applicants upload resumes/audio directly to Supabase Storage and server functions receive a storage path, respecting Vercel's request-body limit.

**User-scoped DB access on the server; RLS owns company scoping (ADR-4).** Protected server functions build a per-request Supabase client from the cookie session (`runAsUser`), so Row-Level Security enforces company scoping as the single source of truth and the redundant manual `.eq('company_id')` filtering across the client hooks is deleted. The service-role admin client is reserved only for genuinely session-less operations: webhooks, cron, and the public Applicant token flows. Fine-grained capabilities (`canCreateJob`, `canSendReachout`, `canManageTemplates`, `canManageForms`, held on `Profile.permissions`) stay enforced in application code within each server function, since they are application concepts rather than row-level ones. An RLS audit is performed **incrementally per domain** as each domain's server functions are ported.

**Applicant token flows use one parameterised middleware.** A single `candidateTokenMiddleware({ kind: 'interview' | 'form' })` validates the token against the relevant table, loads the session/config row into context, and enforces IP rate limiting. It is the symmetric counterpart to the session auth middleware and consolidates the token-lookup and rate-limit logic that the edge functions currently duplicate.

**Keep the Vercel AI SDK; remove TanStack AI (ADR-5).** The AI layer ports on the existing `ai` + `@ai-sdk/*` packages. The shared services module (hedged `generateObject` with provider fallback), the Resume Extraction runner, the prompt files, and the AI response schemas move into the server library; `Deno.env.get` becomes validated `process.env`. Every AI call is server-side structured work (extraction, transcription, interview tool-calling) rather than interactive streaming chat, so the installer's `@tanstack/ai` packages and demo resume-chat route are removed.

**Regenerate shadcn fresh, port the HSL theme verbatim (ADR-6).** shadcn components are re-added via the CLI into the new repo configured with the *existing* style (`style: "default"`, `baseColor: "slate"`), producing v4-native, React 19-ready components that speak the unified `radix-ui` package. The current HSL theme token values (including the Talsek blue `--primary: 222 45% 47.5%` and the sidebar tokens) are copied verbatim into v4's CSS-first stylesheet — sidebar token names are adapted to v4's naming — so the product is pixel-identical. A small set of custom assets is re-added by hand: the docs prose theme, custom scrollbar utilities, the `animate-throb` keyframe, and the `talsek` brand scale. `next-themes` is retained for SSR-safe theming; `tw-animate-css` is the sole animation plugin. Large bespoke components (the candidate profile dialog, the job creation dialog, the PDF renderer, the landing sections, the dashboard sidebar) port as application code with minimal React 19 and token patches — no redesign.

**Standardise forms on TanStack Form (no ADR — obvious consolidation).** The shadcn `ui/form.tsx` wrapper and the `react-hook-form` and `@hookform/resolvers` dependencies are removed; the shadcn regeneration skips the form component. `useAppForm`'s `fieldComponents` and `formComponents` slots are populated with a small typed shadcn-styled field kit, making it the single entry point for all forms and removing per-form UI drift.

**Hybrid data-fetching (ADR-7).** Initial page data is fetched in TanStack Router route loaders that call user-scoped server functions; `@tanstack/react-router-ssr-query` prefetches and dehydrates the Query Cache for SSR. After hydration, React Query owns mutations, optimistic updates, and realtime-driven refetches. Query keys stay identical to today, so the realtime invalidation bridge (`useJobApplicationsSubscription`) ports unchanged — it keys only on query-key arrays and is agnostic to whether data originated from a loader or a client query. The installer's tRPC-wired query provider is rewritten to a plain QueryClient plus the router-SSR-query dehydration setup.

**Realtime stays client-side.** The browser Supabase client (session restored from `@supabase/ssr` cookies) authorises channels via the user's access token, and Supabase filters payloads by RLS — automatically consistent with the user-scoped server access model.

**Rate limiting centralises in middleware.** Upstash Redis and `@upstash/ratelimit` are retained and work on Vercel. The per-function rate-limit logic currently duplicated across edge functions moves into the two middlewares (session auth and Applicant token).

**Observability and env.** The new repo's purpose-built `@sentry/tanstackstart-react` integration and `instrument.server.mjs` are adopted; the old `@sentry/react` and hand-rolled Sentry module are dropped. `@t3-oss/env-core` validates environment on both server and client.

**Email stays on Resend.** All outbound email (notifications, invites, reachouts, booking confirmations) continues to send via Resend; the inbound email webhook becomes a signed API route (its exact event payload format is to be confirmed during the notifications domain).

**Cron and webhooks map to Vercel primitives.** The two scheduled jobs (`daily-email-notifications`, `billing-auto-refill`) become Vercel Cron triggers hitting secret-guarded `/api/cron/*` routes. The Dodo billing webhook and the inbound email webhook become signed `/api/webhooks/*` API routes.

**Execution shape: tracer bullet then five domains.** Phase 0 stands up the thinnest end-to-end slice that exercises every architectural decision once (Vercel preset, env, Sentry, ported HSL theme, a couple of regenerated shadcn components, `@supabase/ssr` cookie client, the auth middleware, `runAsUser`, one server function, one route loader) and deploys green. Only then does domain work proceed, in dependency order: (1) Auth, (2) Core ATS including the AI pipeline, (3) Billing, (4) Applicant-facing Form and Interview, (5) cross-cutting notifications, admin, docs, reachout templates, and form customisation.

## Testing Decisions

**Primary seam: end-to-end characterisation tests with Playwright.** Good tests here assert external behaviour only — never framework implementation, because the implementation is precisely what is being replaced. There is no existing test prior art in the source repo (no test script, no test dependencies), so this seam is new.

The technique is characterisation: the Playwright specs are first authored and made green against the **running source app** to capture current behaviour, then the **same specs are replayed against the ported app** to verify parity. This directly enforces the spec's central success criterion (capability parity) and is inherently framework-agnostic.

Covered journeys span both access regimes: the Member surface (sign-in/OAuth, Job creation and job-description parsing, candidate pipeline and Processing Status, Shortlist/Reachout, bulk upload, Member management, billing checkout) and the Applicant surface (Form apply by token, Interview by token, audio transcription). Because the AI calls are non-deterministic, E2E **intercepts and mocks AI provider responses**, asserting the flow rather than the model output.

Runtime invariants that already exist (each edge function self-validates its output against a Zod schema via `safeParse`) are preserved as the pipeline is ported; they are treated as built-in contract checks, not as an additional test seam. Direct RLS-policy assertions are deliberately **not** introduced as a second seam; the incremental RLS audit (ADR-4) is instead verified through the E2E coverage of each domain plus careful policy review during porting.

**Parallel seam (layout/UX parity, spec #34 / ADR-0030):** a separate Playwright suite under `e2e/layout-parity/` asserts source-faithful structure and interaction for Member shell, Member product, Auth, and Applicant — never screenshots, never merged into the behavioural characterisation specs. A side-by-side checklist vs `talsek` is the manual companion.

## Out of Scope

- ~~Any visual or interaction redesign. The product must look and feel identical; the port preserves the existing theme and UX precisely.~~
  **Amended (post-port audit, Aug 2026):** behavioural parity remains mandatory
  — every capability in the user stories must exist and work. Visual parity is
  relaxed to *consistency with the ported design system* (the shadcn/Tailwind
  v4 theme): pages that were visually inconsistent in the source app may be
  cleaned up rather than reproduced faithfully. Characterisation tests assert
  behaviour, not pixels.
  **Amended again (layout/UX parity, Aug 2026 / spec #34, ADR-0030):** for
  **Member shell**, **Member product**, **Auth**, and **Applicant** (surfaces
  1–4), the Aug 2026 relaxation no longer covers layout structure or
  interaction UX. Those surfaces must be **source-faithful** in structure and
  interaction (information architecture, control order/placement, dialog and
  flow shape, denseness) against `talsek`. Ported design-system **paint**
  (colors, fonts, radii) may still differ unless paint breaks hierarchy or
  meaning. Marketing and documentation surfaces are **unchanged by this
  amendment** — they remain under the Aug 2026 paint-consistency bar and out of
  scope for the layout/UX workstream. Verification is a separate
  `e2e/layout-parity/` Playwright suite (structure/interaction only; no
  screenshots) plus a side-by-side checklist; do not merge into behavioural
  characterisation specs.
- Any change to the database schema, Row-Level Security intent, or the Supabase project itself. The new app points at the same Supabase project as the source; identity, data, and realtime carry over unchanged.
- Replacing the auth provider, introducing a message queue, or migrating to TanStack AI — all explicitly considered and rejected (ADRs 1, 3, 5).
- The source app's operation during transition. It keeps running against the shared Supabase project, with its edge functions remaining deployed but unused until cutover; eventual decommissioning is a separate piece of work.
- Reconciling the local working copy with any prior remote history. The fresh repo starts clean; pushing local state is a separate step.
- Native mobile clients (none exist).

## Further Notes

- Seven decision records are frozen in `docs/adr/0001`–`0007`, and the canonical domain language is captured in `CONTEXT.md` (Member vs Applicant, Job Application, Hiring Stage / Job Stage, Shortlist / Reachout, the Resume Extraction → Job Match Analysis → Email Analysis pipeline). Implementation should use this vocabulary consistently and treat the glossary as living.
- The tracer bullet (Phase 0) is the de-risking step: every architectural decision is exercised once before any domain replication begins. It should deploy green to Vercel before Phase 1 starts.
- Domain ordering is dependency-driven but may be reordered for business priority — notably Billing (revenue) or the Applicant-facing surface (launch-critical) could be pulled forward if commercial context demands it.
- Vercel's request-body limit (4.5 MB) is the concrete reason large binaries route through Supabase Storage; this is both a constraint and an improvement (binaries no longer buffer through the server).
