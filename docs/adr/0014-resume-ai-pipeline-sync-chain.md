# Resume AI pipeline: synchronous in-process chain

Ticket #9 ports Resume Extraction → Job Match Analysis → optional Email
Analysis. The source chained three fire-and-forget edge functions behind the
service role. This record captures how the port collapses that chain and how
it relates to RLS, stubs, and Realtime.

## Decisions

### 1. One awaited request — no fire-and-forget

ADR-0003 chose Vercel so the chain can run synchronously (up to function
duration limits) without a queue. The port's
`processJobApplicationPipeline` awaits Extraction, then Match, then Email
(when `processing_source === 'email'`) inside a single server-function
invocation. There is no internal `fetch()` hop. Acceptance criterion: the
whole step completes within one request.

### 2. Shared lib + Member server fn; session-less callers pass adminClient

The orchestrator lives in `src/server/lib/ai/process-job-application-pipeline.ts`
and accepts any `SupabaseClient`. The Member-facing
`processJobApplicationPipelineFn` (`src/server/fn/resume-pipeline.ts`) proves
ownership with an RLS SELECT, then runs the pipeline on the **user-scoped**
client — same admin-only UPDATE RLS consequence as ADR-0010/0013 (E2E Member
is company admin). Session-less entry points (#11 form/email, #10 bulk) will
import the lib and pass `getAdminClient()` after their own token/auth checks
(ADR-0004). No service-role bypass for ordinary Member sessions.

### 3. Provider pairs match the source; Gemini is wired

| Step | Primary | Fallback |
|---|---|---|
| Resume Extraction | Gemini 2.5 Flash | OpenAI GPT-5 Mini |
| Job Match (core + requirements) | OpenAI | Grok |
| Email Analysis | OpenAI | Gemini |

Hedging + single fallback stay in `generateObjectWithRetry` (ADR-0005).
`GEMINI_API_KEY` and `@ai-sdk/google` land with this ticket. Groq remains
unwired as a language-model primary/fallback.

### 4. Write shapes match the board/profile read path

Extraction writes `candidate_name` + `parsed_candidate_data`
(`ResumeExtractionJson`). Match writes `match_score` (0–25), `final_score`
(0–100 via `computeDynamicScore`), `meets_all_non_negotiables`,
`preferred_requirements_matched`, and `ai_analysis` (`AIAnalysisJson` with
`overall_fit_score` + enriched requirement details). Email merges
`email_content.email_analysis` without clearing `email_body`. Status:
`processing` (during extract) → `active` on match success; failures →
`failed` / `failed_validation`. Email failures are soft (status stays
`active`). Insufficient credits throw without marking failed (source 402
parity).

### 5. Deterministic stub for E2E / no credentials

Live hedged AI calls are multi-minute and non-deterministic. When
`AI_PIPELINE_STUB=1`/`true` (Playwright webServer sets this) **or** no
provider keys are configured, the pipeline writes deterministic
`ResumeExtractionJson` / match / email shapes, skips Storage download and
credit consume, and still exercises the sync status + DB write path.
Production leaves the flag unset.

### 6. Explicit query invalidation after score writes

Realtime (ADR-0013) skips score/`ai_analysis`-only UPDATEs. The
`useProcessJobApplicationPipeline` hook invalidates
`JOB_APPLICATIONS_QUERY_KEY_PREFIX` on success so the board and profile
refresh after a Member re-run. Session-less callers (#10/#11) should
invalidate the same prefix (or rely on INSERT/status Realtime events when
status changes).

### 7. Member "Re-run AI" on the profile dialog

Primary product triggers remain form/email/bulk (#11/#10). This ticket adds
a profile-dialog **Re-run AI** control so Members (and E2E) can invoke the
sync chain against an existing Job Application with a `resume_url`.

## Consequences

- #10 bulk can call `processJobApplicationPipeline` with `skipExtraction: true`
  after inline extract, or run the full chain.
- #11 form/email should `await processJobApplicationPipeline(admin, …)` before
  responding (or accept Vercel duration limits).
- Non-admin Members hit UPDATE RLS on pipeline writes until a policy change.
- Follow-up: Sentry `captureException` on pipeline failures; optionally expose
  Processing Status UI for `pending`/`processing`/`failed` rows.
