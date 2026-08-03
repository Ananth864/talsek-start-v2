# Adaptive candidate card + Profile view preference

Ticket #26 consolidates the source's three stage-specific candidate card
families into one adaptive card that honours the Member's persisted
grid/list preference. This record captures the non-obvious decisions; it
does not contradict 0001–0026.

## Decisions

### 1. One adaptive card, not three families × two layouts

The source renders `CandidateCard` / `InterviewCandidateCard` /
`FinalReachoutCandidateCard` (and matching grid variants) by Hiring Stage
name. The port keeps **one** `CandidateCard` with:

- `layout: 'list' | 'grid'` from `profiles.candidate_list_view`
- `data-stage-kind` derived from the Job Application's current Hiring Stage
  (`resume` / `interview` / `final`)

Stage-specific content (interview status/score badges; final-stage Resume /
Interview Analysis actions and the "Shortlisted - Reachout Sent" affordance)
renders conditionally. Shared actions (star, profile, Shortlist, Reject,
bulk select) stay on the same component so both layouts share one write path.

### 2. View preference updates go through a user-scoped server function

The source mutated `profiles.candidate_list_view` from the browser Supabase
client. The port uses `fetchCandidateListView` /
`updateCandidateListView` (`src/server/fn/profile-preferences.ts`) composed
through `authMiddleware` (ADR-0002 / ADR-0004). The account dropdown and the
candidate board share the `['candidate-list-view', userId]` React Query key
so a toggle refreshes the board without a full navigation.

### 3. Stage detection uses Hiring Stage names (source parity)

`Screening Interview` → interview surface; `Final Reachout` → final surface;
everything else → resume screening. Final-stage Interview Analysis buttons
appear only when the Job's pipeline includes a Screening Interview Job Stage
(source `FinalReachoutCandidateCard` behaviour).

## Consequences

- Visual layout follows the ported design system; behavioural parity with the
  source stage surfaces is mandatory (spec #18 amendment).
- Interview Session is fetched on the board for interview/final(+interview)
  cards so badges can render without opening the profile dialog.
- No schema / RLS changes — `candidate_list_view` already exists on Profile.
