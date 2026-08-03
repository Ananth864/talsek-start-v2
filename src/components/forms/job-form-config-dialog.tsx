import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { FormQuestion } from '#/integrations/supabase/types'
import { useAppForm } from '#/hooks/form'
import {
  useJobFormConfig,
  useUpsertJobFormConfig,
} from '#/hooks/use-job-form-config'
import { FormQuestionBuilder } from '#/components/forms/form-question-builder'
import { FormPreview } from '#/components/forms/form-preview'
import { mergeMandatoryWithAdditional, countWords  } from '#/lib/form-questions-shared'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

type JobFormConfigDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string | null
  jobId: string
  jobTitle: string
}

export function JobFormConfigDialog({
  open,
  onOpenChange,
  companyId,
  jobId,
  jobTitle,
}: JobFormConfigDialogProps) {
  const { data, isLoading, error } = useJobFormConfig(
    open ? companyId : null,
    open ? jobId : null,
  )
  const upsert = useUpsertJobFormConfig(companyId)
  const [selectedQuestions, setSelectedQuestions] = useState<FormQuestion[]>([])
  const [customQuestionText, setCustomQuestionText] = useState<
    Record<string, string>
  >({})
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    const questions = data.config
      ? data.config.questions
      : data.templateAdditionalQuestions
    setSelectedQuestions(questions)
    // Prefill custom labels from overrides, falling back to the question label
    // so existing template custom questions save without a blank-label error.
    const labels: Record<string, string> = {}
    for (const q of questions) {
      if (!q.isCustom) continue
      labels[q.id] =
        (data.config?.custom_question_text[q.id] || q.label || '').trim()
    }
    setCustomQuestionText(labels)
  }, [data])

  const canManageForms = Boolean(data?.canManageForms)
  const previewQuestions = useMemo(
    () => mergeMandatoryWithAdditional(selectedQuestions),
    [selectedQuestions],
  )

  const form = useAppForm({
    defaultValues: {
      isEnabled: data?.config?.is_enabled ?? true,
    },
    onSubmit: async ({ value }) => {
      setBanner(null)
      try {
        for (const q of selectedQuestions) {
          if (q.isCustom) {
            const label = (customQuestionText[q.id] ?? '').trim()
            if (!label) {
              setBanner('Every custom question needs a label.')
              return
            }
            if (countWords(label) > 20) {
              setBanner('Custom question labels must be 20 words or fewer.')
              return
            }
          }
        }
        const result = await upsert({
          jobId,
          isEnabled: value.isEnabled,
          questions: selectedQuestions,
          customQuestionText,
        })
        setBanner(
          result.created
            ? 'Application form created.'
            : 'Application form saved.',
        )
      } catch (err) {
        setBanner(err instanceof Error ? err.message : 'Failed to save form.')
      }
    },
  })

  useEffect(() => {
    form.reset({ isEnabled: data?.config?.is_enabled ?? true })
  }, [data?.config?.is_enabled, data?.config?.id])

  const applyUrl = data?.config?.form_url_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${data.config.form_url_token}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        data-testid="job-form-config-dialog"
      >
        <DialogHeader>
          <DialogTitle>Configure form — {jobTitle}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading form config…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load'}
          </p>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
          >
            {!canManageForms ? (
              <p
                className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                data-testid="forms-permission-alert"
              >
                You don&apos;t have permission to customize forms. Contact an
                admin to request access.
              </p>
            ) : null}

            {banner ? (
              <p
                className="rounded-md border px-3 py-2 text-sm"
                data-testid="job-form-banner"
              >
                {banner}
              </p>
            ) : null}

            <form.AppField name="isEnabled">
              {(field) => (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <Label htmlFor="form-enabled">Form enabled</Label>
                    <p className="text-xs text-muted-foreground">
                      Applicants can open the apply link when enabled.
                    </p>
                  </div>
                  <Switch
                    id="form-enabled"
                    checked={field.state.value}
                    disabled={!canManageForms}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    data-testid="job-form-enabled"
                  />
                </div>
              )}
            </form.AppField>

            {applyUrl ? (
              <div className="space-y-1">
                <Label>Apply link</Label>
                <Input readOnly value={applyUrl} data-testid="job-form-apply-url" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save to generate a public apply link for this job.
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <FormQuestionBuilder
                  selectedQuestions={selectedQuestions}
                  onQuestionsChange={setSelectedQuestions}
                  disabled={!canManageForms}
                />
                {selectedQuestions
                  .filter((q) => q.isCustom)
                  .map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label htmlFor={`custom-label-${q.id}`}>
                        Label for {q.label}
                      </Label>
                      <Input
                        id={`custom-label-${q.id}`}
                        value={customQuestionText[q.id] ?? ''}
                        disabled={!canManageForms}
                        maxLength={200}
                        placeholder="Ask the candidate…"
                        onChange={(e) =>
                          setCustomQuestionText((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        data-testid={`custom-label-${q.id}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {countWords(customQuestionText[q.id] ?? '')}/20 words
                      </p>
                    </div>
                  ))}
              </div>
              <FormPreview
                questions={previewQuestions}
                customQuestionText={customQuestionText}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <form.AppForm>
                <form.SubmitButton
                  idleLabel={data?.config ? 'Save form' : 'Create form'}
                  label="Saving…"
                  disabled={!canManageForms}
                  data-testid="job-form-save"
                />
              </form.AppForm>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
