import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '#/components/ui/card'
import { WelcomeStage } from '#/components/interview/welcome-stage'
import { InterviewStage } from '#/components/interview/interview-stage'
import type { ActiveInterviewState } from '#/components/interview/interview-stage'
import { CompletionStage } from '#/components/interview/completion-stage'
import { useAudioRecorder } from '#/hooks/use-audio-recorder'
import { getInterviewByToken, startInterview } from '#/server/fn/interview'

const interviewQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['interview-session', token],
    queryFn: () => getInterviewByToken({ data: { token } }),
    retry: false,
  })

export const Route = createFileRoute('/interview/$token')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        interviewQueryOptions(params.token),
      )
    } catch {
      // Surface via useQuery error UI — do not fail the whole route shell.
    }
  },
  component: InterviewPage,
})

type Stage = 'welcome' | 'interview' | 'complete'

function InterviewPage() {
  const { token } = Route.useParams()
  const audioRecorder = useAudioRecorder()
  const [stage, setStage] = useState<Stage>('welcome')
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [interviewState, setInterviewState] =
    useState<ActiveInterviewState | null>(null)

  const sessionQuery = useQuery(interviewQueryOptions(token))

  useEffect(() => {
    return () => {
      audioRecorder.cleanup()
    }
  }, [])

  if (sessionQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardContent className="p-6">Validating interview link…</CardContent>
        </Card>
      </div>
    )
  }

  const errorMessage =
    sessionQuery.error instanceof Error ? sessionQuery.error.message : null
  const isInvalid =
    !!errorMessage &&
    /invalid interview|expired|already been|no longer active/i.test(
      errorMessage,
    )

  if (isInvalid && !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-6" data-testid="interview-invalid">
            {errorMessage || 'Invalid or expired interview link.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (sessionQuery.error && !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="p-6" data-testid="interview-load-error">
            {errorMessage || 'Failed to load interview'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = sessionQuery.data!

  const handleBegin = async () => {
    setIsStarting(true)
    setStartError(null)
    try {
      const started = await startInterview({ data: { token } })
      setInterviewState({
        sessionId: started.sessionId,
        token,
        currentQuestion: started.firstQuestion,
        currentQuestionIndex: 0,
        totalQuestions: started.totalQuestions,
        currentFollowUps: [],
        isProcessing: false,
        pendingTranscription: null,
        followUpQuestion: null,
      })
      setStage('interview')
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : 'Failed to start interview',
      )
    } finally {
      setIsStarting(false)
    }
  }

  if (stage === 'complete') {
    return <CompletionStage />
  }

  if (stage === 'interview' && interviewState) {
    return (
      <InterviewStage
        interviewState={interviewState}
        setInterviewState={(updater) => {
          setInterviewState((prev) => {
            if (!prev) return prev
            return typeof updater === 'function' ? updater(prev) : updater
          })
        }}
        onComplete={() => {
          audioRecorder.cleanup()
          setStage('complete')
        }}
        audioRecorder={audioRecorder}
      />
    )
  }

  return (
    <div data-testid="interview-page">
      {startError ? (
        <div className="mx-auto max-w-2xl px-6 pt-6">
          <Card className="border-red-200 bg-red-50 text-red-800">
            <CardContent className="p-4" data-testid="interview-start-error">
              {startError}
            </CardContent>
          </Card>
        </div>
      ) : null}
      <WelcomeStage
        onBegin={() => void handleBegin()}
        audioRecorder={audioRecorder}
        isStarting={isStarting}
        jobTitle={data.jobTitle}
        companyName={data.companyName}
      />
    </div>
  )
}
