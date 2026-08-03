import { FileText } from 'lucide-react'
import type { FormQuestion, FormQuestionsJson } from '#/integrations/supabase/types'
import type { FormSubmissionResult } from '#/server/fn/candidate-profile'
import { MANDATORY_QUESTIONS } from '#/lib/form-questions-shared'

type FormAnswersSectionProps = {
  isLoading: boolean
  data: FormSubmissionResult | null | undefined
}

function asQuestions(
  value: FormQuestionsJson | FormQuestion[] | null | unknown,
): FormQuestion[] {
  return Array.isArray(value) ? (value as FormQuestion[]) : []
}

function questionLabel(
  submissionKey: string,
  questions: FormQuestion[],
  customQuestionText: Record<string, string> | null | undefined,
): string {
  const question = questions.find((q) => {
    const baseId = q.baseId || q.id.split('_')[0]
    return baseId === submissionKey || q.id === submissionKey
  })

  if (question) {
    if (question.isCustom && customQuestionText?.[question.id]) {
      return customQuestionText[question.id]
    }
    return question.label || submissionKey
  }

  if (customQuestionText?.[submissionKey]) {
    return customQuestionText[submissionKey]
  }

  return submissionKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
}

/**
 * Form Answers block on the Requirement Analysis tab (source parity —
 * only shown when `processing_source === 'form'`).
 */
export function FormAnswersSection({
  isLoading,
  data,
}: FormAnswersSectionProps) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      data-testid="form-answers-section"
    >
      <div className="mb-3 flex items-center text-foreground">
        <FileText className="mr-2 h-5 w-5 text-primary" />
        <h4 className="font-semibold">Form Answers</h4>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        {isLoading ? (
          <div>Loading form data...</div>
        ) : !data ? (
          <div>No form submission data found for this candidate</div>
        ) : (
          (() => {
            const jobFormConfig = data.jobFormConfig
            const templateQuestions = asQuestions(
              jobFormConfig.form_templates?.questions,
            )
            const configQuestions = asQuestions(jobFormConfig.questions)
            // Prefer the job-specific snapshot when present (including empty);
            // otherwise fall back to the company Form Template — same rule as
            // Applicant get-form, plus mandatory labels for submission keys.
            // Job-specific snapshot is authoritative when present (including
            // empty); fall back to the company Form Template only when the
            // snapshot was never set. Typed column is non-null FormQuestionsJson
            // after MergeDeep — empty array means an intentional empty snapshot.
            const questions = [
              ...MANDATORY_QUESTIONS,
              ...(configQuestions.length > 0
                ? configQuestions
                : templateQuestions
              ).filter(
                (q) =>
                  !MANDATORY_QUESTIONS.some(
                    (m) => (m.baseId || m.id) === (q.baseId || q.id),
                  ),
              ),
            ]

            const customQuestionText =
              jobFormConfig.custom_question_text as Record<string, string>
            const submissionData = data.formSubmission
              .submission_data as Record<string, unknown>

            if (questions.length === 0) {
              return (
                <div className="space-y-4">
                  {Object.entries(submissionData).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border bg-card p-3 shadow-sm"
                    >
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm font-semibold capitalize text-foreground">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="rounded bg-muted px-2 py-1 text-sm text-muted-foreground">
                          {String(value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }

            const submissionEntries = Object.entries(submissionData).filter(
              ([, value]) =>
                value !== undefined && value !== null && value !== '',
            )

            if (submissionEntries.length === 0) {
              return <div>No answered questions found in form submission</div>
            }

            return submissionEntries.map(([submissionKey, answer], index) => {
              const questionText = questionLabel(
                submissionKey,
                questions,
                customQuestionText,
              )

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-muted/60 p-3 text-foreground shadow-sm"
                  data-testid="form-answer-row"
                >
                  <div className="mb-2 font-medium">{questionText}</div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Answer:</span>{' '}
                    {String(answer)}
                  </div>
                </div>
              )
            })
          })()
        )}
      </div>
    </div>
  )
}
