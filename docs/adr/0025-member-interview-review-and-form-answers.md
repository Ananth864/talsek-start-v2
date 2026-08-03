# Member interview review + form answers in profile

Ticket #22 closes the Member read path for Applicant Interview Sessions and
Form Submissions in the candidate profile dialog. Read-only; no schema
changes. Supersedes the empty-state deferrals in ADR-0012 §3 and ADR-0017
consequences.

## Decisions

### 1. User-scoped server functions, not browser Supabase

Source `useInterviewSession` / `useFormSubmission` query the client Supabase
directly. The port adds `fetchInterviewSession` and `fetchFormSubmission`
behind `authMiddleware` + RLS (ADR-0004), matching every other Member read
path. Query keys stay source-shaped (`['interview-session', applicationId]`,
`['form-submission', candidateId, jobId]`) so later realtime/invalidation
ports cleanly.

### 2. Dialog owns the fetches (no prop-drill from every card)

Source cards fetch the session and pass `interviewSession` into the dialog.
The port loads both extras inside `CandidateProfileDialog` when `open` is
true (form fetch further gated by `processing_source === 'form'`). Avoids
N card queries on a populated board; behavioural parity for the Member who
opens a profile is identical.

### 3. Interview scoring + analysis ported verbatim

`computeInterviewScore` / `checkMeetsRequirements` move into `src/lib/`
unchanged. The Interview tab sections (Introduction, Profile Assessment with
`ConversationModal`, Motivation, Requirement Fit Check) and the header swap
from Match % to Interview % when a session exists match the source.

### 4. Form Answers use Form Config snapshot + template embed

`fetchFormSubmission` returns the submission row plus the Job's Form Config
with `form_templates(questions)`. Label resolution prefers the job-specific
`questions` snapshot (including empty, same rule as Applicant get-form),
falls back to the company template, and always includes mandatory labels so
keys like `phone` render as "Phone Number".

## Consequences

- Empty states remain for Job Applications with no Interview Session or no
  Form Submission (and Form Answers only appears for `processing_source ===
  'form'`).
- PDF Interview section stays empty-stated; shipping full PDF Q&A is a
  non-blocking follow-up (dialog is the Member review surface).
- Playwright seeds a completed session + form submission and asserts the
  Interview tab, conversation modal, and Form Answers section.
