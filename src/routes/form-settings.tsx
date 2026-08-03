import { useEffect, useMemo, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
} from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react'
import { getAuthState } from '#/server/fn/auth'
import { fetchMemberProfile } from '#/server/fn/jobs'
import {
  useFormTemplate,
  useUpdateFormTemplate,
} from '#/hooks/use-form-template'
import { FormQuestionBuilder } from '#/components/forms/form-question-builder'
import { FormPreview } from '#/components/forms/form-preview'
import { useAppForm } from '#/hooks/form'
import {
  mergeMandatoryWithAdditional
  
} from '#/lib/form-questions-shared'
import type {FormQuestionInput} from '#/lib/form-questions-shared';
import type { FormQuestion } from '#/integrations/supabase/types'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/form-settings')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (!user) {
      throw redirect({
        to: '/signin',
        search: { redirect: '/form-settings' },
      })
    }
    const profile = await fetchMemberProfile()
    return {
      companyId: profile?.company_id ?? null,
      canManageForms: Boolean(profile?.permissions.canManageForms),
    }
  },
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
          message: 'You do not have permission to customize the application form.',
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

  return (
    <form
      className="mx-auto flex min-h-svh max-w-5xl flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
              Jobs
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Customize Form
          </h1>
          <p className="text-sm text-muted-foreground">
            Set the company default application questions. Jobs can snapshot
            these into their own Form Config.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/reachout-templates"
              data-testid="reachout-templates-nav"
            >
              Templates
            </Link>
          </Button>
          <form.AppForm>
            <form.SubmitButton
              idleLabel="Save form"
              label="Saving…"
              disabled={!canEdit || isLoading}
              data-testid="form-settings-save"
              className="gap-2"
            />
          </form.AppForm>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4">
          {!canEdit ? (
            <div
              className="mb-4 flex items-start gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              data-testid="forms-permission-alert"
            >
              <Lock className="mt-0.5 size-4 shrink-0" />
              You don&apos;t have permission to customize forms. Contact an admin
              to request access.
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

          {isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading form template…
            </div>
          ) : error ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error instanceof Error ? error.message : 'Failed to load'}
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <FormQuestionBuilder
                selectedQuestions={selectedQuestions}
                onQuestionsChange={setSelectedQuestions}
                disabled={!canEdit}
              />
              <FormPreview questions={allQuestions} />
            </div>
          )}
        </main>
      </div>
    </form>
  )
}
