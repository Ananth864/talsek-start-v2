import type { EmailBulletInsightsJson } from '#/integrations/supabase/types'
import { generateObjectWithRetry } from './ai-services'
import { getEmailAnalysisPrompt } from './prompts'
import { emailBulletInsightsSchema } from './schemas'

/**
 * Email Analysis AI op — ports the source `email-analysis` edge function's
 * generateObject call. Primary OpenAI → fallback Gemini. Soft-failure is
 * handled by the orchestrator (status stays `active`).
 */
export async function runEmailAnalysis(input: {
  candidateName: string
  emailBody: string
}): Promise<{
  insights: EmailBulletInsightsJson
  modelUsed: string
  attemptsUsed: number
  fallbackUsed: boolean
}> {
  const result = await generateObjectWithRetry({
    primaryModel: 'openai',
    fallbackModel: 'gemini',
    schema: emailBulletInsightsSchema,
    operationName: 'Email Bullet Insights',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: getEmailAnalysisPrompt(input.candidateName, input.emailBody),
          },
        ],
      },
    ],
    providerOptions: {
      openai: {
        reasoningEffort: 'minimal',
        textVerbosity: 'low',
      },
    },
  })

  return {
    insights: result.object,
    modelUsed: result.modelUsed,
    attemptsUsed: result.attemptsUsed,
    fallbackUsed: result.fallbackUsed,
  }
}
