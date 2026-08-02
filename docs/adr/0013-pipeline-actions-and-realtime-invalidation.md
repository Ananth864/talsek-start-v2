# Pipeline actions + realtime invalidation

Ticket #8 builds the **mutation layer** over the candidate board (#6/#7): Members
star, reject, and advance Job Applications between Job Stages. The Realtime
subscription already mounted in #6 is tightened to the source's event-type
narrowing so local mutations do not double-fetch. This record captures the
non-obvious decisions and the write-path RLS consequence; it does not contradict
0001–0012.

## Decisions

### 1. Three user-scoped server functions — not client Supabase UPDATEs

The source mutates `job_applications` from the browser client
(`useToggleStarred`, `useRejectCandidate`) and advances stage inside the
`bulk-shortlist-candidates` edge function (service role). The port places all
three writes behind server functions in `src/server/fn/job-applications.ts`
(`toggleJobApplicationStarred`, `rejectJobApplication`, `moveJobApplicationStage`),
composed through `authMiddleware` (ADR-0002/ADR-0004). The client never holds a
direct write path to business tables.

### 2. Shortlist advances stage only — Reachout send is deferred

In the source, **Shortlist** = send a Reachout (edge fn) **then** update
`current_stage_id`. Ticket #8's acceptance criteria ask for move / star /
reject; Reachout templates and bulk shortlist are separate tickets (#16 / #10).
The card's Shortlist control therefore confirms a stage transition
(current → next Job Stage via `nextStageForApplication`) and calls
`moveJobApplicationStage`. The Reachout send + `sent_reachout_emails` /
`interview_sessions` side effects are **not** ported here. The confirmation copy
states the deferral so Members are not surprised.

### 3. Realtime invalidation matches the source's event narrowing

Issue #8 asks to port the invalidation bridge unchanged *with respect to query
keys* ("it keys on query-key arrays"). #6 blanketed `event: '*'` as a temporary
simplification before mutations existed. With mutations live, that double-fetches
against the mutation's own `invalidateQueries`. The bridge now matches the
**source** `useJobApplicationsSubscription` and invalidates only on:

- `INSERT` (new application — AC: live without refresh)
- `UPDATE` where `current_stage_id` changed
- `UPDATE` where `status` changed

Other UPDATEs (notably `starred`) are skipped; `useToggleStarred` invalidates
`['job-applications']` itself. Query key shapes stay identical to the source
(`['job-applications', jobId, companyId]`, `['job-stages', jobId, companyId]`).

### 4. UPDATE RLS remains admin-only (same hardening as ADR-0010 INSERT)

The UPDATEs run on `context.supabase` (user-scoped). The existing policy is:

```sql
-- "Admins can update job applications for their company jobs"
-- USING / WITH CHECK: user_is_company_admin(jobs.company_id)
```

Non-admin Members with board access will see the UI but the write fails at RLS
(surfaced as the card's inline error). This matches the #5 create-job
hardening: ADR-0004 forbids service-role for session operations; the spec's Out
of Scope forbids changing RLS. The E2E Member is a company admin (first user
trigger), so the happy path works. If non-admin pipeline actions become a
product requirement, the fix is an RLS policy change — not `adminClient`.

### 5. No optimistic cache surgery on reject

The source optimistically removed the rejected row from non-rejected list
caches. The port's board status window includes `rejected` (#6 / ADR-0011), so
the card should remain visible with a Rejected badge. Mutations invalidate and
refetch (ADR-0010 pattern); Realtime also refreshes on status change.

## Consequences

- Card actions are interactive; stage advance does not send email yet.
- Starred toggles refresh via mutation invalidation only (Realtime skips them).
- Non-admin UPDATE failures are expected under current RLS until a policy change.
- Follow-up: wire Reachout send into Shortlist (#10/#16); optionally optimistic
  star flip; revisit per-stage infinite query + stage-scoped invalidation.
