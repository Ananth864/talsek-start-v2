# Jobs read path: SSR list, search-param selection, RLS audit

Ticket #4 builds the read path for Jobs — the first **Core ATS** domain on top of
the auth seam from #2/#3. The dashboard renders a server-rendered list of the
Member's company Jobs on first paint, a Job can be selected, and company scoping
comes from RLS with no manual `company_id` filters. This record captures the
non-obvious decisions and the domain's RLS audit (ADR-0004 is incremental
per-domain); it does not contradict 0001–0008.

## Decisions

### 1. One canonical Jobs query behind a user-scoped server function; `*` is enumerated

`fetchJobs` (`src/server/fn/jobs.ts`) is the single read path, composed through
`authMiddleware` so the attached client is the user-scoped one (RLS owns
company scoping — ADR-0004). It orders `created_at` descending and embeds the
owning **Company** and the Job's **Form Config**, matching the source's
`selectJobsWithCompany` shape.

The columns are **enumerated explicitly rather than `*`** (as the source does).
Two JSON columns — `parsed_job_data` and `screening_interview_information` — are
placeholder-typed (`unknown` / `Record<string, unknown>`) for the AI-pipeline and
interview-config domains and are neither part of the Jobs list/detail read
surface nor provably serializable across the server-function boundary (the
default TanStack Start serializer rejects `unknown` at compile time). They are
omitted until their domains land a concrete type, at which point they are added
back to this same select. Because there is one canonical select keyed under
`['jobs', companyId]`, expanding it is additive and does not fork the cache.

### 2. Query keys match the source verbatim; `['jobs', companyId]`

The list key is `['jobs', companyId]` (`jobsQueryKey`, `src/lib/jobs-shared.ts`),
matching the source's `['jobs', currentCompany?.id]` exactly. The company id
namespaces the cache; invalidations use the `['jobs']` prefix (create/update
mutations; realtime does not touch `jobs`, only `job_applications`), so later
realtime/mutation tickets (#5, #8) port unchanged. The company id is read once
in the route `beforeLoad` via `fetchMemberProfile` and flows into the loader (for
the prefetch key) and the component (for cache reads) through the route context —
so the loader-prefetched and the component-read keys are identical.

### 3. Prefetch + dehydrate for SSR first paint; selection is client-side

The route `loader` calls `queryClient.ensureQueryData(jobsQueryOptions(...))`; the
`@tanstack/react-router-ssr-query` integration (wired in `src/router.tsx`)
dehydrates the cache into the SSR payload, so the Jobs list is present in the
first-paint HTML (ADR-0007). No client waterfall.

Job selection is **URL search-param driven** on `/dashboard` (`?jobId=` and
`?jobSearch=`), faithful to the source: there is no `/jobs/:id` route, and the
selected Job is resolved from the (full) list result by id, so it stays available
even when filtered out of view. Selecting a Job updates the search params
(`replace: true`) and opens its detail context (the right-hand pane); the first
Job auto-selects when none is held. This establishes the two-pane dashboard the
candidate-pipeline tickets extend.

### 4. The Member's company context is loaded in the guard, not re-derived per query

`fetchMemberProfile` returns the Member's `profiles` row (company membership +
capability flags + embedded Company), scoped by an **identity filter**
(`id = session.user.id`) on top of RLS. It is called once in the dashboard
`beforeLoad`, immediately after the verified-identity guard, so the company id
and the `permissions` capability flags (enforced in application code per
ADR-0004, e.g. `canCreateJob` in #5) are available without a per-query round
trip. This is the port's equivalent of the source's `AuthContext` profile load.

## RLS audit — Jobs domain (ADR-0004)

The audit confirms company scoping is enforced by RLS as the single source of
truth for this domain, with no redundant manual filtering in the application
layer:

- **`fetchJobs`** issues `from('jobs').select(...).order(...)` with **no**
  `.eq('company_id', …)`. The source's `useJobs` carried an explicit
  `.eq('company_id', currentCompany.id)`; that redundant filter is deleted in the
  port (ADR-0004/ADR-0007). RLS on the user-scoped client returns only the
  Member's company Jobs.
- **`fetchMemberProfile`** filters by `id = session.user.id` — an **identity**
  filter to read the *current* Member's own row, not a company filter. RLS still
  re-scopes at Postgres. This is legitimate and necessary (the `profiles` table
  is visible company-wide for team management, so the identity pick is what
  selects the current Member).
- No service-role (`adminClient`) access is used on this domain — both functions
  compose `authMiddleware`, so every read is user-scoped.

Follow-up (non-blocking): when the Jobs write paths land (#5 create/update), the
`canCreateJob` capability check must live inside the server function, and the
`job_form_configs` embed should be re-checked for a row-level policy that matches
the `jobs` policy's company scoping (it is read here only via the job's own RLS).
