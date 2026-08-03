import { Plus, X } from 'lucide-react'
import type { FormQuestion } from '#/integrations/supabase/types'
import { AVAILABLE_ADDITIONAL_QUESTIONS } from '#/lib/form-questions-shared'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Label } from '#/components/ui/label'

type FormQuestionBuilderProps = {
  selectedQuestions: FormQuestion[]
  onQuestionsChange: (questions: FormQuestion[]) => void
  disabled?: boolean
}

export function FormQuestionBuilder({
  selectedQuestions,
  onQuestionsChange,
  disabled = false,
}: FormQuestionBuilderProps) {
  const addQuestion = (questionTemplate: FormQuestion) => {
    if (disabled) return
    if (questionTemplate.isCustom) {
      const customQuestionCount = selectedQuestions.filter((q) => q.isCustom).length
      const newQuestion: FormQuestion = {
        id: `customQuestion_${Date.now()}`,
        baseId: 'customQuestion',
        type: 'text',
        label: `Custom Question ${customQuestionCount + 1}`,
        placeholder: questionTemplate.placeholder,
        required: true,
        isMandatory: false,
        isCustom: true,
      }
      onQuestionsChange([...selectedQuestions, newQuestion])
      return
    }

    onQuestionsChange([
      ...selectedQuestions,
      {
        ...questionTemplate,
        id: `${questionTemplate.id}_${Date.now()}`,
        baseId: questionTemplate.baseId,
      },
    ])
  }

  const removeQuestion = (questionId: string) => {
    if (disabled) return
    onQuestionsChange(selectedQuestions.filter((q) => q.id !== questionId))
  }

  const available = AVAILABLE_ADDITIONAL_QUESTIONS.filter((availableQ) => {
    if (availableQ.isCustom) return true
    return !selectedQuestions.some((selected) =>
      selected.baseId.startsWith(availableQ.baseId),
    )
  })

  return (
    <div className="space-y-6" data-testid="form-question-builder">
      <div>
        <Label className="mb-3 block text-sm font-semibold">
          Questions selected
        </Label>
        {selectedQuestions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            No additional questions added
          </div>
        ) : (
          <div className="space-y-2">
            {selectedQuestions.map((question) => (
              <Card key={question.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{question.label}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary">{question.type}</Badge>
                      {question.isCustom ? (
                        <Badge variant="outline">Custom</Badge>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => removeQuestion(question.id)}
                    aria-label={`Remove ${question.label}`}
                    data-testid={`remove-question-${question.baseId}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="mb-3 block text-sm font-semibold">
          Available questions
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {available.map((question) => (
            <Card key={question.id}>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{question.label}</p>
                  <p className="text-xs text-muted-foreground">{question.type}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => addQuestion(question)}
                  data-testid={`add-question-${question.baseId}`}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
