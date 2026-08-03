# Jobs write path: create + JD parse, RLS audit

Ticket #5 builds the **write path** for Jobs on top of the #4 read path: a Member
creates a Job via the ported `JobCreationDialog`, a pasted job description is
parsed into structured requirements, and the created Job appears in the list.
`canCreateJob` is enforced. This record captures the non-obvious decisions and
the domain's **write-path RLS audit** (ADR-0004 is incremental per-domain); it
does not contradict 0001–0009.

## Decisions

### 1. The create + parse edge functions become two user-scoped server functions

The source's `create-job` and `parse-job-description` Deno edge functions
(both invoked via `supabase.functions.invoke`) become `createJob` and
`parseJobDescription` server functions in `src/server/fn/jobs.ts`, composed
through the same `authMiddleware` as the read path (ADR-0002/ADR-0004). The
client invokes them directly as RPCs (`createJob({ data })`); the
edge-function HTTP transport is gone. `companyId` is **no longer sent by the
client** (the source trusted a client-supplied `companyId`); it is derived from
the verified session's profile inside `createJob`.

### 2. `canCreateJob` is enforced authoritatively in the server function

The source gated Job creation **only** on the client (`JobsList` checked
`profile.permissions.canCreateJob` and the edge function performed no capability
check). The port keeps the client gate for UX (the Create-Job button is hidden
when `canCreateJob` is false) **and** adds the authoritative check inside
`createJob`: it loads the Member's profile, throws a clear error if
`canCreateJob` is falsy, and only then attempts the INSERT. This is the
ADR-0004 application-capability pattern (`profiles.permissions` checks live in
the fn, not in RLS).

### 3. The INSERT runs on the user-scoped client — RLS owns it (admin-only consequence)

The source's `create-job` edge function used the **service-role admin client**,
bypassing RLS entirely. The port inserts on `context.supabase` (the user-scoped
client), so the existing `jobs` INSERT policy applies:

```sql
CREATE POLICY "Admins can create jobs" ON jobs FOR INSERT TO authenticated
  WITH CHECK (public.user_is_company_admin(company_id));
```

`user_is_company_admin` requires `profiles.role = 'admin'` for `auth.uid()` in
that company. This is a **row-level** check, distinct from the `canCreateJob`
capability flag. The practical consequence: **in the port, only company admins
can create Jobs at the DB layer**, whereas the source (having bypassed RLS)
allowed any member with `canCreateJob = true` to create Jobs regardless of role.

This is accepted as a deliberate hardening, not a regression to chase:

- ADR-0004 forbids the service-role client for session-bearing operations; the
  spec's "Out of Scope" forbids changing RLS. So both levers are fixed.
- The first Member of a company is made `admin` by the
  `handle_company_first_user` trigger, so the primary account (and the E2E
  Member, which owns real Jobs) is an admin and the INSERT succeeds.
- If non-admin Job creation becomes a product requirement, the fix is an RLS
  policy change (a separate, schema-touching decision) — **not** reverting to
  the admin client. Tracked as a follow-up below.

The `forwarding_email` / `forwarding_code` generation, the `{id, text, include}`
requirement wrapping (ids `preferred_<n>` / `non_negotiable_<n>`), and the
best-effort `job_stages` creation (lookup global Hiring Stages by name, insert
Job Stages in order, never fail the request on stage errors) all port verbatim.

### 4. The JD parse ports the hedged `generateObject` reliability layer

`parseJobDescription` ports the source's `generateObjectWithRetry`
(`src/server/lib/ai/ai-services.ts`) — a hedged `generateObject` (a second
parallel attempt fires after 120 s if the primary hasn't settled; 200 s
deadline) with a single provider fallback. Primary is OpenAI `gpt-5-mini`,
fallback is xAI `grok-4-fast-reasoning`, exactly as the source's
`parse-job-description` edge function configures. The prompt
(`getJobDescriptionParsingPrompt`) and the `jobParsingSchema` (Zod) are ported
verbatim — they are the core IP of the parse. `Deno.env.get` becomes the
validated `serverEnv` (ADR-0005); the `ai` + `@ai-sdk/openai` + `@ai-sdk/xai`
deps are installed. Gemini + Groq are not yet wired (the JD parse does not use
them); they land with the resume/email AI domains that do.

### 5. Deterministic parse fallback when no provider keys are configured

The testing decision (ADR/spec) is that E2E mocks the non-deterministic AI
output. In the source this was a browser-side intercept of the edge-function
HTTP call. In the port the parse runs **server-side**, so there is no
browser request to intercept. Rather than wire a server-side mock HTTP target,
`parseJobDescription` returns a **deterministic derivation** from the pasted JD
when no provider key is present (`OPENAI_API_KEY`/`GROK_API_KEY` absent). This
makes the parse → review → create flow fully exercisable in dev and E2E without
credentials, while production (keys set) runs the real `generateObject`. The
fallback always returns a valid `ParsedJobData` shape; the dialog allows manual
editing either way.

### 6. Serialization: the Jobs JSON columns are narrowed and re-added to the read select

ADR-0009 §1 omitted `parsed_job_data` and `screening_interview_information` from
the canonical Jobs select because they were placeholder-typed (`unknown`) and
the default server-function serializer rejects `unknown` across the boundary.
With #5 owning these shapes they are narrowed to concrete types
(`ParsedJobDataJson`, `ScreeningInterviewInformationJson` in
`src/integrations/supabase/json-types.ts`), making them serializable. Both
columns are **re-added to `jobsQuery`** (additive — `JobWithCompanyRow` widens,
no fork in the cache). This is the sanctioned long-term fix short of registering
superjson as the server-function serializer (still open).

### 7. The dialog is a focused 2-step port; the form-config step is deferred

> **Amended (ADR-0029, layout-parity Aug 2026):** create UX is restored to the
> source **4-step** wizard (screening → details → requirements → form setup).
> The paragraph below is historical context for the #5 collapse.

The source's `JobCreationDialog` is a 4-step wizard (service type → details →
review → application-form config). This port collapses it to the two steps the
#5 acceptance criteria exercise — **details** and **review parsed requirements**
— and defers the application-form-config step to #11/#12 (Applicant Form). Parse
fires on the details → review transition (source parity: not a button, onPaste,
or debounce). The full screening-interview form (shift timings, travel %) is
also deferred; `screening_interview_information` is built from the dialog's
service-type + location-type selection with sensible defaults (source parity for
`resume_only`; a minimal valid shape for `resume_interview`). The query-key
invalidation (`['jobs']` prefix, source parity) makes the created Job appear in
the list via a refetch — no optimistic update, since the server is the authority
and the final row shape is only correct post-insert.

## RLS audit — Jobs write path (ADR-0004)

Confirms company scoping + capability enforcement for the write path:

- **`createJob` INSERT** runs on `context.supabase` (user-scoped). RLS policy
  "Admins can create jobs" re-validates `user_is_company_admin(company_id)` at
  Postgres. No service-role client is used (ADR-0004). The `company_id` written
  is read from the verified session's profile, never from the client.
- **`canCreateJob`** is checked in the fn (application capability) **before**
  the INSERT; RLS provides the independent row-level admin backstop. Both must
  pass.
- **`job_stages` INSERT** is covered by the existing "System can create job
  stages" policy (`WITH CHECK (true)`); it only ever inserts stages for the
  just-created Job (whose `job_id` the caller already owns). Best-effort, logged
  on failure, never fails Job creation.
- **`hiring_stages` SELECT** (to resolve stage ids by name) is covered by the
  existing "Public can view hiring stages" policy for `authenticated`.
- **`parseJobDescription`** performs no DB access; it composes `authMiddleware`
  so only a verified session can invoke it.

### Follow-ups (non-blocking)

- If non-admin Members must create Jobs, add an RLS INSERT policy keyed on
  `canCreateJob` (a schema change — separate decision). Until then, grant
  `role = 'admin'` to Members who must create Jobs.
- Wire `@sentry/tanstackstart-react` `captureException` into `logAIError` /
  `generateObjectWithRetry` failure paths when the cross-cutting observability
  domain lands (currently console-logged, faithful to source classification).
- Port the Gemini + Groq providers into `ai-services.ts` when a domain exercises
  them (resume/email extraction).
- Register `superjson` as the server-function serializer to remove the last
  serialization caveat (open since ADR-0009).
