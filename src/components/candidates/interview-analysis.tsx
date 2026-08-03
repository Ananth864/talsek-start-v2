import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  XCircle,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { ConversationModal } from './conversation-modal'
import { formatProfileDate } from '#/lib/candidate-profile-model'
import type { QuestionCompletedJson } from '#/integrations/supabase/json-types'
import type { InterviewSessionRow } from '#/server/fn/candidate-profile'

type InterviewAnalysisProps = {
  session: InterviewSessionRow
  candidateName?: string
  fallbackCreatedAt?: string | null
}

function isRequirementQuestion(questionText: string) {
  const text = questionText.toLowerCase()
  return (
    text.includes('willing to work') ||
    text.includes('can you join by this date') ||
    text.includes('salary expectation') ||
    text.includes('salary expectations') ||
    text.includes('are you willing') ||
    text.includes('okay with this')
  )
}

function passesRequirement(answer: string) {
  return answer.trim().toLowerCase() === 'yes'
}

/**
 * Interview tab body — sections match the source `renderInterviewAnalysis`
 * (Introduction, Profile Assessment with conversation modal, Motivation,
 * Requirement Fit Check).
 */
export function InterviewAnalysis({
  session,
  candidateName,
  fallbackCreatedAt,
}: InterviewAnalysisProps) {
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionCompletedJson | null>(null)
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<
    number | undefined
  >()
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false)

  const questionsCompleted = session.questions_completed
  const context = session.interview_context.questions

  const getQuestionDef = (questionId: string) =>
    context.find((qDef) => qDef.id === questionId)

  const introductionQuestion = questionsCompleted.find((q) => {
    const questionDef = getQuestionDef(q.questionId)
    return (
      questionDef?.type === 'transcription_only' &&
      (q.mainQuestion.toLowerCase().includes('introduction') ||
        q.mainQuestion.toLowerCase().includes('academic background'))
    )
  })

  const profileAssessmentQuestions = questionsCompleted.filter((q) => {
    const questionDef = getQuestionDef(q.questionId)
    return questionDef?.type === 'ai_conversation'
  })

  const motivationQuestion = questionsCompleted.find((q) => {
    const questionDef = getQuestionDef(q.questionId)
    return (
      questionDef?.type === 'transcription_only' &&
      q.mainQuestion.toLowerCase().includes('change in employment')
    )
  })

  const requirementQuestions = questionsCompleted.filter((q) => {
    const questionDef = getQuestionDef(q.questionId)
    return (
      questionDef?.type === 'manual_input' ||
      questionDef?.type === 'boolean_choice'
    )
  })

  return (
    <>
      <div
        className="rounded-lg border border-border bg-card p-4 shadow-sm"
        data-testid="interview-session-panel"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-lg font-semibold text-foreground">
            Interview Analysis
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant={session.status === 'completed' ? 'default' : 'secondary'}
              data-testid="interview-session-status"
            >
              {session.status.replace(/_/g, ' ')}
            </Badge>
            <span>
              Session created on{' '}
              {formatProfileDate(
                session.created_at || fallbackCreatedAt,
                'long',
                'unknown date',
              )}
            </span>
          </div>
        </div>

        {questionsCompleted.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No interview responses available yet.
          </div>
        ) : (
          <div className="space-y-6" data-testid="interview-analysis">
            {introductionQuestion ? (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-foreground">
                  Introduction
                </h4>
                <div className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm">
                  <div className="mb-2 font-medium text-foreground">
                    Q: {introductionQuestion.mainQuestion}
                  </div>
                  {introductionQuestion.mainAnswer ? (
                    <div className="mt-3 rounded border border-border bg-muted p-3">
                      <span className="font-medium text-foreground">
                        Answer:
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {introductionQuestion.mainAnswer}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {profileAssessmentQuestions.length > 0 ? (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-foreground">
                  Profile Assessment
                </h4>
                <div className="space-y-4">
                  {profileAssessmentQuestions.map((q, index) => {
                    const satisfactory = q.satisfactory
                    const badgeClass =
                      satisfactory === true
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : satisfactory === false
                          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          : 'border-border bg-muted text-muted-foreground'
                    const label =
                      satisfactory === true
                        ? 'Satisfactory'
                        : satisfactory === false
                          ? 'Not Satisfactory'
                          : 'Pending Evaluation'

                    return (
                      <div
                        key={q.questionId || index}
                        className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm"
                        data-testid="interview-ai-question"
                      >
                        <div className="mb-2 font-medium text-foreground">
                          Q: {q.mainQuestion}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                          >
                            {label}
                          </span>
                        </div>
                        {q.ai_assessment ? (
                          <div className="mt-3 rounded border border-border bg-muted p-3">
                            <span className="font-medium text-foreground">
                              AI Assessment:
                            </span>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {q.ai_assessment}
                            </p>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuestion(q)
                            setSelectedQuestionNumber(index + 1)
                            setIsConversationModalOpen(true)
                          }}
                          className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                          data-testid="show-full-conversation"
                        >
                          <MessageSquare size={16} />
                          <span>Show Full Conversation</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {motivationQuestion ? (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-foreground">
                  Motivation
                </h4>
                <div className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm">
                  <div className="mb-2 font-medium text-foreground">
                    Q: {motivationQuestion.mainQuestion}
                  </div>
                  {motivationQuestion.mainAnswer ? (
                    <div className="mt-3 rounded border border-border bg-muted p-3">
                      <span className="font-medium text-foreground">
                        Answer:
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {motivationQuestion.mainAnswer}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {requirementQuestions.length > 0 ? (
              <div>
                <h4 className="mb-4 text-lg font-semibold text-foreground">
                  Requirement Fit Check
                </h4>
                {(() => {
                  const actualRequirementQuestions = requirementQuestions.filter(
                    (q) => isRequirementQuestion(q.mainQuestion || ''),
                  )
                  const informationalQuestions = requirementQuestions.filter(
                    (q) => !isRequirementQuestion(q.mainQuestion || ''),
                  )

                  return (
                    <>
                      {actualRequirementQuestions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {actualRequirementQuestions.map((q, index) => {
                            const passes = passesRequirement(
                              q.mainAnswer || '',
                            )
                            const rawAnswer = q.mainAnswer.trim().toLowerCase()
                            const answerLabel =
                              rawAnswer === 'yes'
                                ? 'Meets Requirement'
                                : rawAnswer === 'no'
                                  ? 'Does Not Meet Requirement'
                                  : q.mainAnswer || 'No answer'

                            return (
                              <div
                                key={q.questionId || index}
                                className={`relative rounded-lg border-2 p-5 shadow-sm transition-all hover:shadow-md ${
                                  passes
                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200'
                                    : 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-200'
                                }`}
                              >
                                <div className="absolute right-3 top-3">
                                  {passes ? (
                                    <CheckCircle
                                      className="text-emerald-500 dark:text-emerald-200"
                                      size={24}
                                    />
                                  ) : (
                                    <XCircle
                                      className="text-rose-500 dark:text-rose-200"
                                      size={24}
                                    />
                                  )}
                                </div>
                                <h5 className="mb-2 pr-8 font-semibold text-foreground">
                                  {q.mainQuestion}
                                </h5>
                                <p className="text-sm text-foreground/80">
                                  <span className="font-medium">Answer:</span>{' '}
                                  {answerLabel}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}

                      {informationalQuestions.length > 0 ? (
                        <div className="mt-6">
                          <h5 className="mb-3 text-base font-semibold text-foreground">
                            Additional Information
                          </h5>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {informationalQuestions.map((q, index) => (
                              <div
                                key={q.questionId || index}
                                className="relative rounded-lg border-2 border-border bg-muted p-5 text-foreground shadow-sm"
                              >
                                <div className="absolute right-3 top-3 text-muted-foreground">
                                  <AlertTriangle size={24} />
                                </div>
                                <h5 className="mb-2 pr-8 font-semibold text-foreground">
                                  {q.mainQuestion}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Answer:</span>{' '}
                                  {q.mainAnswer || 'No answer'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )
                })()}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ConversationModal
        open={isConversationModalOpen}
        onClose={() => {
          setIsConversationModalOpen(false)
          setSelectedQuestion(null)
        }}
        question={selectedQuestion}
        questionNumber={selectedQuestionNumber}
        candidateName={candidateName}
      />
    </>
  )
}
