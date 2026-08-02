import type { ResumeExtractionJson } from '#/integrations/supabase/types'
import { generateObjectWithRetry } from './ai-services'
import { getResumeExtractionPrompt } from './prompts'
import { resumeExtractionSchema } from './schemas'

type RunResumeExtractionInput = {
  resumeBytes: Uint8Array
  todayDate?: string
}

type RunResumeExtractionResult = {
  extracted: ResumeExtractionJson
  modelUsed: string
  attemptsUsed: number
  fallbackUsed: boolean
}

/**
 * Resume Extraction AI op — ports
 * `supabase/functions/_shared/runResumeExtraction.ts`. Primary Gemini →
 * fallback OpenAI; PDF attached as a multimodal file part.
 */
export async function runResumeExtraction(
  input: RunResumeExtractionInput,
): Promise<RunResumeExtractionResult> {
  const {
    resumeBytes,
    todayDate = new Date().toISOString().split('T')[0],
  } = input

  const result = await generateObjectWithRetry({
    primaryModel: 'gemini',
    fallbackModel: 'openai',
    schema: resumeExtractionSchema,
    operationName: 'Resume Extraction',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: getResumeExtractionPrompt(todayDate),
          },
          {
            type: 'file',
            data: resumeBytes,
            mediaType: 'application/pdf',
          },
        ],
      },
    ],
    providerOptions: {
      openai: {
        reasoningEffort: 'low',
        textVerbosity: 'low',
      },
      groq: {
        reasoningEffort: 'medium',
        reasoningFormat: 'hidden',
      },
    },
  })

  return {
    extracted: result.object,
    modelUsed: result.modelUsed,
    attemptsUsed: result.attemptsUsed,
    fallbackUsed: result.fallbackUsed,
  }
}
