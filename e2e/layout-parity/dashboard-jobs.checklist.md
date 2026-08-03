# Side-by-side checklist — Dashboard / Jobs

Manual companion to `dashboard-jobs.spec.ts` (ADR-0030 §5). Compare the port
(`localhost:3000`) against source `talsek` (`localhost:5173`) at ~1280px desktop.

## Page denseness

- [ ] No top “Jobs” chrome header; content is jobs panel + candidate board edge-to-edge
- [ ] Jobs panel left (~250–320px), candidate board fills the remainder

## Jobs panel

- [ ] “Your Jobs” heading + expandable search + collapse control
- [ ] Full-width “Add New Job” / “Permission Required” CTA under the header
- [ ] Collapse shows icon “+” create + two-letter Job initials

## Job cards

- [ ] Title + posting code (“No code” fallback) + “N applicants” (not status badge)
- [ ] PR / NN counts, then Email / Form copy (when available) + pencil details
- [ ] Selecting a card updates `?jobId=` without opening details

## Create / success dialogs

- [ ] Create opens 2-step wizard (ADR-0029): Job Details → Review Requirements
- [ ] Near-fullscreen wizard shell; progress segments; service-type cards; Key Details + JD two-column; sticky Cancel/Back | Next / Create Job Posting; confirm dialog before create
- [ ] Success: forwarding email copy, optional form link, primary
      “Perfect! Let's start receiving applications” (Form Config remains opt-in)

## Job details

- [ ] Pencil opens Job Details; “Edit Requirements” is the requirements entry point
