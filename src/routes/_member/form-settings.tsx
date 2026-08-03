import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Loader2, Lock, Save } from 'lucide-react'
import {
  useFormTemplate,
  useUpdateFormTemplate,
} from '#/hooks/use-form-template'
import { FormQuestionBuilder } from '#/components/forms/form-question-builder'
import { FormPreview } from '#/components/forms/form-preview'
import { useAppForm } from '#/hooks/form'
import { mergeMandatoryWithAdditional } from '#/lib/form-questions-shared'
import type { FormQuestionInput } from '#/lib/form-questions-shared'
import type { FormQuestion } from '#/integrations/supabase/types'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/_member/form-settings')({
  component: FormSettingsPage,
})

function FormSettingsPage() {
  const { companyId, canManageForms } = Route.useRouteContext()
  const { data, isLoading, error } = useFormTemplate(companyId)
  const updateTemplate = useUpdateFormTemplate(companyId)
  const [selectedQuestions, setSelectedQuestions] = useState<FormQuestion[]>([])
  const [banner, setBanner] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (data) {
      setSelectedQuestions(data.additionalQuestions)
    }
  }, [data?.template.id, data?.additionalQuestions])

  const canEdit = canManageForms || Boolean(data?.canManageForms)
  const isBusy = !canEdit || isLoading
  const allQuestions = useMemo(
    () => mergeMandatoryWithAdditional(selectedQuestions),
    [selectedQuestions],
  )

  const form = useAppForm({
    defaultValues: {
      // Submit-only shell; question selection is companion UI state.
      ready: true,
    },
    onSubmit: async () => {
      if (!canEdit) {
        setBanner({
          kind: 'error',
          message:
            'You do not have permission to customize the application form.',
        })
        return
      }
      setBanner(null)
      try {
        const questions = allQuestions.map((question) => {
          if (question.type === 'select') {
            return {
              ...question,
              placeholder: question.placeholder ?? '',
              options: question.options ?? [],
            }
          }
          const { options: _options, ...rest } = question
          return {
            ...rest,
            placeholder: question.placeholder ?? '',
          }
        }) as FormQuestionInput[]
        await updateTemplate(questions)
        setBanner({
          kind: 'success',
          message: 'Your application form has been successfully customized.',
        })
      } catch (err) {
        setBanner({
          kind: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'There was an error saving your form template.',
        })
      }
    },
  })

  const handleCancel = () => {
    if (!canEdit) {
      setBanner({
        kind: 'error',
        message:
          'You do not have permission to customize the application form.',
      })
      return
    }
    if (data) {
      setSelectedQuestions(data.additionalQuestions)
      setBanner(null)
    }
  }

  return (
    <form
      className="flex min-h-0 w-full flex-1 flex-col"
      data-testid="form-settings-page"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <header className="border-b bg-card">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">
              Customize Application Form
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure the questions candidates see when applying to your jobs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isBusy}
              data-testid="form-settings-cancel"
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isBusy || isSubmitting}
                  className="gap-2"
                  data-testid="form-settings-save"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Form Template
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 px-6 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading form template…
        </div>
      ) : error ? (
        <p className="flex items-center gap-2 px-6 py-8 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error instanceof Error ? error.message : 'Failed to load'}
        </p>
      ) : (
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div
            className="h-full w-full overflow-y-auto border-r border-border bg-card lg:w-1/2"
            data-testid="form-settings-questions-pane"
          >
            <div className="border-b border-border p-6">
              <h2 className="text-left text-lg font-semibold">Questions</h2>
            </div>
            <div className="p-6">
              {!canEdit ? (
                <div
                  className="mb-4 flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  data-testid="forms-permission-alert"
                >
                  <Lock className="mt-0.5 size-4 shrink-0" />
                  You can review the current form but do not have permission to
                  make changes.
                </div>
              ) : null}

              {banner ? (
                <p
                  className={
                    banner.kind === 'error'
                      ? 'mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                      : 'mb-4 rounded-md border px-3 py-2 text-sm'
                  }
                  data-testid="form-settings-banner"
                >
                  {banner.message}
                </p>
              ) : null}

              <FormQuestionBuilder
                selectedQuestions={selectedQuestions}
                onQuestionsChange={setSelectedQuestions}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div
            className="hidden h-full w-full overflow-y-auto bg-card lg:block lg:w-1/2"
            data-testid="form-settings-preview-pane"
          >
            <div className="border-b border-border p-6">
              <h2 className="text-left text-lg font-semibold">Live Preview</h2>
            </div>
            <div className="p-6">
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <FormPreview questions={allQuestions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
