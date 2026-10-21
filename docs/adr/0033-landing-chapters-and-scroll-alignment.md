# Landing chapters and scroll alignment

## Context

The landing page combined a tall workflow, feature cards, statistics, and a
comparison table with uneven section spacing. Sections did not compose within a
desktop viewport. The requested interaction is gentle alignment between screens.

## Decision

- Keep native document scrolling and use `scroll-snap-type: y proximity` only on
  the landing route, at widths of at least 1024px and heights of at least 700px.
- Offset alignment by the fixed 72px desktop header. Each chapter has a minimum
  height equal to the remaining viewport; content may grow without clipping.
- Keep the hero and company logos in the first viewport. Separate feature cards
  and statistics from the comparison table into two chapters.
- Present workflow navigation above one two-column panel, with shorter step
  labels and the full title in the content. Retain all four steps and demo actions. At desktop heights of at least 800px,
  pin the panel and derive its active step from document scroll position. Native
  scrolling passes through all four steps in either direction before the panel
  releases. Step buttons scroll to their corresponding positions.
- Use natural scrolling on mobile, short windows, and when reduced motion is
  requested. Keep workflow selection manual in these modes; no timed auto-advance is used.
- Scope the root scroll attribute to the mounted landing route and remove it on
  navigation. Other marketing routes and Member routes keep their scrolling.

## Consequences

Proximity snapping allows readers to stop within content and reach the footer.
It does not force a one-wheel-event-per-screen interaction. Expanded FAQs,
larger text, or smaller viewports can make a chapter taller than one screen;
content remains available through normal scrolling.

Layout checks cover 1280×800 and 1440×900, all workflow steps, booking, feature
anchor visibility, route cleanup, mobile width, and reduced-motion scrolling.
