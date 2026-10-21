# Layout-parity Playwright suite

Separate seam for **source-faithful structure + interaction UX** (ADR-0030).
Does not replace behavioural `e2e/*.spec.ts` characterisation.

## Run independently

```bash
bun run e2e:layout-parity
```

Requires `E2E_EMAIL` / `E2E_PASSWORD` in `.env.local` (same as behavioural E2E).
The default desktop viewport is 1280×800. Landing checks also cover 1440×900,
mobile, enlarged text, and reduced motion. No screenshot comparisons.

## Scope

| Spec | Surface |
|------|---------|
| `landing-page.spec.ts` | Public landing chapters, scroll-driven workflow, dark mode |
| `member-shell.spec.ts` | Member shell |
| `dashboard-jobs.spec.ts` | Dashboard / Jobs board |
| `candidate-board.spec.ts` | Candidate board + adaptive card |
| `candidates-setup.spec.ts` | Candidates page, Bulk Upload, Templates, Forms |
| `team-billing-get-started.spec.ts` | Team/Users, Billing, Get Started |
| `auth-pages.spec.ts` | Sign-in, sign-up, forgot/reset, confirm email |
| `applicant-apply-interview.spec.ts` | Applicant apply + interview token flows |

Manual checklists (`*.checklist.md`) accompany each surface.
