# Reachout send on single Shortlist

Ticket #20 restores behavioural Shortlist: send a Reachout rendered from the
stage's Reachout Template, then advance the Job Application. ADR-0013 / 0016 /
0021 deferred this to a later ticket; this record captures the send-path
decisions without contradicting 0001–0022.

## Decisions

### 1. One user-scoped server function — `shortlistJobApplication`

Source `bulk-shortlist-candidates` (service role) handles both single and bulk.
This ticket ports the **single** path only (#21 covers bulk Reachout). The
handler lives in `src/server/fn/job-applications.ts` and delegates to
`src/server/lib/reachout-send.ts`: personalize → optional Interview Session →
Resend via `sendResendEmail` → insert `sent_reachout_emails` → update
`current_stage_id`. All DB writes use `context.supabase` (ADR-0004).

### 2. `canSendReachout` is authoritative in the server function

UI disables / explains when the flag is false; the server function rejects
with a clear error if the Profile lacks `canSendReachout` (ADR-0004 capability
pattern, same as `canCreateJob` / `canManageTemplates`).

### 3. Mid-flow template save allows `canSendReachout`

`hasTemplate` is `reply_to_email` non-empty (source parity). Missing template
opens a setup dialog instead of dead-ending. `saveReachoutTemplate` accepts
`canManageTemplates` **or** `canSendReachout` so Shortlisting Members can
create the stage template mid-flow (source did not gate mid-flow save on
`canManageTemplates`).

### 4. EMAIL_STUB observable effect = `sent_reachout_emails`

Under `EMAIL_STUB=1`, Resend is no-op but the row is still inserted with
`status: 'sent'` and `sendgrid_message_id` prefixed `stub-`. Playwright asserts
that row plus the resulting Job Stage — not a live inbox. `sent_reachout_emails`
UPDATE is service-role-only, so the row is inserted in its final status after
send/stub succeeds (no sending→sent update on the user client).

### 5. Interview Session on interview-template Shortlist

When the next Hiring Stage is "Screening Interview", Shortlist creates (or
reuses) an `interview_sessions` row and substitutes `{{interview_link}}`
server-side before send — source parity. Credit check for interview shortlist
remains a client UX gate (source); charge still happens at interview start.

## Consequences

- Card Shortlist opens an editable confirm dialog (or template setup first).
- Bulk shortlist remains stage-only until #21 reuses `sendReachoutAndAdvance`.
- `moveJobApplicationStage` remains for non-Reachout stage moves.
