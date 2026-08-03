import { useState } from 'react'
import type { FormQuestion } from '#/integrations/supabase/types'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

type FormPreviewProps = {
  questions: FormQuestion[]
  customQuestionText?: Record<string, string>
}

export function FormPreview({
  questions,
  customQuestionText = {},
}: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  return (
    <div className="space-y-4" data-testid="form-preview">
      {questions.map((question) => {
        const label =
          question.isCustom && customQuestionText[question.id]
            ? customQuestionText[question.id]
            : question.label
        const fieldId = `preview-${question.id}`

        return (
          <div key={question.id} className="space-y-1.5">
            <Label htmlFor={fieldId}>
              {label}
              {question.required ? (
                <span className="text-destructive"> *</span>
              ) : null}
            </Label>
            {question.type === 'select' ? (
              <Select
                value={values[question.id] ?? ''}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, [question.id]: value }))
                }
              >
                <SelectTrigger id={fieldId}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {(question.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : question.type === 'file' ? (
              <Input id={fieldId} type="file" disabled />
            ) : question.isCustom || question.type === 'text' ? (
              question.isCustom ? (
                <Textarea
                  id={fieldId}
                  placeholder={question.placeholder}
                  value={values[question.id] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [question.id]: e.target.value,
                    }))
                  }
                  rows={4}
                />
              ) : (
                <Input
                  id={fieldId}
                  type={question.type === 'email' ? 'email' : 'text'}
                  placeholder={question.placeholder}
                  value={values[question.id] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [question.id]: e.target.value,
                    }))
                  }
                />
              )
            ) : (
              <Input
                id={fieldId}
                type={
                  question.type === 'number'
                    ? 'number'
                    : question.type === 'url'
                      ? 'url'
                      : 'text'
                }
                placeholder={question.placeholder}
                value={values[question.id] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [question.id]: e.target.value,
                  }))
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
