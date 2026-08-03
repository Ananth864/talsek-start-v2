# Job wizard logistics restorations + success / card copy actions

Ticket #28 restores what the #5 2-step collapse deferred: logistics fields on
Job create, a post-create success dialog with copy actions and an opt-in Form
Config shortcut, and one-click copy of forwarding email / apply link on job
cards. Amends ADR-0010 §7 (full screening form deferred; form-config step
deferred). Does not contradict 0001–0028. No schema changes.

## Decisions

### 1. Keep the 2-step dialog; logistics live on step 1 for `resume_interview`

Parent spec #18 keeps details → review. Logistics (joining date, location mode
including Remote (In Country), hybrid arrangement, shift, travel) appear when
service type is Resume + interview — source step-2 parity without restoring
the 4-step wizard. Values map through `buildScreeningInfo` into
`screening_interview_information` so Shortlist / interview-question generation
(`reachout-send`) reads joining, location mode/location, and shift (source
parity: travel % and hybrid arrangement are stored but not yet consumed by
question text). A short logistics context block is also appended to the JD
text passed into `parseJobDescription` so the parse input reflects those
fields; the verbatim parse prompt still excludes soft travel/location prefs
from extracted preferred / non-negotiable lists.

### 2. Success dialog replaces the forced form-config wizard step

After `createJob` returns `{ id, forwardingEmail }`, the create dialog closes
and `JobCreationSuccessDialog` opens with copyable forwarding email, next-step
guidance, and an opt-in "Configure application form" control that opens the
existing `JobFormConfigDialog` (stories 30–31). Apply-form link copy appears
once a Form Config exists (after that shortcut save + jobs refetch) — there is
no automatic form-config insert on create.

### 3. Job-card copy actions mirror the source JobsList

Each card exposes copy-forwarding-email when `forwarding_email` is set, and
copy-apply-link when Form Config is enabled, has a token, and is not expired
(`getJobApplyFormLink`). Clicks `stopPropagation` so board selection is
unchanged.

## Consequences

- ADR-0010 §7's "full screening form deferred" and "form-config step deferred"
  are superseded for create UX by this record; Job Details remains a Form
  Config entry point (ADR-0026).
- Non-admin `canCreateJob` Members still fail at RLS on INSERT (ADR-0010).
