# Source-faithful layout structure + interaction UX (paint relaxed)

Parent spec #34 re-raises the layout/UX bar after behavioural port completion
(#18 / #19–#33). The Aug 2026 port-spec amendment had relaxed visual parity to
ported design-system consistency, which left structure and interaction drift
in-bounds for cutover. This record amends that bar for four surfaces only. It
does **not** reopen behavioural capability gaps from #18 — behaviours are
assumed present; this workstream tightens **how** they look and feel
structurally. Vocabulary from `CONTEXT.md`. Does not contradict ADRs 0001–0029
except by narrowing the Aug 2026 visual-parity relaxation as stated below.

## Decisions

### 1. Success criterion: source-faithful structure + interaction UX

For **Member shell → Member product → Auth → Applicant** (in that order),
layout structure and interaction UX must match the source app (`../talsek`):
sidebar width/collapse/nav order/active states, account-menu contents, page
padding and header/CTA placement, list/card affordance order, dialog and flow
shape, board denseness, and equivalent Applicant token-flow steps. Code need
not be identical; inefficient source patterns may be replaced if the criteria
are met. Framework idioms stay TanStack Start (nested / pathless layout
routes and `Outlet` composition for shared shell chrome — look up current
TanStack Start/Router docs rather than inventing from memory).

### 2. Paint stays on the ported design system

Colors, fonts, and radii remain the ported shadcn/Tailwind v4 theme (ADR-0006).
Match source paint only when paint changes hierarchy or meaning (e.g. wrong
emphasis on Shortlist vs Reject). Do not roll the theme back to source tokens
globally. Pixel-perfect / screenshot visual regression is out of scope.

### 3. Keep consolidations by default; escalate ADR conflicts

Prefer keeping intentional port consolidations (e.g. one adaptive candidate
card per ADR-0027, TanStack Form kit) when the Member/Applicant experience can
still match source structure and interaction. If matching source UX would undo
an existing ADR → **stop and ask**; do not silently violate the ADR and do not
silently approximate away the gap.

### 4. Desktop-primary viewport (~1280+)

This parity pass is desktop-primary. Layout-parity E2E runs at one desktop
viewport. Mobile is only smoke-checked where shell or Applicant flows clearly
break.

### 5. Separate `e2e/layout-parity/` seam (no screenshots)

Verification adds a **new** Playwright suite under `e2e/layout-parity/`,
separate from existing `e2e/*.spec.ts` behavioural characterisation. Good tests
assert external structure and interaction only (visible regions, control
labels/roles/order, dialog open/close, nav chrome, list vs grid affordances,
empty/loading visibility). No implementation details, no color/font asserts, no
screenshot diffs. Do not merge layout assertions into the behavioural suite.
A side-by-side checklist vs running `talsek` accompanies each surface (manual
companion, not a code seam).

### 6. Marketing and documentation remain out of scope

Marketing landing, pricing, contact, legal, and documentation layout work are
**out of scope** for this workstream and remain under the Aug 2026
paint-consistency bar in `docs/spec/port-to-tanstack-start.md`. This amendment
does not raise a source-faithful structure/UX bar for those surfaces.

## Consequences

- Agents must not re-apply the Aug 2026 “visual parity = design-system
  consistency” reading to Member shell, Member product, Auth, or Applicant —
  structure and interaction are source-faithful; paint stays relaxed.
- Follow-on tickets under #34 implement the surfaces and the
  `e2e/layout-parity/` suite; this ADR is the policy record only (ticket #35).
- Existing behavioural Playwright specs stay the capability gate; layout/UX is
  a parallel gate.
- Schema, RLS, Supabase project, and new product capabilities remain out of
  scope (unchanged from the port spec).
