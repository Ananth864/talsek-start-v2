import type { SupabaseClient } from '@supabase/supabase-js'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { experimental_transcribe as transcribe } from 'ai'
import type { Database } from '#/integrations/supabase/types'
import { serverEnv } from '../env'
import {
  STUB_TRANSCRIPTION_TEXT,
  shouldUseAiPipelineStub,
} from './interview-stub'

/**
 * Download interview audio from Storage and transcribe via Groq Whisper with
 * OpenAI Whisper fallback (source `transcribe-audio`). Audio never enters the
 * Vercel request body — only a Storage path is accepted (ADR-0003 / ADR-0017).
 */
export async function transcribeInterviewAudio(
  admin: SupabaseClient<Database>,
  audioPath: string,
): Promise<{ text: string; language: string | null; duration: number | null }> {
  if (shouldUseAiPipelineStub()) {
    return {
      text: STUB_TRANSCRIPTION_TEXT,
      language: 'en',
      duration: null,
    }
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from('resumes')
    .download(audioPath)

  if (downloadError) {
    throw new Error(
      `Failed to download interview audio: ${downloadError.message}`,
    )
  }

  const audioUint8Array = new Uint8Array(await blob.arrayBuffer())

  let text = ''
  let language: string | null = null
  let duration: number | null = null

  if (serverEnv.GROQ_API_KEY) {
    try {
      const groq = createGroq({ apiKey: serverEnv.GROQ_API_KEY })
      const result = await transcribe({
        model: groq.transcription('whisper-large-v3-turbo'),
        audio: audioUint8Array,
        providerOptions: { groq: { language: 'en' } },
        maxRetries: 1,
      })
      text = result.text.trim()
      language = result.language ?? null
      duration = result.durationInSeconds ?? null
    } catch (groqError) {
      console.warn(
        '[interview-transcribe] Groq Whisper failed; falling back to OpenAI',
        groqError,
      )
    }
  }

  if (!text) {
    if (!serverEnv.OPENAI_API_KEY) {
      throw new Error(
        'Transcription failed — GROQ_API_KEY / OPENAI_API_KEY not configured',
      )
    }
    const openai = createOpenAI({ apiKey: serverEnv.OPENAI_API_KEY })
    const result = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: audioUint8Array,
      maxRetries: 1,
    })
    text = result.text.trim()
    language = result.language ?? null
    duration = result.durationInSeconds ?? null
  }

  if (!text || text === 'Thank you.' || text.length < 25) {
    throw new Error(
      'No voice detected, please ensure your microphone is configured properly',
    )
  }

  return { text, language, duration }
}
