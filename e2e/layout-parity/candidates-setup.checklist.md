# Side-by-side checklist — Candidates / Bulk / Templates / Forms

Manual companion to `candidates-setup.spec.ts` (ADR-0030 §5). Compare the port
(`localhost:3000`) against source `talsek` (`localhost:5173`) at ~1280px desktop.

## Cross-job Candidates

- [ ] Left sticky Filters card (~300px) + results column; no page H1
- [ ] Filters: name, Job, Stage, min score, Starred, Fulfilled NN, Search/Clear
- [ ] Results chrome: count label + Export (Concise / Full)
- [ ] Empty prompt before search; adaptive cards after (ADR-0027)

## Bulk Upload

- [ ] No page title — Job & Files then Batch Status cards, `p-6`
- [ ] Target Job select + dashed PDF dropzone copy matches source
- [ ] Batch Status: Clear + Analyze; table cols File / Email / Status / Message (no Size)

## Reachout Templates

- [ ] Header: title + description + Reset to Default + Save Template
- [ ] Tabs: Interview Shortlist | Final Reachout
- [ ] Per-tab section heading, Reply-To / Subject / Body + Available Variables rail

## Form customization (`/form-settings`)

- [ ] Header: “Customize Application Form” + Cancel + Save Form Template
- [ ] Split panes: Questions (builder) | Live Preview
- [ ] Permission alert when Member lacks `canManageForms`
