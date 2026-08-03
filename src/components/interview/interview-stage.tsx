import { useEffect, useRef, useState   } from 'react'
import type {Dispatch, SetStateAction} from 'react';
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Mic, Square } from 'lucide-react'
import type { AudioRecorder } from '#/hooks/use-audio-recorder'
import type { InterviewPublicQuestion } from '#/server/lib/ai/interview-conversation'
import type { QuestionFollowUpJson } from '#/integrations/supabase/types'
import {
  sendInterviewAnswer,
  uploadAndTranscribeAudio,
} from '#/lib/interview-client'
import { ManualInputQuestion } from './manual-input-question'
import { BooleanChoiceQuestion } from './boolean-choice-question'
import { DisplayOnlyQuestion } from './display-only-question'

export type ActiveInterviewState = {
  sessionId: string
  token: string
  currentQuestion: InterviewPublicQuestion
  currentQuestionIndex: number
  totalQuestions: number
  currentFollowUps: QuestionFollowUpJson[]
  isProcessing: boolean
  pendingTranscription: string | null
  followUpQuestion: string | null
}

type InterviewStageProps = {
  interviewState: ActiveInterviewState
  setInterviewState: Dispatch<SetStateAction<ActiveInterviewState>>
  onComplete: () => void
  audioRecorder: AudioRecorder
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function InterviewStage({
  interviewState,
  setInterviewState,
  onComplete,
  audioRecorder,
}: InterviewStageProps) {
  const { audioBlob, resetAudioBlob, isRecording, duration, startRecording, stopRecording } =
    audioRecorder
  const busyRef = useRef(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentQuestion = interviewState.currentQuestion
  const isLastQuestion =
    interviewState.currentQuestionIndex === interviewState.totalQuestions - 1
  const isBusy = interviewState.isProcessing
  const isVoiceQuestion =
    currentQuestion.type === 'ai_conversation' ||
    currentQuestion.type === 'transcription_only'

  const applyAction = async (
    questionId: string,
    response: string,
    transcription?: string,
  ) => {
    setErrorMessage(null)
    setInterviewState((prev) => ({
      ...prev,
      isProcessing: true,
      pendingTranscription:
        transcription ?? prev.pendingTranscription,
    }))

    try {
      const result = await sendInterviewAnswer(
        interviewState.token,
        questionId,
        response,
      )

      if (result.action === 'completed') {
        onComplete()
        return
      }

      if (result.action === 'follow_up') {
        setInterviewState((prev) => ({
          ...prev,
          isProcessing: false,
          pendingTranscription: null,
          currentFollowUps: result.updatedFollowUps,
          followUpQuestion: result.followUpQuestion,
        }))
        setTypedAnswer('')
        return
      }

      setInterviewState((prev) => ({
        ...prev,
        isProcessing: false,
        pendingTranscription: null,
        currentFollowUps: [],
        followUpQuestion: null,
        currentQuestion: result.nextQuestion,
        currentQuestionIndex: result.currentQuestionIndex,
        totalQuestions: result.totalQuestions,
      }))
      setTypedAnswer('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to process response',
      )
      setInterviewState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const handleAudioBlob = async (blob: Blob) => {
    if (busyRef.current || isBusy) return
    busyRef.current = true
    setInterviewState((prev) => ({ ...prev, isProcessing: true }))
    try {
      const transcription = await uploadAndTranscribeAudio(
        interviewState.token,
        blob,
      )
      resetAudioBlob()
      await applyAction(currentQuestion.id, transcription, transcription)
    } catch (error) {
      resetAudioBlob()
      setErrorMessage(
        error instanceof Error ? error.message : 'Transcription failed',
      )
      setInterviewState((prev) => ({ ...prev, isProcessing: false }))
    } finally {
      busyRef.current = false
    }
  }

  useEffect(() => {
    if (audioBlob && isVoiceQuestion && !isBusy) {
      void handleAudioBlob(audioBlob)
    }
  }, [audioBlob])

  const displayedQuestion =
    interviewState.followUpQuestion ?? currentQuestion.text

  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-6 px-4 py-8"
      data-testid="interview-stage"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span data-testid="interview-progress">
          Question {interviewState.currentQuestionIndex + 1} of{' '}
          {interviewState.totalQuestions}
        </span>
        {isBusy ? <span data-testid="interview-busy">Processing…</span> : null}
      </div>

      {interviewState.pendingTranscription ? (
        <div
          className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
          data-testid="interview-transcription"
        >
          <span className="font-medium">You said: </span>
          {interviewState.pendingTranscription}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="interview-error"
        >
          {errorMessage}
        </div>
      ) : null}

      {currentQuestion.type === 'manual_input' ? (
        <ManualInputQuestion
          question={displayedQuestion}
          placeholder={currentQuestion.placeholder}
          disabled={isBusy}
          onSubmit={(value) => void applyAction(currentQuestion.id, value)}
        />
      ) : null}

      {currentQuestion.type === 'boolean_choice' ? (
        <BooleanChoiceQuestion
          question={displayedQuestion}
          disabled={isBusy}
          onSubmit={(value) => void applyAction(currentQuestion.id, value)}
        />
      ) : null}

      {currentQuestion.type === 'display_only' ? (
        <DisplayOnlyQuestion
          message={displayedQuestion}
          isLastQuestion={isLastQuestion}
          disabled={isBusy}
          onComplete={() => void applyAction(currentQuestion.id, 'completed')}
        />
      ) : null}

      {isVoiceQuestion ? (
        <div className="space-y-4" data-testid="interview-voice">
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
            {displayedQuestion}
          </p>

          <div className="flex flex-col items-center gap-3">
            <Button
              type="button"
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              disabled={isBusy}
              onClick={() => {
                if (isRecording) stopRecording()
                else startRecording()
              }}
              data-testid="interview-record"
            >
              {isRecording ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop ({formatDuration(duration)})
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Record answer
                </>
              )}
            </Button>

            {/* Fixture / typed path — exercises Storage upload when a file is
                chosen; typed submit skips transcription for non-audio E2E. */}
            <Input
              type="file"
              accept="audio/webm,audio/*"
              className="max-w-md"
              disabled={isBusy}
              data-testid="interview-audio-file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleAudioBlob(file)
                e.target.value = ''
              }}
            />

            <div className="flex w-full max-w-md gap-2">
              <Input
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Or type your answer"
                disabled={isBusy}
                data-testid="interview-typed-answer"
              />
              <Button
                type="button"
                disabled={isBusy || typedAnswer.trim().length < 1}
                onClick={() =>
                  void applyAction(currentQuestion.id, typedAnswer.trim())
                }
                data-testid="interview-typed-submit"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
