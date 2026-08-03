import { shouldUseAiPipelineStub } from './pipeline-stub'

export { shouldUseAiPipelineStub }

/** Deterministic transcription for E2E / no-credentials runs (≥25 chars). */
export const STUB_TRANSCRIPTION_TEXT =
  'This is a deterministic stub transcription for the E2E interview journey.'

export function stubInterviewAiDecision(opts: {
  currentFollowUpCount: number
  maxFollowUps: number
  response: string
}):
  | { tool: 'recordFollowUp'; followUpQuestion: string; reasoning: string }
  | { tool: 'moveToNextQuestion'; assessment: string; satisfactory: boolean } {
  // First answer on an AI question with follow-up budget → one follow-up so
  // E2E can assert the follow-up vs advance branch, then always advance.
  if (opts.currentFollowUpCount === 0 && opts.maxFollowUps > 0) {
    return {
      tool: 'recordFollowUp',
      followUpQuestion:
        'Can you share one concrete example that supports that answer?',
      reasoning: 'Stub follow-up to exercise the interview turn branch.',
    }
  }
  return {
    tool: 'moveToNextQuestion',
    assessment: `Stub assessment of answer: ${opts.response.slice(0, 80)}`,
    satisfactory: true,
  }
}
