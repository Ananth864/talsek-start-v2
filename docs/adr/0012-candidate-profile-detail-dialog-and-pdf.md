# Candidate profile detail: dialog, ai_analysis narrowing, client-side PDF

Ticket #7 extends the candidate board's card (#6) into the full profile
detail: the `CandidateProfileDialog` (scores, AI recommendation,
per-requirement evidence, parsed resume data, email source) and the
`CandidateProfilePDFRenderer` with a client-side PDF download. This record
captures the non-obvious decisions; it does not contradict 0001–0011.

## Decisions

### 1. `AIAnalysisJson` narrowed to a concrete shape; `ai_analysis` + `email_content` + `match_score` re-enter the canonical select

The dialog reads `ai_analysis` (recommendation, rationale, strengths,
concerns, per-requirement `meets`/`evidence`), which the board select omitted
because `JobMatchCoreAnalysis` was loose (`Record<string, unknown>`) and the
default server-function serializer rejects `unknown` (ADR-0009 §1).
`JobMatchCoreAnalysis` is narrowed in `json-types.ts` to the source's
`jobMatchCoreAnalysisSchema` shape verbatim (individual_scores,
recommendation enum, rationale, candidate_readiness, strengths_for_role,
potential_concerns) — the same precedent #6 set for `ResumeExtractionJson`.
`AIAnalysisJson` (which layers `overall_fit_score` + the two requirement
analyses on top) thereby becomes concrete and serializable.

With both JSON columns concrete, `ai_analysis`, `email_content`, and the raw
`match_score` are added to `jobApplicationsQuery` — the **same** canonical
select the board uses, not a separate `fetchCandidateProfile` fn. The dialog
therefore reads the exact cached board row (same
`['job-applications', jobId, companyId]` key): AC "dialog data is consistent
with the board" holds by construction, no second fetch, no new realtime
concern. `JobApplicationRow` re-derives automatically.

Runtime nullability: the columns are typed non-null (MergeDeep override) but
pre-pipeline/failed rows carry null. `aiAnalysisOf` / `emailContentOf`
(`job-applications-shared.ts`) are the defensive accessors, mirroring how
`parsedSummary`/`parsedProfile` treat `parsed_candidate_data`.

### 2. Headline score stays `final_score`; `computeDynamicScore` ports for the breakdown components only

The source dialog recomputes its headline match score client-side via
`computeDynamicScore`. ADR-0011 §5 fixed the board to the persisted
`final_score`; if the dialog recomputed, the two could disagree whenever a
Job's requirements were edited after scoring. So:

- The header "Match" badge and the "Final Score" card show
  `normalizedMatchScore` (persisted `final_score`) — identical to the card's
  score ring.
- `computeDynamicScore` (ported verbatim into `lib/requirements.ts`, with
  `mergeRequirementsWithAnalysis` + `summarizeRequirementAnalysis`) supplies
  only the Overview breakdown *components* (Overall Fit x/weight, Bonus
  x/weight, "Reduced by 50%" note). On the read path — requirements not
  edited — the components sum to `final_score`, matching the source exactly.

The write-path recompute-on-edit behaviour still ports with #8+.

### 3. One derived read model; the dialog is client-only state on the cached row

Both surfaces (dialog + PDF renderer) render the same data, so a single pure
`candidateProfileModel(application, job)` (`lib/candidate-profile-model.ts`)
owns the derivation: requirement merge/summaries, score breakdown, parsed
profile, email body/insights, and **all defensive access** — the nullable
JSON columns *and* the requirement-analysis sub-objects (a partial pipeline
write can persist the core analysis without them; the source guarded both
levels with `?.`). The dialog opens from the card's "AI Analysis" action
(`useState` in `CandidateCard`, source parity) — no route, no loader change.

The source's Resume Data tab discovered sections by regexing loose JSON keys
(`/experience|work/i` etc.); since `ResumeExtractionJson` is concrete (#6),
`parsedProfile` (`lib/parsed-candidate.ts`) returns typed sections
(info fields, summary, work_experience, education, technical/soft skills,
certifications) and both surfaces render those directly.
`potential_concerns*` extraction fields are excluded (source parity —
concerns surface from `ai_analysis`). **Consequence (accepted):** legacy rows
whose loose JSON carried off-schema keys the source rendered generically
(`gpa`, per-role `location`/`description`, `key_achievements`) no longer
display — the concrete schema has no such fields; rows produced by the
current extraction schema lose nothing.

Two small fidelity deviations, both deliberate: the header's "Applied" date
is `application.created_at` (the source dialog used `candidate.created_at`;
the application date keeps the header consistent with the board card and the
PDF), and the header badge variant mapping is centralised as
`matchBadgeVariant` (70/40, source thresholds) beside `scoreBand`.

Deferred tab content, empty-stated not omitted: **Interview** (Interview
Sessions port with #12) and the **form-answers** section of Requirement
Analysis (forms domain). The Email tab is fully ported, including the
source's `renderEmailContent` header extraction (Subject/From/To/Date →
"Email Details" card; `parseEmailBody` in the model module).

### 4. PDF is generated client-side with jspdf + html2canvas-pro

Source parity: the profile PDF is rasterised in-browser from the hidden
`CandidateProfilePDFRenderer` (fixed light palette, `[data-pdf-candidate]`
sections) and assembled with `jspdf` v4 (A4, JPEG 0.75, page slicing) — no
server function touches it. **Deviation:** the source's `html2canvas` 1.4
cannot parse `oklch()` color functions, and Tailwind v4 (this port,
ADR-0006) emits oklch for palette utilities; `html2canvas-pro` is the
maintained fork with oklch/oklab support and is a drop-in replacement
(niklasvh/html2canvas#3269). The export module is dynamically imported on
click so jspdf/html2canvas-pro stay out of the initial and SSR bundles.

Scope: #7 ships the single-candidate "Download PDF" action in the dialog
header. The source's board-level `ExportDropdown` (Excel via `xlsx`, bulk
ZIP via `jszip`) is a bulk-actions surface and ports with that ticket — the
renderer already supports multiple candidates and keeps the
`data-candidate-name` attributes the ZIP path selects on.

## RLS / access audit

No new data path: the dialog reads through the existing user-scoped
`fetchJobApplications` (ADR-0011 audit unchanged). Adding columns to the
select widens the payload, not the policy surface — the same
`user_belongs_to_company(jobs.company_id)` SELECT policy governs. No
service-role access; no auth-touching awaits (no `flushCookies` concern).

## Follow-ups (non-blocking)

- The #7 E2E (`candidates-board.spec.ts`, dialog + PDF download) asserts
  conditionally, like #6's board spec: the E2E account has no applications
  until #9/#11 seed real data — then drop the `cardCount === 0` early-return
  and hard-assert the dialog + download path.
- When #8 ports mutations and requirement editing, revisit whether the dialog
  should adopt the live recompute (source behaviour) over the persisted
  `final_score` (decision §2).
- Review judgement call declined: `CandidateProfilePDFRenderer`'s
  `candidates` prop names Job Applications (CONTEXT.md ambiguity), kept
  verbatim for source parity — the bulk ZIP export ports against it (same
  rationale as #6's declined `application` rename).
