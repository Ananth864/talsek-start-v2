import {
  generateObject,
  NoObjectGeneratedError,
  NoSuchToolError,
  RetryError,
} from 'ai'
import type { ModelMessage, Schema } from 'ai'
import type { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { serverEnv } from '../env'

/**
 * AI services ported from the source's `supabase/functions/_shared/ai-services-enhanced.ts`
 * (ADR-0005): a hedged `generateObject` with single provider fallback. The
 * reliability layer ports near-verbatim; only the environment access changes
 * (`Deno.env.get` → validated `serverEnv`).
 *
 * Provider scope for the domains ported so far: OpenAI, xAI/Grok, and Gemini
 * (Resume Extraction primary / Email Analysis fallback — #9). Groq remains
 * unwired until a domain selects it as a language-model primary/fallback
 * (Whisper transcription is a separate path). A caller requesting an
 * unconfigured provider gets a clear error rather than a silent failure.
 */

type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[]
type ProviderOptions = Record<string, Record<string, JSONValue>>

export type AiProvider = 'openai' | 'grok' | 'gemini'

function getModelName(provider: AiProvider): string {
  if (provider === 'openai') return 'GPT-5.6 Luna'
  if (provider === 'gemini') return 'Gemini 2.5 Flash'
  return 'Grok-4 Fast'
}

/**
 * Resolves a concrete model for a provider, throwing a descriptive error if the
 * provider's credentials are absent (rather than throwing at module load like
 * the source). Keys are optional so dev/E2E can run without provider creds.
 */
function getModelByProvider(provider: AiProvider) {
  if (provider === 'openai') {
    if (!serverEnv.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY is not configured — set it to use the OpenAI provider.',
      )
    }
    const openai = createOpenAI({
      apiKey: serverEnv.OPENAI_API_KEY,
      baseURL: serverEnv.OPENAI_BASE_URL,
    })
    return openai('gpt-5.6-luna')
  }
  if (provider === 'gemini') {
    if (!serverEnv.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not configured — set it to use the Gemini provider.',
      )
    }
    const google = createGoogleGenerativeAI({
      apiKey: serverEnv.GEMINI_API_KEY,
    })
    return google('gemini-2.5-flash')
  }
  // grok (xAI)
  if (!serverEnv.GROK_API_KEY) {
    throw new Error(
      'GROK_API_KEY is not configured — set it to use the Grok provider.',
    )
  }
  const xai = createXai({ apiKey: serverEnv.GROK_API_KEY })
  return xai('grok-4-fast-reasoning')
}

// Hedged generateObject: start primary immediately; if not settled after the
// delay, start a second parallel attempt. The first successful response wins;
// late results are ignored. Ported verbatim from the source.
const HEDGE_DELAY_MS = 120_000
const HEDGE_DEADLINE_MS = 200_000

async function hedgedGenerateObject(
  args: Parameters<typeof generateObject>[0],
): Promise<Awaited<ReturnType<typeof generateObject>>> {
  return await new Promise((resolve, reject) => {
    let settled = false
    let hedgeStarted = false
    let failures = 0

    const finishSuccess = (label: 'primary' | 'hedge', value: unknown) => {
      if (settled) return
      settled = true
      console.log(`[ai-services] Hedge ${label} attempt won`)
      resolve(value as Awaited<ReturnType<typeof generateObject>>)
    }

    const finishFailure = (err: unknown) => {
      if (settled) return
      failures += 1
      if (hedgeStarted && failures >= 2) {
        settled = true
        reject(err)
      }
    }

    generateObject(args)
      .then((v) => finishSuccess('primary', v))
      .catch(finishFailure)

    const hedgeStartTimer = setTimeout(() => {
      if (settled) return
      hedgeStarted = true
      console.log(
        `[ai-services] Starting hedged call after ${HEDGE_DELAY_MS}ms`,
      )
      generateObject(args)
        .then((v) => finishSuccess('hedge', v))
        .catch(finishFailure)
    }, HEDGE_DELAY_MS)

    const deadlineTimer = setTimeout(() => {
      if (settled) return
      settled = true
      console.warn(
        `[ai-services] Primary hedge deadline exceeded (${HEDGE_DEADLINE_MS}ms)`,
      )
      reject(new Error('Primary hedge deadline exceeded'))
    }, HEDGE_DEADLINE_MS)

    const clearOnSettle = () => {
      if (settled) {
        clearTimeout(hedgeStartTimer)
        clearTimeout(deadlineTimer)
      } else {
        setTimeout(clearOnSettle, 50)
      }
    }
    clearOnSettle()
  })
}

/**
 * Enhanced generateObject with hedging + a single provider fallback. Returns
 * the parsed object plus metadata. Sentry capture is deferred to the
 * cross-cutting observability wiring; failures are logged here.
 */
export async function generateObjectWithRetry<TSchema extends z.ZodTypeAny>(
  params: {
    primaryModel: AiProvider
    fallbackModel?: AiProvider
    schema: TSchema
    messages: ModelMessage[]
    temperature?: number
    operationName: string
    providerOptions?: ProviderOptions
  },
): Promise<{
  object: z.infer<TSchema>
  modelUsed: string
  attemptsUsed: number
  fallbackUsed: boolean
}> {
  const {
    primaryModel,
    fallbackModel,
    schema,
    messages,
    temperature = 0.1,
    operationName,
    providerOptions,
  } = params
  const aiSchema = schema as unknown as Schema

  const primaryModelName = getModelName(primaryModel)
  console.log(
    `[ai-services] Starting ${operationName} with ${primaryModelName}` +
      (fallbackModel ? ` (fallback: ${getModelName(fallbackModel)})` : ''),
  )

  let attemptsUsed = 0
  let fallbackUsed = false

  try {
    attemptsUsed++
    const model = getModelByProvider(primaryModel)
    const result = await hedgedGenerateObject({
      model,
      schema: aiSchema,
      messages,
      temperature,
      ...(providerOptions ? { providerOptions } : {}),
    })
    console.log(
      `[ai-services] ${operationName} succeeded with ${primaryModelName}`,
    )
    return {
      object: result.object as z.infer<TSchema>,
      modelUsed: primaryModelName,
      attemptsUsed,
      fallbackUsed,
    }
  } catch (primaryError) {
    console.warn(
      `[ai-services] Primary ${primaryModelName} failed for ${operationName}:`,
      primaryError instanceof Error ? primaryError.message : primaryError,
    )

    if (!fallbackModel) throw primaryError

    const fallbackModelName = getModelName(fallbackModel)
    console.log(`[ai-services] Falling back to ${fallbackModelName}`)
    fallbackUsed = true

    try {
      attemptsUsed++
      const model = getModelByProvider(fallbackModel)
      const fallbackResult = await generateObject({
        model,
        schema: aiSchema,
        messages,
        temperature,
        ...(providerOptions ? { providerOptions } : {}),
      })
      console.log(
        `[ai-services] ${operationName} succeeded with ${fallbackModelName} fallback`,
      )
      return {
        object: fallbackResult.object as z.infer<TSchema>,
        modelUsed: `${fallbackModelName} (fallback)`,
        attemptsUsed,
        fallbackUsed,
      }
    } catch (fallbackError) {
      logAIError(fallbackError, operationName, {
        primaryModel,
        fallbackModel,
        totalAttempts: attemptsUsed,
      })
      throw fallbackError
    }
  }
}

/**
 * Structured error logging for AI calls (ported from source). Sentry capture is
 * deferred to the observability domain; this keeps the classification + console
 * output faithful so it is ready to wire.
 */
export function logAIError(
  error: unknown,
  operationName: string,
  context: Record<string, unknown> = {},
) {
  console.error(`[ai-services] Error in ${operationName}:`)
  if (NoObjectGeneratedError.isInstance(error)) {
    console.error('  Type: NoObjectGeneratedError')
    console.error('  Cause:', error.cause)
    console.error('  Text:', error.text)
    console.error('  Finish Reason:', error.finishReason)
  } else if (RetryError.isInstance(error)) {
    console.error('  Type: RetryError')
    console.error('  Message:', error.message)
  } else if (NoSuchToolError.isInstance(error)) {
    console.error('  Type: NoSuchToolError')
    console.error('  Message:', error.message)
  } else if (error instanceof Error) {
    console.error('  Type: Generic Error')
    console.error('  Message:', error.message)
  } else {
    console.error('  Type: Unknown')
    console.error('  Value:', error)
  }
  if (Object.keys(context).length > 0) {
    console.error('  Context:', context)
  }
}
