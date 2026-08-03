import {
  prepareInterviewAudioUpload,
  submitInterviewResponse,
  transcribeInterviewAudioFn,
} from '#/server/fn/interview'
import { supabaseBrowser } from '#/lib/supabase'
import type { InterviewConversationResult } from '#/server/lib/ai/interview-conversation'

export async function uploadAndTranscribeAudio(
  token: string,
  audioBlob: Blob,
): Promise<string> {
  const prepared = await prepareInterviewAudioUpload({ data: { token } })

  const { error: uploadError } = await supabaseBrowser.storage
    .from('resumes')
    .uploadToSignedUrl(prepared.path, prepared.token, audioBlob, {
      contentType: 'audio/webm',
    })

  if (uploadError) {
    throw new Error(`Audio upload failed: ${uploadError.message}`)
  }

  const result = await transcribeInterviewAudioFn({
    data: { token, audioPath: prepared.path },
  })

  if (!result.text) {
    throw new Error('No transcription text received')
  }

  return result.text
}

export async function sendInterviewAnswer(
  token: string,
  questionId: string,
  response: string,
): Promise<InterviewConversationResult> {
  return submitInterviewResponse({
    data: { token, questionId, response },
  })
}
