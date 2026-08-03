# Side-by-side checklist — Member shell

Manual companion to `member-shell.spec.ts` (ADR-0030 §5). Compare the port
(`localhost:3000`) against source `talsek` (`localhost:5173`) at ~1280px desktop.

## Shell width / collapse

- [ ] Expanded sidebar ~14rem; brand logo + “Talsek” visible
- [ ] Collapse trigger in sidebar header toggles icon rail (~3rem)
- [ ] Collapsed: labels/brand hidden; nav icons remain; tooltips available
- [ ] Expand restores labels and brand

## Nav IA

- [ ] Order: Get Started → Dashboard → Customize Form → Reachout Templates →
      (divider) → Bulk Upload → Candidates → (divider) → Team → Billing (admin)
- [ ] Active item highlights for the current route
- [ ] Footer docs link reads “{Page} Guide” and opens docs in a new tab

## Account menu

- [ ] Trigger in sidebar footer (avatar + company + email)
- [ ] Opens to the right; header shows company + email
- [ ] Items in order: theme toggle → list/grid view → Notifications → Sign Out
- [ ] Notifications opens “Email Notification Settings” dialog

## Primary chrome denseness

- [ ] No global top app bar on desktop (content starts in the inset)
- [ ] “Add New Job” / “Permission Required” CTA lives on the dashboard jobs
      panel, not in the sidebar
