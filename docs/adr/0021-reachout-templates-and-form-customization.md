# Reachout Templates + Form customization

Ticket #16 ports Member management of Reachout / Interview templates and
application Form Template + per-Job Form Config, gated by
`canManageTemplates` / `canManageForms`, and introduces the shared
`useAppForm` field kit.

## Decisions

### 1. Templates live in `company_settings.settings` (no new table)

Reachout (`reachout_template`) and Interview (`interview_template`) stay as
JSON on `company_settings`, matching the source. Server functions
`fetchReachoutTemplates` / `saveReachoutTemplate` read and merge-update that
JSON on the user-scoped client.

### 2. Authoritative capability checks; user-scoped writes

`canManageTemplates` and `canManageForms` are enforced inside the write server
functions (ADR-0004), not only in the UI. Writes use `context.supabase` so
existing RLS applies — admin-only INSERT/UPDATE on `company_settings`,
`form_templates`, and `job_form_configs` (same hardening as createJob /
ADR-0010). Non-admin Members with the flag true still fail at RLS until a
future schema change; the E2E admin (and company owners) succeed.

### 3. Company Form Template vs Job Form Config

- `/form-settings` edits the company `form_templates` row (via
  `get_or_create_form_template` + UPDATE), storing mandatory + additional
  questions.
- Job detail opens a dialog that creates/updates `job_form_configs` with a
  **snapshot** of additional questions + `custom_question_text` overrides and
  a `form_url_token`. Later company-template edits do not rewrite existing
  Job configs (source parity).

`get_or_create_form_template` is a `SECURITY DEFINER` RPC (source parity —
the edge `form-template-api` called the same helper). It bootstraps a default
row when missing; subsequent UPDATEs of questions run on the user-scoped
client under `canManageForms` + RLS. This is an intentional DEFINER exception
for create-if-missing, not a general bypass of Form Template writes.

### 4. `useAppForm` field kit is the domain form entry point

`src/hooks/form.tsx` populates `createFormHook` with shadcn-styled
`TextField` / `TextareaField` / `SubmitButton`. Reachout template editors and
the Job Form Config enable/save form use this kit. Question builders remain
interactive list UIs, not TanStack Form fields.

### 5. No Reachout send in this ticket

Saving templates does not send email or create Interview Sessions. Shortlist
send / notifications deepen in #17 (reuse `src/server/lib/email.ts`).

## Consequences

- Dashboard nav links to Templates and Forms; Job detail exposes Configure /
  Edit form when `canManageForms`.
- Applicant apply-by-token (`forms.ts`) shares `MANDATORY_QUESTIONS` from
  `form-questions-shared.ts`.
