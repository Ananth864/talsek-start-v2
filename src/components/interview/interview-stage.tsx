import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Bot } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import type { AudioRecorder } from '#/hooks/use-audio-recorder'
import type { InterviewPublicQuestion } from '#/server/lib/ai/interview-conversation'
import type { QuestionFollowUpJson } from '#/integrations/supabase/types'
import {
  sendInterviewAnswer,
  uploadAndTranscribeAudio,
} from '#/lib/interview-client'
import { AIVoiceInput } from './ai-voice-input'
import { BotBubble, UserBubble } from './chat-bubbles'
import { ManualInputQuestion } from './manual-input-question'
import { BooleanChoiceQuestion } from './boolean-choice-question'
import { DisplayOnlyQuestion } from './display-only-question'

export type ConversationTurn = {
  questionId: string
  mainQuestion: string
  mainAnswer: string
  followUps?: QuestionFollowUpJson[]
}

export type ActiveInterviewState = {
  sessionId: string
  token: string
  currentQuestion: InterviewPublicQuestion
  currentQuestionIndex: number
  totalQuestions: number
  /** Voice-section progress denominator (source InterviewPage). */
  manualInputStartIndex: number
  conversationHistory: ConversationTurn[]
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

export function InterviewStage({
  interviewState,
  setInterviewState,
  onComplete,
  audioRecorder,
}: InterviewStageProps) {
  const { audioBlob, resetAudioBlob } = audioRecorder
  const busyRef = useRef(false)
  const conversationAreaRef = useRef<HTMLDivElement>(null)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentQuestion = interviewState.currentQuestion
  const isLastQuestion =
    interviewState.currentQuestionIndex === interviewState.totalQuestions - 1
  const isBusy = interviewState.isProcessing
  const isVoiceQuestion =
    currentQuestion.type === 'ai_conversation' ||
    currentQuestion.type === 'transcription_only'

  const progressDenom = Math.max(interviewState.manualInputStartIndex, 1)
  const progressNumerator = Math.min(
    interviewState.currentQuestionIndex + 1,
    progressDenom,
  )
  const progressPercent = Math.min(
    (progressNumerator / progressDenom) * 100,
    100,
  )

  const scrollToBottom = () => {
    if (conversationAreaRef.current) {
      conversationAreaRef.current.scrollTo({
        top: conversationAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [
    interviewState.currentQuestionIndex,
    interviewState.currentFollowUps.length,
    interviewState.followUpQuestion,
    interviewState.pendingTranscription,
    interviewState.conversationHistory.length,
  ])

  const applyAction = async (
    questionId: string,
    response: string,
    transcription?: string,
  ) => {
    setErrorMessage(null)
    setInterviewState((prev) => ({
      ...prev,
      isProcessing: true,
      pendingTranscription: transcription ?? prev.pendingTranscription,
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

      const mainAnswer =
        interviewState.currentFollowUps[0]?.initialAnswer?.trim() ||
        transcription ||
        response

      const completedTurn: ConversationTurn = {
        questionId: currentQuestion.id,
        mainQuestion: currentQuestion.text,
        mainAnswer,
        followUps:
          interviewState.currentFollowUps.length > 0
            ? interviewState.currentFollowUps
            : undefined,
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
        conversationHistory: [...prev.conversationHistory, completedTurn],
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
      className="dark fixed inset-0 overflow-hidden bg-background text-foreground"
      data-testid="interview-stage"
    >
      {/* Header with Progress */}
      <div className="relative z-10 border-b border-border bg-card/80 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center justify-between md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-muted md:h-8 md:w-8">
                <Bot className="h-4 w-4 text-primary md:h-5 md:w-5" />
              </div>
              <h1 className="text-lg font-semibold md:text-xl">
                Talsek Interview
              </h1>
            </div>
            <div
              className="text-xs font-medium text-muted-foreground md:text-sm"
              data-testid="interview-progress"
            >
              <span className="tabular-nums">
                {progressNumerator}/{progressDenom}
              </span>
              {/* Keep "Question N of M" visible — behavioural E2E asserts it. */}
              <span className="ml-2">
                Question {interviewState.currentQuestionIndex + 1} of{' '}
                {interviewState.totalQuestions}
              </span>
            </div>
          </div>

          <div
            className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-muted md:h-2"
            data-testid="interview-progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col md:h-[calc(100vh-90px)]">
        <div
          ref={conversationAreaRef}
          className="flex-1 overflow-y-auto scroll-smooth p-4 pb-2 md:p-6"
        >
          <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
            {interviewState.conversationHistory.map((turn) => (
              <div
                key={turn.questionId}
                className="space-y-3 md:space-y-4"
                data-testid="interview-history-turn"
              >
                <BotBubble>
                  <p className="text-sm leading-relaxed md:text-base">
                    {turn.mainQuestion}
                  </p>
                </BotBubble>
                <UserBubble>
                  <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {turn.mainAnswer}
                  </p>
                </UserBubble>
                {turn.followUps?.map((followUp, fIdx) => (
                  <div
                    key={`${turn.questionId}-fu-${fIdx}`}
                    className="ml-4 space-y-3 md:ml-8 md:space-y-4"
                  >
                    <BotBubble compact>
                      <p className="text-xs leading-relaxed md:text-sm">
                        {followUp.question}
                      </p>
                    </BotBubble>
                    {followUp.answer ? (
                      <UserBubble compact>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {followUp.answer}
                        </p>
                      </UserBubble>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}

            {isVoiceQuestion ? (
              <div
                className="space-y-3 md:space-y-4"
                data-testid="interview-voice"
              >
                {interviewState.currentFollowUps.length === 0 ? (
                  <BotBubble>
                    <p className="text-sm leading-relaxed md:text-base">
                      {currentQuestion.text}
                    </p>
                  </BotBubble>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    <BotBubble>
                      <p className="text-sm leading-relaxed md:text-base">
                        {currentQuestion.text}
                      </p>
                    </BotBubble>
                    {interviewState.currentFollowUps[0]?.initialAnswer ? (
                      <UserBubble>
                        <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                          {interviewState.currentFollowUps[0].initialAnswer}
                        </p>
                      </UserBubble>
                    ) : null}
                  </div>
                )}

                {interviewState.currentFollowUps.map((followUp, idx) => (
                  <div
                    key={`current-fu-${idx}`}
                    className="ml-4 space-y-3 md:ml-8 md:space-y-4"
                  >
                    <BotBubble compact>
                      <p className="text-xs leading-relaxed md:text-sm">
                        {followUp.question}
                      </p>
                    </BotBubble>
                    {followUp.answer.trim() ? (
                      <UserBubble compact>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {followUp.answer}
                        </p>
                      </UserBubble>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {interviewState.pendingTranscription ? (
              <div data-testid="interview-transcription">
                <UserBubble processing>
                  <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {interviewState.pendingTranscription}
                  </p>
                  {isBusy ? (
                    <div
                      className="mt-2 flex items-center gap-2"
                      data-testid="interview-busy"
                    >
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">
                        Processing...
                      </span>
                    </div>
                  ) : null}
                </UserBubble>
              </div>
            ) : isBusy ? (
              <span className="sr-only" data-testid="interview-busy">
                Processing…
              </span>
            ) : null}

            {errorMessage ? (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                data-testid="interview-error"
              >
                {errorMessage}
              </div>
            ) : null}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/80 p-3 md:p-4">
          {isVoiceQuestion ? (
            <div className="space-y-3">
              <AIVoiceInput audioRecorder={audioRecorder} disabled={isBusy} />

              {/* E2E / accessibility fallbacks — source has voice-only chrome. */}
              <Input
                type="file"
                accept="audio/webm,audio/*"
                className="sr-only"
                disabled={isBusy}
                data-testid="interview-audio-file"
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleAudioBlob(file)
                  e.target.value = ''
                }}
              />

              <div className="mx-auto flex w-full max-w-md gap-2">
                <Input
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Or type your answer"
                  disabled={isBusy}
                  className="bg-background"
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
              onComplete={() =>
                void applyAction(currentQuestion.id, 'completed')
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
