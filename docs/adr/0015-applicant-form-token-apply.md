# Applicant form apply by token

Ticket #11 ports the public Applicant Form surface: open by token, upload a
resume to Storage, submit a Job Application, and await the Resume AI pipeline.
This record captures the auth, upload, and rate-limit seams that diverge from
the source edge functions.

## Decisions

### 1. `candidateTokenMiddleware({ kind })` for session-less Applicants

Symmetric to `authMiddleware` (spec §Applicant token flows). The factory
validates `token` from the server-function input, loads the Form Config (and
later Interview Session) via `getAdminClient()`, and attaches
`{ admin, formConfig, clientIp, userAgent }` to context. Invalid / disabled /
expired tokens throw `CandidateTokenError` with stable codes. Interview kind is
stubbed until #12.

### 2. IP rate limit on submit only; Upstash with in-process fallback

Source limits `form-submit` to 3/min/IP via Upstash and does **not** rate-limit
`form-get-form`. The middleware accepts `rateLimit?: boolean` (default `true`)
so GET + signed-upload prep pass `false` and a single apply journey does not
burn the submit budget. When `UPSTASH_REDIS_REST_*` is set, limits use
`@upstash/ratelimit`; otherwise an in-process sliding window keeps local/E2E
overruns rejectable (spec: rate limiting centralises in middleware).

### 3. Client → Storage via signed upload URL; server receives path only

ADR-0003 forbids shipping resume bytes through the Vercel request body. Unlike
source `form-submit` (base64 in JSON), the port:

1. `prepareFormResumeUpload` — token + email → `find_or_create_candidate` →
   path `{company_id}/{job_id}/{candidateId}_{timestamp}.pdf` →
   `createSignedUploadUrl`
2. Browser `uploadToSignedUrl` into bucket `resumes`
3. `submitFormApplication` — validates path prefix + object existence, then
   inserts `form_submissions` / `job_applications`

### 4. Await `processJobApplicationPipeline(admin, …)` in submit

Source fire-and-forgets `resume-extraction`. The port awaits the shared lib with
the admin client after insert (`processing_source: 'form'`), matching ADR-0014.
Playwright keeps `AI_PIPELINE_STUB=1` so the apply E2E finishes in-process.

### 5. Credit gate retained at submit; duplicate email RPC parity

Submit still checks `get_company_service_cost` / `get_company_credit_balance`
and `check_duplicate_application_email` before writing rows (source form-submit
behaviour). Insufficient credits surface as a temporary-unavailable message.

### 6. Apply route loader + form kit deferral

`/apply/$token` prefetches via a route `loader` + `ensureQueryData` (ADR-0007);
invalid tokens leave the query in error state rather than failing the shell.
The apply form uses controlled inputs for this ticket — the port has no
`useAppForm` field kit yet (spec TanStack Form consolidation lands with a
shared kit, not ad-hoc per surface).

## Consequences

- Form Config enablement for a Job may still be Member-side (#12); E2E seeds an
  enabled `job_form_configs` row when missing.
- Production should set Upstash env vars for multi-instance rate limits.
- Interview token middleware reuses the same factory with `kind: 'interview'`.
- Submit fails closed when the Job has no hiring stages (JA + pipeline required).
