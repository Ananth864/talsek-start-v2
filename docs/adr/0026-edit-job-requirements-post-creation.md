# Edit Job requirements post-creation

Ticket #23 lets a Member refine a Job's preferred and non-negotiable
requirements after creation (add / remove / include-exclude) from the Job
Details modal, so later pipeline scoring uses the refined lists. No schema
changes. Corrects the earlier port layout that inlined Job Details in the
dashboard pane — details are a Dialog opened from the job-card pencil control
(source parity; amends ADR-0009 §3).

## Decisions

### 1. Server function with `canCreateJob`, not browser Supabase

Source `useUpdateJobRequirements` UPDATEs `jobs` from the browser client with
no capability check. The port adds `updateJobRequirements` behind
`authMiddleware`, authoritative `canCreateJob` (Job management — same gate as
create), then a user-scoped UPDATE so RLS ("Admins can update jobs") still
owns company scoping (ADR-0004). Client hides Edit when `canCreateJob` is
false.

### 2. Job Details is a modal, not a dashboard pane

Source opens `JobDetails` as a Dialog from the card edit icon; list click only
selects the Job for the candidate board. The port matches that: `JobsList`
owns the modal open state; the right-hand dashboard pane is the board alone.

### 3. Add / remove in addition to include-exclude

Source JobDetails only toggled `include`. Spec story 12 and ticket #23 require
add and remove as well. The editor keeps stable requirement ids
(`preferred_n` / `non_negotiable_n`) when toggling or editing text, and
allocates the next free id on add so existing AI analysis keyed by id stays
aligned for unchanged rows.

### 4. Invalidate Jobs + Job Applications

On success the mutation invalidates `['jobs']` and `['job-applications']`
prefixes (source parity) so the card counts and candidate-board included
totals refresh. Persisted `final_score` on applications is unchanged until the
pipeline re-runs; included-count and dynamic profile scoring already read the
live Job lists.

## Consequences

- Non-admin Members with `canCreateJob` still fail at RLS on UPDATE (same
  hardening as create — ADR-0010). Fix would be an RLS policy change, out of
  scope.
- Empty-text rows are dropped on save; at least one included preferred and one
  included non-negotiable are required (source validation).
- Form Config is still reached from inside the Job Details modal (Configure /
  Edit form), matching the previous port entry point.