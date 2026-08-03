# Job wizard logistics restorations + success / card copy actions

Ticket #28 restored logistics fields, a post-create success dialog, and
job-card copy actions. **Amended (layout-parity, Aug 2026):** the create
dialog is restored to the source **4-step** wizard (screening → details →
requirements → form setup). This supersedes the earlier “keep the 2-step
dialog” decision. Amends ADR-0010 §7. Does not contradict 0001–0028 /
0030. No schema changes.

## Decisions

### 1. Four-step wizard matching `talsek` (amends prior 2-step collapse)

Parent product UX is the source `JobCreationDialog`:

1. **Select Screening Type** — resume-only vs resume + interview cards
2. **Job Details** — title, code, salary, JD; logistics when interview
3. **Review Requirements** — preferred / non-negotiables after AI parse
4. **Application Form Setup** — enable form + question builder (when
   `canManageForms`); otherwise an admin-later notice

AI parse still fires on the details → requirements transition (source
parity). Logistics map through `buildScreeningInfo` into
`screening_interview_information` (unchanged).

### 2. Form config in-wizard; success dialog keeps copy affordances

On confirm, `createJob` runs, then (when form enabled and permitted)
`upsertJobFormConfig` so the apply link can appear on the success dialog.
The post-create “Configure form” shortcut is no longer the primary path —
configuration happens on step 4. Success dialog still shows forwarding
email / apply link when available.

### 3. Job-card copy actions mirror the source JobsList

Each card exposes copy-forwarding-email when `forwarding_email` is set, and
copy-apply-link when Form Config is enabled, has a token, and is not expired
(`getJobApplyFormLink`). Clicks `stopPropagation` so board selection is
unchanged.

## Consequences

- ADR-0010 §7's “form-config step deferred” and the prior §1 “2-step only”
  reading of this ADR are superseded for create UX.
- Layout-parity E2E asserts `Step N of 4` and step-1 screening / step-2 details.
- Non-admin `canCreateJob` Members still fail at RLS on INSERT (ADR-0010).
