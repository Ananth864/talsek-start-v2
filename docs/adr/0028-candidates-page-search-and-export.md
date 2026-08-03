# Candidates page: cross-job search + Excel/PDF-ZIP export

Ticket #27 ports the source's `/candidates` surface — company-wide Job
Application search with composable filters and client-side Excel / PDF-ZIP
export — onto TanStack Start. This record captures the non-obvious decisions;
it does not contradict 0001–0027.

## Decisions

### 1. User-scoped `fetchCandidateSearch`; RLS owns company scoping

The source's `useCandidateSearch` filtered with
`.eq('job.company_id', currentCompany.id)`. The port deletes that filter:
`fetchCandidateSearch` runs on the auth-middleware client so RLS
(`user_belongs_to_company(jobs.company_id)` via the job relation) is the
single source of truth (ADR-0004), matching the board read path (ADR-0011).

The select reuses `jobApplicationsQuery` (same shape as the board / profile
dialog) so adaptive cards and the PDF renderer consume familiar rows. Job
context for cards and export comes from the existing `fetchJobs` cache keyed
by `job_id`, not a heavier per-row job embed.

### 2. All six filters apply server-side on persisted columns

| Filter | Server predicate |
|--------|------------------|
| name | `ilike('candidate_name', …)` |
| Job | `eq('job_id', …)` |
| Hiring Stage | `eq('current_stage.hiring_stage.name', …)` |
| starred | `eq('starred', true)` |
| min match score | `gte('final_score', …)` |
| fulfilled non-negotiables | `eq('meets_all_non_negotiables', true)` |

The source applied min-score and fulfilled-NN **client-side** via
`computeDynamicScore`. The port uses the persisted columns instead so the
filter runs with the query (spec #18 "server-side filtering") and stays
aligned with the board's `final_score` headline (ADR-0011 §5). Excel export
still recomputes dynamic scores for the Match Score column (source parity).

At least one filter is required (Zod refine + disabled Search button); URL
params rehydrate and auto-search on load (source parity).

### 3. Export stays client-side; ZIP reuses the PDF renderer

- **Excel** (`xlsx`): eight columns, workbook download — `export-candidates.ts`.
- **PDF-ZIP** (`jszip` + existing `generateCandidateProfilePdf`): mount
  `CandidateProfilePDFRenderer` off-screen, rasterise each
  `[data-pdf-candidate]`, zip blobs. `html2canvas-pro` remains (ADR-0012).

Cross-job improvement over the source: Excel and the PDF renderer resolve
requirements via `jobsById.get(app.job_id)` so each row uses its own Job,
not only the optional Job filter.

### 4. Results use the adaptive CandidateCard (#26)

One card with `layout` from `profiles.candidate_list_view`; stage kind from
the application's Hiring Stage. Shortlist is a cross-job variant of
`useShortlistActions` that resolves Job + Job Stages per application.
Stages for visible job ids are fetched with `useQueries` + `fetchJobStages`.

## RLS / access audit

No new policy surface: `fetchCandidateSearch` is user-scoped; no
`adminClient`; no manual company filter. Mutations already audited for the
board continue to invalidate `['candidate-search']` so the page refreshes
after star / reject / Shortlist.

## Follow-ups (non-blocking)

- Nested stage filter without `!inner` matches the source; if PostgREST
  ever stops filtering parent rows that way, switch the stage-filtered
  select to `job_stages!inner`.
- E2E (`e2e/candidates-page.spec.ts`) is written but the Playwright suite
  is paused for the port-completion batch — re-enable with the suite.
