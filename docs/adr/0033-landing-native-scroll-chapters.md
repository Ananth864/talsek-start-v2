# Landing chapters use native scrolling

Amends ADR-0032 for the landing page only. This revision starts from the
unchanged deployed source at `62007fe`, rather than the discarded PR #51.

## Decision

- Keep the deployed hero, feature cards, statistics, and comparison content.
  Tighten spacing and separate the feature and comparison sections so each
  fits a desktop viewport below the header.
- Present How it works as four real document-flow chapters. On a large, tall
  desktop, the step navigation and product example stay visible while the
  copy scrolls. A passive scroll listener selects the matching example.
- Use CSS `scroll-snap-type: y proximity` for gentle desktop alignment. Do not
  intercept wheel input, impose timers, or force one gesture to one chapter.
  Strong momentum can travel past a chapter. This keeps scrolling reversible
  and avoids the restrictive behavior rejected during the earlier revision.
- Show each chapter with its example in normal flow on smaller screens,
  short windows, enlarged text, reduced motion, or product-content overflow.
  Keep the desktop overflow probe measurable while inline examples are active
  so the fallback cannot alternate between layouts.
- Scope the document snap behavior to the landing route and remove it on
  navigation. Expanded FAQ answers and other tall content can grow naturally.
- Place the existing customer quote and all five FAQ questions in one section.
  Keep the full quote available in an accordion.
- Remove the repeated result/demo band below How it works. Use the site's
  normal background, display face, and shared booking button for the final
  invitation, replacing the inverted card and glow.
- Keep both comparison alternatives visible on mobile.

## Verification

The landing layout suite checks desktop chapter selection in both directions,
step navigation, section sizing, route cleanup, mobile content, reduced motion,
enlarged text, dark-mode persistence, FAQ expansion, booking-dialog opening,
native wheel input, and stable overflow fallback. Physical trackpad feel and
an external booking submission require manual verification.
