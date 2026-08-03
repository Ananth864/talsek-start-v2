# Layout-parity Playwright suite

Separate seam for **source-faithful structure + interaction UX** (spec #34,
ADR-0030). Does not replace behavioural `e2e/*.spec.ts` characterisation.

## Run independently

```bash
bun run e2e:layout-parity
```

Requires `E2E_EMAIL` / `E2E_PASSWORD` in `.env.local` (same as behavioural E2E).
Desktop viewport is fixed at 1280×800. No screenshots.

## Scope

| Spec | Surface |
|------|---------|
| `member-shell.spec.ts` | Member shell (#36) |
| `dashboard-jobs.spec.ts` | Dashboard / Jobs board (#37) |
| `candidate-board.spec.ts` | Candidate board + adaptive card (#38) |

Manual checklists (`*.checklist.md`) accompany each surface.
