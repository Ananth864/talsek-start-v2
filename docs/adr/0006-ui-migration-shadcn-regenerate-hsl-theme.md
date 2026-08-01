# Regenerate shadcn fresh in the existing style; port the HSL theme verbatim

The UI migrates to React 19 + Tailwind v4 by **regenerating shadcn components
fresh** (via the CLI) into the new repo configured with the *old* style
(`style: "default"`, `baseColor: "slate"`), and **porting the existing HSL theme
token values verbatim** into v4's CSS-first `styles.css`. The new repo's
shipped `new-york` / `zinc` / `oklch` defaults are discarded because they would
silently change the product's appearance, violating the UX-preservation goal.

## Considered options

- **Regenerate fresh in old style + port HSL theme (chosen).** The existing
  `ui/*` components are stock shadcn (confirmed via `button.tsx`), so CLI
  regeneration loses no customizations while producing v4-native, React 19-ready,
  unified-`radix-ui` components. The visual identity lives in the CSS variables,
  not the components, so copying the HSL values preserves the exact look (v4
  accepts `hsl()` — no oklch conversion required).
- **Port existing `ui/*` and patch.** Rejected — more tedious, inherits v3-era
  patterns, and offers no benefit when the source components are unmodified.
- **Adopt new-york/zinc/oklch defaults.** Rejected — a visible redesign;
  contradicts "functionality and UX remain the same."

## Consequences

- `components.json` set to `style:"default"`, `baseColor:"slate"`; all ~50
  components re-added with `npx shadcn@latest add`.
- `styles.css` `:root`/`.dark` carry the existing HSL values; sidebar tokens
  renamed `--sidebar-background` → `--sidebar` to match v4 naming.
- Re-added by hand (not auto-generated): the `typography.docs` prose theme,
  custom scrollbar utilities, `animate-throb` keyframe, `talsek` brand scale.
- `next-themes` kept (framework-agnostic, handles SSR flash).
- `tw-animate-css` is the sole animation plugin; `tailwindcss-animate` removed
  (the two were redundant in the scaffold).
- Large custom components (`CandidateProfileDialog`, `JobCreationDialog`,
  `CandidateProfilePDFRenderer`, `what-sets-us-apart`, `DashboardSidebar`, …)
  port as application code with minimal React 19 / token patches — no redesign.
