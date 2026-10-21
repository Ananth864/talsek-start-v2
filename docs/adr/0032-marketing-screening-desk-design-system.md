# Marketing surface adopts the screening-desk design system

Parent: amends ADR-0006 (which ported the product HSL theme verbatim). Source:
the 2026-08-25 landing redesign in the `talsek` repo ("screening-desk design
system, live pipeline preview, code-built visuals").

## Context

The public marketing surface (all `_marketing` routes: landing, pricing,
contact, thank-you, privacy, terms) still used the previous visual generation:
system font stack, centered hero, ad-hoc accents (`sky-500`, raw grays), and
the ADR-0006 token set. The source app's landing was redesigned around a
distinct identity — Bricolage Grotesque display / Instrument Sans body /
IBM Plex Mono micro-labels, a paper/ink/cobalt palette, mono `label-mono`
eyebrows, and code-built product visuals (live pipeline preview). Marketing
pages must match it; the gated product must not change.

## Decision

- **Scoped token override.** `src/styles.css` defines the screening-desk HSL
  token set under `[data-marketing-theme]` (light) and
  `.dark[data-marketing-theme]`. The `_marketing` pathless layout sets that
  attribute on `<html>` for the lifetime of any marketing route, so Radix
  portals (dialogs, sheets, nav menus) inherit it too. The product theme from
  ADR-0006 stays untouched for gated routes.
- **Fonts, self-hosted.** `@fontsource-variable/bricolage-grotesque`,
  `@fontsource-variable/instrument-sans`, `@fontsource/ibm-plex-mono`
  (400/500/600) are imported in `styles.css`. `--font-sans`, `--font-display`
  and `--font-mono` are redefined inside the marketing scope only; the
  `.label-mono` utility (uppercase mono micro-label) is global.
- **Motion via `motion/react`.** The `motion` package (framer-motion's
  successor) drives hero/section fade-ups, the auto-advancing How-it-works
  panel, and the pipeline preview choreography (scan → score → shortlist →
  auto-opening the top candidate's profile). `useReducedMotion` is respected
  by the preview; the global `prefers-reduced-motion` CSS rule covers CSS
  transitions.
- **Landing ported 1:1 in structure** from the source redesign: two-column
  hero with the pipeline preview, logo marquee pinned to the first viewport,
  code-built How-it-works visuals, feature cards + stat band + benchmark
  table, single testimonial, two-column FAQ, inverted CTA card. Cal.com
  booking goes through the existing `CalBookingProvider` (one shared dialog),
  not per-section modals as in the source.
- **Header nav tells the truth.** One `Product` dropdown listing the three
  real landing anchors (Resume Matching, Screening Interviews, Smart
  Outreach); flat Pricing / Contact Us / Docs links; a light/dark toggle
  writing the same `localStorage['theme']` key the pre-paint boot script
  reads. The old Solutions dropdown (two items, one destination) is gone.
- **Pricing/contact/legal/thank-you re-skinned** with the same system
  (label-mono eyebrows, display headings, token-only color). Content and
  testids unchanged; contact remains email + Cal booking, no form.
- **Hygiene rules for marketing code:** no hardcoded brand hexes — everything
  through tokens; one container primitive (`container mx-auto px-4` or a
  single `max-w-*` per page); no raw gray/blue palette utilities.
  Grid tracks with nowrap content must use `minmax(0, …fr)` (see
  consequences).

## Consequences

- Marketing and product can evolve visually independently; neither theme
  leaks into the other. Removing the `data-marketing-theme` attribute
  restores the product theme everywhere.
- `fr` grid tracks have an implicit `min-width: auto` floor; the pipeline
  preview's `truncate` rows gave tracks a content floor that overflowed the
  card (scores clipped). Use `grid-cols-[minmax(0,…)_minmax(0,…)]` wherever
  tracks contain nowrap content.
- Fonts ship bundled (~woff2 per weight subset), no Google Fonts request;
  first paint on Vercel improves and offline preview works.
- `motion` adds one runtime dependency shared by all marketing sections.
- E2E: `landing.spec.ts` clicks the `Product` trigger (renamed from
  `Products`); `marketing-pages.spec.ts` gains a Docs-link resolution check.
  All page-level testids are unchanged.
- Auth pages (`/signin`, `/signup`, …) intentionally keep the product theme
  and their layout-parity suite; a follow-up ticket may re-skin them.
