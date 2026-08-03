# Side-by-side checklist — Candidate board

Manual companion to `candidate-board.spec.ts` (ADR-0030 §5). Compare the port
(`localhost:3000`) against source `talsek` (`localhost:5173`) at ~1280px desktop.
Adaptive card consolidation (ADR-0027) stays — match structure/interaction, not
three card families.

## Board chrome

- [ ] One header row: Hiring Stage tabs (left) | Bulk Action + Filter (right)
- [ ] Stage tabs are a segmented pill rail with counts; disabled while bulk mode
- [ ] “Bulk Action” dropdown → Select to Shortlist / Select to Reject
- [ ] “Filter” dropdown with label + description per fit option
- [ ] No aggregate “N candidates · active · rejected” strip

## Denseness / preference

- [ ] List cards use comfortable vertical spacing (~gap-4); grid `minmax(280px)`
- [ ] List/grid preference still lives in the account menu (not on the board)

## Adaptive card controls

- [ ] Action order / prominence: AI Analysis → Shortlist → Reject
- [ ] Star beside name; Resume under identity (not in the action row)
- [ ] Final stage: analysis affordances only (no Shortlist/Reject); resume-only
      final grid uses “Complete AI Analysis”

## Profile / Shortlist / Reject

- [ ] Profile tabs: Overview → Requirement Analysis → Interview → Resume Data → Email
- [ ] Shortlist confirm: stage strip, subject/body, Cancel / Send Reachout
- [ ] Reject confirm: “will disappear…” copy; Cancel / Yes, Reject
