# Talsek

Talsek is an AI-assisted applicant-tracking system (ATS): recruiters create
**Jobs**, candidates apply via token-accessible **Forms** or sit AI
**Interviews**, resumes are parsed and scored by an AI pipeline, and recruiters
move applicants through hiring **Stages** with templated **Reachouts**. This
glossary captures the project's canonical language for the port — it is a living
document and grows as domains are built.

## People & access

There are two distinct access regimes. Keeping their names straight prevents
auth-logic drift (see ADR-1, ADR-4).

**Member**:
A recruiter or admin who belongs to a **Company** and authenticates with a
session. Capabilities are governed by `Profile.permissions` flags
(`canCreateJob`, `canSendReachout`, `canManageTemplates`, `canManageForms`).
_Avoid_: user, account.

**Applicant**:
An external candidate who has no account and acts through a single-use token —
either submitting an application **Form** or sitting an **Interview**. Auth is
the token lookup itself, plus rate limiting.
_Avoid_: candidate-session, guest.

## Core entities

**Company**:
The recruiting organization that owns **Jobs**, **Members**, and settings.
_Avoid_: tenant, workspace, organization.

**Job**:
A role a Company is hiring for; carries requirements, salary range, and a
linked **Form Config**. The central object recruiters configure.
_Avoid_: position, opening, requisition.

**Candidate**:
A person who applied to one or more Jobs; identified by email, carries a resume.
_Avoid_: applicant-profile (Applicant is the *role*; Candidate is the *person*).

**Job Application**:
A Candidate's application to a specific Job — the central object of the product.
Holds status, current **Stage**, parsed resume data (`parsed_candidate_data`),
match score, and the interview/submission history.
_Avoid_: application, submission (those mean other things here), entry.

**Profile**:
The database record for a **Member** — company membership (`company_id`) plus
the `permissions` capability flags. Company scoping of data is enforced by RLS
on the user's session; capabilities are enforced in application code.
_Avoid_: member-record, user-row.

## Pipeline & process

**Hiring Stage**:
A named, reusable step definition in a pipeline (e.g. "Screen", "Interview",
"Offer").
_Avoid_: step, phase.

**Job Stage**:
A **Hiring Stage** positioned at an order within a specific **Job**'s pipeline.
A **Job Application** points to its current Job Stage.
_Avoid_: pipeline-step.

**Processing Status**:
The lifecycle state of a Job Application as it moves through the AI pipeline:
`processing` → `active` (or `failed` / `failed_validation`); also `rejected`.
_Avoid_: state, application-state.

**Shortlist**:
The act of advancing a Job Application by sending the candidate a **Reachout**.
_Avoid_: select, advance, short-list-as-noun (Shortlisting is a verb here;
"shortlisted" is the derived state).

**Reachout**:
The outbound message sent to a candidate during Shortlisting, rendered from a
**Reachout Template**.
_Avoid_: message, email (a Reachout is *sent via* email but is not the email
itself).

**Reachout Template**:
A reusable, parameterized message body used to generate a Reachout.
_Avoid_: template (too generic), email-template.

## Candidate-facing surfaces

**Form Config** (per-Job application form):
The customizable application form attached to a Job, including any custom
questions via a **Form Template**. Applicants reach it through a token URL.
_Avoid_: application-form (ambiguous with the act of applying).

**Form Template**:
A reusable set of questions a Form Config can include.
_Avoid_: question-set.

**Form Submission**:
An Applicant's submitted form payload (`submission_data`) for a Job Application.
_Avoid_: application, response.

**Interview**:
An AI-mediated, token-accessed interview an Applicant takes for a Job
Application; stored as an **Interview Session**.
_Avoid_: interview-conversation (that is a *turn* within an Interview).

**Interview Session**:
The persisted state of an Interview — questions, current question index,
follow-ups, completed questions, and status (`in_progress` / `completed`).
_Avoid_: interview-record, interview-state.

## The AI pipeline

A chained sequence (runs server-side; see ADR-5). Order matters.

**Resume Extraction**:
AI parsing of a candidate's resume (PDF, vision-capable) into structured
`parsed_candidate_data` — name, experience, skills, etc.
_Avoid_: parsing, resume-parsing (Extraction implies the structured output).

**Job Match Analysis**:
AI scoring of a Candidate against a Job's requirements, producing the match
score and recommendation. Triggered after Resume Extraction completes.

**Email Analysis**:
AI assessment of an inbound candidate email's substance for the recruiter.
