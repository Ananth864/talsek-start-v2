# Applicant interview by token

Ticket #12 ports the public Applicant Interview surface: open by token, start
(credit gate), progress through question types, AI conversation tool-calling
(follow-up vs advance), audio transcription via Storage, and completion.
This record captures the seams that diverge from the source edge functions.

## Decisions

### 1. `candidateTokenMiddleware({ kind: 'interview', requireStatus })`

Reuses the #11 factory. Interview tokens live on `interview_sessions.token`
(not a separate table). `requireStatus: 'pending'` gates GET + start (source
client rejects `in_progress` — no mid-session resume). Conversation /
transcription / audio prep use `requireStatus: 'in_progress'`. Expired rows
throw `INTERVIEW_EXPIRED`.

### 2. Audio via Storage signed upload (not FormData through Vercel)

Source `transcribe-audio` accepts multipart audio bytes. ADR-0003 forbids
shipping media through the Vercel request body, so the port mirrors form
resume upload:

1. `prepareInterviewAudioUpload` — path
   `{companyId}/{jobId}/interview-audio/{sessionId}/{uuid}.webm` in the
   existing `resumes` bucket → `createSignedUploadUrl`
2. Browser `uploadToSignedUrl`
3. `transcribeInterviewAudioFn` — validates path prefix, downloads via admin,
   runs Whisper

### 3. Separate rate-limit buckets

Source: conversation 15/min, transcription 10/min, start unlimited. Port:
middleware `interview` bucket on conversation; handler-level
`interview-transcribe` bucket on transcription; start / GET / audio prep pass
`rateLimit: false`.

### 4. AI stub shares `AI_PIPELINE_STUB`

When set (Playwright injects `AI_PIPELINE_STUB=1`), conversation always uses
deterministic tool decisions (one follow-up then advance) and transcription
returns a fixed ≥25-char string. Start also skips credit consume under stub so
E2E does not drain company credits (parity with resume-pipeline stub).

### 5. Credits on start; fail-open after status flip

Live path: balance check → optimistic `pending` → `in_progress` →
`consume_company_credits` for `screening_interview`. Charge failure after the
status flip is logged and the interview continues (source parity).

## Consequences

- Profile Interview tab remains empty-stated until a Member read path loads
  `interview_sessions` for a Job Application (session creation still lands
  with Reachout #16; E2E seeds rows directly).
- Production should set `GROQ_API_KEY` (Whisper primary) and `OPENAI_API_KEY`
  (fallback). A dedicated Storage bucket for interview audio can replace the
  `resumes` path prefix later without API changes.
- Route: `/interview/$token` with loader + `ensureQueryData` (ADR-0007).
