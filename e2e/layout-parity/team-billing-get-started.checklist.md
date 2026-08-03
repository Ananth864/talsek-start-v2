# Side-by-side checklist — Team / Billing / Get Started

Manual companion to `team-billing-get-started.spec.ts` (ADR-0030 §5). Compare
the port (`localhost:3000`) against source `talsek` (`localhost:5173`) at
~1280px desktop.

## Team / Users

- [ ] Header: “Team” + description + Invite Member CTA
- [ ] Members card: search (name/email/role/status) + Refresh
- [ ] Table cols: Name / Email / Role / Status / Actions (Manage)
- [ ] Invite Member opens modal; Manage → `/users/:id`

## Member detail

- [ ] Back arrow + member name/email + role badge (+ Resend invite if pending)
- [ ] Card title “Workspace Permissions”; each permission in its own row
- [ ] Reset + Save Changes below the card (not inside CardContent)

## Billing

- [ ] No page H1 — sticky tabs Billing | Usage | Invoices
- [ ] Current Plan card + View all Plans → side sheet “Choose Your Plan”
- [ ] Add Credits + Auto-Refill in a 2-column grid; Credit Costs below
- [ ] Usage: wallet / used / active jobs + daily chart + category + per-job
- [ ] Invoices: Invoice History; succeeded rows expose PDF control
- [ ] Enterprise Contact Sales opens booking dialog

## Get Started

- [ ] Incomplete: “Welcome to Talsek” + “Let's get you set up” + progress + 5 steps
- [ ] Step CTA + mark-done toggle; links to form/templates/users/billing/dashboard
- [ ] Complete: “Dashboard Hub” + Quick Links action cards (2×2)
