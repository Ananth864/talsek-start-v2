# Landing chapters and scroll alignment

## Context

The landing page had uneven section heights, repeated feature cards, and a
workflow that changed before the opening step could be read. The requested
interaction is gentle alignment between screens and scrolling through workflow
subsections. An independent design review also identified duplicated copy,
small product examples, and disconnected quote, FAQ, and closing sections.

## Decision

- Keep native document scrolling. Enable proximity snapping only on the mounted
  landing route at desktop widths of at least 1024px and heights of at least
  700px. Remove the root attribute on client-side navigation.
- Keep the hero and company logos together. Use content-driven chapters with a
  minimum viewport height below the rem-based header. Content may grow freely.
- Give the workflow four real articles in document flow. On suitable desktop
  viewports, keep a slim step navigation and one product frame sticky beside
  the copy. Articles are proximity-snap destinations. Keep wheel, trackpad,
  touch, and keyboard input native. Do not cancel wheel input, impose gesture
  thresholds, consume momentum, or force one step per gesture. A bounded wheel
  safeguard was tried to prevent skipped steps, but user testing found it hard
  to scroll. Direct response to input takes precedence over forcing every stop.
- Select the step when its article crosses the reading position below the
  header and navigation. Explicit step navigation scrolls smoothly to that
  article and keeps the selected product view stable during transit. Manual
  input cancels that selection guard.
- On mobile, short windows, enlarged text, or reduced motion, show all four
  articles and their product examples in normal document flow. A resize observer
  checks the product frame before enabling sticky presentation. The desktop
  measurement frame remains rendered but invisible during fallback, so hiding
  it cannot make the measurement zero and repeatedly re-enable pinning. No timed
  auto-advance is used. Reduced motion disables snapping and smooth scrolling.
- Use one candidate story across workflow, evidence, and closing examples.
  Replace equal feature cards with a larger resume-evidence composition.
  Comparison rows show both alternatives on mobile. Keep secondary comparison
  details in a disclosure; omit the mismatched setup/time-per-hire comparison.
- Combine the customer quote and FAQ in one chapter. Preserve the full quote
  through a disclosure and open the setup answer initially. Let disclosures
  increase chapter height. Use the normal page surface for the closing action.

## Consequences

Native proximity snapping preserves reading and footer access. Large gestures
can pass multiple chapters. Explicit navigation remains available for each step.
Expanded answers and larger text can make a chapter taller than one screen.
Physical trackpad feel still needs user verification.

Layout checks cover desktop navigation, forward/reverse wheel input, mobile
content, reduced motion, enlarged text, booking, anchors, and route cleanup.
