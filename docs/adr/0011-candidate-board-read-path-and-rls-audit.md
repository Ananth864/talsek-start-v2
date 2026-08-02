# Candidate board: SSR read path, Realtime, RLS audit

Ticket #6 builds the read path for the candidate pipeline — the second Core ATS
domain on top of the auth/Jobs seams. The dashboard's right pane becomes the
selected Job's candidate board: a server-rendered, stage-tabbed list of Job
Applications showing parsed candidate data, match score, and Processing Status
on first paint, kept fresh by the port's first Realtime subscription. This
record captures the non-obvious decisions and the domain's RLS audit
(ADR-0004 is incremental per-domain); it does not contradict 0001–0010.

## Decisions

### 1. One job-wide candidate query behind user-scoped server functions; the manual company filter is deleted

`fetchJobApplications` (`src/server/fn/job-applications.ts`) is the single
candidate read path, composed through `authMiddleware` so the attached client is
the user-scoped one. It selects the Job's applications (embedding the
**Candidate** for email and the current **Job Stage** with its **Hiring
Stage**), filters to the board status window (`active` / `rejected`), and orders
by `final_score` descending — matching the source's `useCandidates` shape.

The source's `useCandidates` carried an explicit `.eq('job.company_id',
currentCompany.id)` (relying on the `!inner` join). That redundant filter is
**deleted** in the port: RLS on the user-scoped client returns only the
Member's company's applications (see the audit below). The `job` embed is
dropped too — RLS owns company scoping, and the selected Job's context already
arrives from the Jobs list. `fetchJobStages` (the pipeline, ordered by
`stage_order`) is the companion read.

### 2. The board uses a job-wide query grouped client-side, not the source's per-stage infinite query

The source serves the board from `useInfiniteCandidatesByStage` — a paginated
per-stage query keyed `['candidates-by-stage-infinite', jobId, stageId,
companyId]`. The port instead uses the source's job-wide `useCandidates` shape
(`['job-applications', jobId, companyId]`) and groups by stage client-side.
Rationale:

- **One SSR prefetch.** A single query is prefetched + dehydrated in the
  dashboard `loader` (keyed on the `?jobId=` search param via `loaderDeps`), so
  the whole board is present in the first-paint HTML. Per-stage infinite queries
  are awkward to prefetch and hydrate for SSR.
- **Realtime parity preserved.** The Realtime hook predicate-matches on the
  `'job-applications'` prefix, so invalidation still fires on every change to
  the Job's applications (a background refetch re-sorts the whole board).
- **Counts are derived, not a second query.** Stage counts come from grouping
  the applications by `current_stage_id`, so the source's `get_job_stage_counts`
  RPC (a SECURITY DEFINER function that takes `p_company_id` as a param) is not
  needed for the read path.

The per-stage pagination, the fit-category filter dropdown, the bulk-action
mode, and the card action controls (Shortlist / Reject / AI Analysis) are
write-path surfaces and port with the candidate write-path tickets. The query
**keys** the Realtime hook matches on stay verbatim, so those tickets port
unchanged.

### 3. Query keys match the source verbatim

The board keys are `['job-applications', jobId, companyId]` and
`['job-stages', jobId, companyId]` (`src/lib/job-applications-shared.ts`),
matching the source's `['job-applications', jobId, currentCompany?.id]` and
`['job-stages', jobId, currentCompany?.id]` exactly. The company id namespaces
the cache; the `'job-applications'` / `'job-stages'` prefixes are what realtime
and later mutations invalidate on.

### 4. `ResumeExtractionJson` narrowed to a concrete shape (serialization)

`parsed_candidate_data` is displayed on the board, so the column is selected.
The default server-function serializer rejects `unknown`-typed columns at
compile time (ADR-0009 §1); `ResumeExtractionJson` was previously
`Record<string, unknown>` (loose). It is narrowed here to the concrete
`resumeExtractionSchema` shape (verbatim from the source), which both makes the
column serializable and gives the card typed accessors. `ai_analysis`
(`JobMatchCoreAnalysis`, still loose) and `email_content` are **not selected**
by the board — the card derives requirement badges from the denormalised
`preferred_requirements_matched` + `meets_all_non_negotiables` columns and the
match score from the persisted `final_score`. The full `ai_analysis` shape ports
with the candidate match/write domain, at which point it re-enters the select.

### 5. Match score is the persisted `final_score`; the dynamic recompute is deferred

The source recomputes the displayed score client-side via
`computeDynamicScore` (re-weighting `match_score` by live requirement-meet
counts). The read path renders the persisted `final_score` (the column the
board is `ORDER BY`), which is the pipeline's normalised score. For the read
path — where the Job's requirements are not edited — the two coincide. The
dynamic recompute ports with the candidate write-path domain.

### 6. Realtime: first subscription, ported client-side

`useJobApplicationsSubscription` (`src/hooks/use-job-applications-subscription.ts`)
is the port's first Realtime bridge (ADR-0007). It mirrors the source: one
Supabase Realtime channel per selected Job, scoped to `job_applications` rows
for that Job (`filter: job_id=eq.${jobId}`), invalidating the React Query caches
that own the board. Because reads go through user-scoped server functions
(ADR-0004), the client never reads business data directly — but Realtime
channels still authorise via the user JWT on the browser client, and RLS filters
the payloads, so the invalidation is the only client-side effect. It is mounted
at the Dashboard level (not inside `CandidatesList`) so the channel lives across
board re-renders, matching the source.

### 7. SSR prefetch via `loaderDeps`

The dashboard route reads `?jobId=` into the loader with `loaderDeps`, and the
loader calls `queryClient.ensureQueryData` for the candidate + stage queries
when a Job is held in the URL. The `@tanstack/react-router-ssr-query`
integration dehydrates the cache, so the board is present in the first-paint
HTML. Selections made client-side (clicking a Job) fire the query after the
navigation; the stage is carried by `?stageId=` (source parity) and defaulted to
the first stage by `CandidatesList` when absent.

## RLS audit — Job Applications domain (ADR-0004)

The audit confirms company scoping is enforced by RLS as the single source of
truth for this domain, with no redundant manual filtering in the application
layer:

- **`fetchJobApplications`** issues
  `from('job_applications').select(...).eq('job_id', …).in('status', …)` with
  **no** `.eq('job.company_id', …)`. The source's `useCandidates` carried that
  explicit company filter; it is deleted here (ADR-0004/ADR-0007). RLS owns it:
  the `job_applications` SELECT policy is
  `"Users can view job applications for their company jobs" … USING (EXISTS
  (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND
  user_belongs_to_company(jobs.company_id)))`.
- **`fetchJobStages`** issues `from('job_stages').select(...).eq('job_id', …)`
  with no company filter. Its SELECT policy is
  `"Users can view job stages for their company jobs"` with the same
  `user_belongs_to_company(jobs.company_id)` predicate via the job relation.
- No service-role (`adminClient`) access is used on this domain — both functions
  compose `authMiddleware`, so every read is user-scoped. The `job_applications`
  Realtime channel authorises with the user JWT; RLS filters the payloads.

Follow-ups (non-blocking): the candidate write-path tickets (stage move,
reject, shortlist) will use the admin-only UPDATE policy
(`"Admins can update job applications for their company jobs"`,
`user_is_company_admin`) — the same admin-only INSERT consequence noted in
ADR-0010 applies to UPDATE/DELETE, and must be honoured (a non-admin Member
moving a candidate is an RLS policy change, not a revert to the admin client).
The `get_job_stage_counts` RPC (SECURITY DEFINER, takes `p_company_id`) is not
used by the read path; if a later ticket adopts it, its SECURITY DEFINER
scoping should be re-checked against the user-scoped caller.
