# Bulk Reachout + bulk reject

Ticket #21 completes bulk board actions: Shortlist sends a Reachout to every
selected Job Application (capped at 10, with a client credit check for
interview), and Members can bulk-reject selected rows after confirmation.
Supersedes ADR-0016 §4 (stage-only bulk shortlist).

## Decisions

### 1. Reuse `sendReachoutAndAdvance` per selected id

Source `bulk-shortlist-candidates` inlines send + advance for each application.
The port already extracted that path for single Shortlist (ADR-0023).
`bulkShortlistJobApplications` validates same-stage selection, `canSendReachout`,
and target Job Stage, then loops `sendReachoutAndAdvance` with the Member's
editable custom message. Failures are collected per id (partial success OK).
Live Resend keeps a 500ms delay between sends; `EMAIL_STUB` skips the delay.

### 2. Client credit gate for interview bulk Shortlist

Matching source `CandidatesList` and single Shortlist (#20): when the next
Hiring Stage implies the interview template, the UI blocks open if
`creditBalance < interviewCost * selectedCount`. Charge still happens at
interview start — the gate is UX, not a server ledger write.

### 3. Bulk reject is a confirmed batch status UPDATE

`bulkRejectJobApplications` sets `status: 'rejected'` for selected ids on the
Job (batches of 10, source `BulkRejectModal`). No `canSendReachout` requirement —
reject is independent of Reachout send. UI requires an explicit confirm dialog.

### 4. Template placeholders stay in the bulk dialog

Unlike single Shortlist (which pre-personalizes for one Candidate), the bulk
dialog shows the Reachout Template with placeholders so the server personalizes
per candidate. Mid-flow template setup reuses the same dialog as single
Shortlist when `reply_to_email` is missing.

## Consequences

- Board bulk Shortlist opens an editable Reachout dialog; Playwright asserts
  `sent_reachout_emails` (stub id) + stage advance at the existing bulk E2E seam.
- Bulk reject shows a Rejected badge without leaving the stage board window
  (`active` / `rejected`).
- ADR-0016 §4's "stage only" deferral is closed by this ticket.
