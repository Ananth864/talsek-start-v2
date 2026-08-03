# Tailwind v4 sidebar widths must use `var()`

Parent: layout/UX parity (#34 / ADR-0030). Discovered while locking Member
shell width/collapse in ticket #36.

## Context

The ported shadcn `sidebar.tsx` used Tailwind arbitrary values of the form
`w-[--sidebar-width]` / `w-[--sidebar-width-icon]` (common in older shadcn
copies). Source `talsek` is on Tailwind v3, where that shorthand expands to
`width: var(--sidebar-width)`. This app is on Tailwind v4 (`^4.1.18`).

## Decision

In Tailwind v4, `w-[--token]` compiles to the invalid declaration
`width: --token`, so the Member sidebar ignored the 14rem / 3rem CSS variables
and sized to content. Use explicit `w-[var(--sidebar-width)]` and
`w-[var(--sidebar-width-icon)]` (or the v4 `w-(--token)` shorthand) anywhere
sidebar (or other) widths read from CSS custom properties.

## Consequences

- Member shell expanded/collapsed widths match source denseness again.
- Regenerating or pasting shadcn sidebar primitives must re-check CSS-variable
  width utilities for v4 validity.
- Layout-parity E2E asserts ~14rem expanded / ~3rem icon-collapsed as a
  regression gate.
