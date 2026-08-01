# Keep the Vercel AI SDK; do not migrate to TanStack AI

The AI layer ports to TanStack Start on the existing Vercel AI SDK (`ai` +
`@ai-sdk/openai`, `-groq`, `-xai`, `-google`). The `@tanstack/ai` packages and
the demo `api/resume-chat` route that the installer added are removed.

## Considered options

- **Keep Vercel AI SDK (chosen).** Every AI call in the app is server-side
  structured work — `generateObject` (Zod) for resume/email extraction,
  `generateText` + tools for interview turns, `experimental_transcribe` for
  Whisper — none of it interactive streaming chat. On Vercel's full Node runtime
  the SDK behaves exactly as it did in the Deno edge functions, so the
  sophisticated `hedgedGenerateObject` + provider-fallback reliability layer in
  `ai-services-enhanced.ts` ports near-verbatim. No functional or UX change.
- **Migrate to `@tanstack/ai`.** Rejected — `@tanstack/ai`'s value is type-safe
  streaming chat for interactive UIs, a problem this app does not have. A full
  migration would re-roll the hedging/fallback logic around a different API,
  re-verify PDF vision, and source Groq + xAI adapters (not installed), risking
  the resume pipeline (core IP) for zero feature gain.
- **Hybrid.** Rejected as premature — there is no current streaming-chat feature.
  If one is added later, evaluate `@tanstack/ai` for that feature alone.

## Consequences

- `_shared/ai-services-enhanced.ts`, `runResumeExtraction.ts`, the prompt files,
  and the AI response schemas move to `src/server/lib/ai/`; `Deno.env.get`
  becomes `process.env` via the env module.
- `@tanstack/ai*` deps and `src/routes/api.resume-chat.ts` are deleted.
