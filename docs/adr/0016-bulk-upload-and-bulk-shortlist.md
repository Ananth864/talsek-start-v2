# Bulk upload + bulk shortlist

Ticket #10 ports Member bulk resume intake and multi-select stage advance.
Source behaviour lives in `bulk-resume-upload` / `bulk-shortlist-candidates`
edge functions; the port diverges on Storage transport and Reachout scope.

## Decisions

### 1. Client → Storage; server receives path only

ADR-0003 forbids resume bytes in the Vercel request body. Source
`bulk-resume-upload` accepts `multipart/formData`. The port:

1. `prepareBulkResumeUpload` — Member auth + RLS Job lookup → path
   `{company_id}/{job_id}/{uuid}.pdf` (source bulk convention) →
   `createSignedUploadUrl` via admin client after access is proven
2. Browser `uploadToSignedUrl` into bucket `resumes`
3. `processBulkResumeUpload` — validates path prefix + object existence,
   then extract / create Job Application / await match

### 2. Member-authenticated; user-scoped DB + pipeline

Bulk is a Member session (unlike #11). Server functions use
`authMiddleware` and the user-scoped client for Job Application writes and
`processJobApplicationPipeline` (admin-only UPDATE RLS — same consequence as
ADR-0010/0013; E2E Member is company admin). Admin client is used only to mint
signed upload URLs after RLS proves Job access — not as a session-less
business-data bypass (clarifies ADR-0014 §2's earlier “#10 bulk → admin”
wording).

### 3. Inline extract, then `skipExtraction` match

Source extracts before insert so email can come from the PDF, then
fire-and-forgets match. The port downloads the already-uploaded object,
runs Resume Extraction (or the deterministic stub), resolves email
(manual override wins), `find_or_create_candidate`, inserts/overwrites the
Job Application with `parsed_candidate_data` + `processing_source:
'bulk_upload'`, then `await processJobApplicationPipeline(client, {
applicationId, skipExtraction: true })` (ADR-0014 §7).

### 4. Bulk shortlist advances stage only — Reachout stays #16

**Superseded by ADR-0024 / ticket #21.** Issue #10 shipped stage-only bulk
shortlist; #21 reuses `sendReachoutAndAdvance` for Reachout send + stage
advance (and adds bulk reject). Historical note: #10 validated same-stage
selection (max 10) and updated `current_stage_id` only.

### 5. Credit gate at process time; stub skips consume

`processBulkResumeUpload` checks company credit balance before extract
(source 402 parity). The pipeline stub still skips `consume_company_credits`
so Playwright under `AI_PIPELINE_STUB=1` does not drain the company.

## Consequences

- Bulk upload UI lives at `/bulk-upload`; board selection uses a confirm bar
  without the source Reachout modal.
- Overwrite-on-existing (job + candidate) matches source bulk, not form's
  duplicate hard-block.
- Non-admin Members hit UPDATE RLS on pipeline / stage moves until a policy
  change.
