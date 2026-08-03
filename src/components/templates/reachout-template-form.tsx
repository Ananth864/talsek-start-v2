import { z } from 'zod'
import { useAppForm } from '#/hooks/form'
import type { ReachoutTemplate, TemplateKind } from '#/lib/reachout-template-shared'
import {
  INTERVIEW_TEMPLATE_VARIABLES,
  TEMPLATE_VARIABLES,
  validateTemplate,
} from '#/lib/reachout-template-shared'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'

const formSchema = z.object({
  reply_to_email: z.email('Reply-to email must be a valid email address'),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject line is required')
    .max(200, 'Subject line should be under 200 characters'),
  body: z
    .string()
    .trim()
    .min(1, 'Message body is required')
    .max(2000, 'Message body should be under 2000 characters'),
})

type ReachoutTemplateFormProps = {
  kind: TemplateKind
  template: ReachoutTemplate
  disabled?: boolean
  onSave: (template: Omit<ReachoutTemplate, 'created_at'>) => Promise<void>
  onResetLocal: () => void
}

export function ReachoutTemplateForm({
  kind,
  template,
  disabled = false,
  onSave,
  onResetLocal,
}: ReachoutTemplateFormProps) {
  const variables =
    kind === 'interview' ? INTERVIEW_TEMPLATE_VARIABLES : TEMPLATE_VARIABLES

  const form = useAppForm({
    defaultValues: {
      reply_to_email: template.reply_to_email,
      subject: template.subject,
      body: template.body,
    },
    validators: {
      onSubmit: ({ value }) => {
        const parsed = formSchema.safeParse(value)
        if (!parsed.success) {
          return parsed.error.issues[0]?.message ?? 'Invalid template'
        }
        const errors = validateTemplate(
          {
            ...parsed.data,
            created_at: template.created_at,
          },
          kind,
        )
        if (errors.length > 0) return errors[0]
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      await onSave({
        reply_to_email: value.reply_to_email.trim(),
        subject: value.subject,
        body: value.body,
      })
    },
  })

  const insertVariable = (variable: string) => {
    if (disabled) return
    const current = form.getFieldValue('body')
    form.setFieldValue('body', `${current}${variable}`)
  }

  return (
    <form
      data-testid={`reachout-template-form-${kind}`}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
        {(formError) =>
          formError ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
              data-testid={`template-form-error-${kind}`}
            >
              {typeof formError === 'string'
                ? formError
                : 'Please fix the template errors.'}
            </p>
          ) : null
        }
      </form.Subscribe>

      <form.AppField name="reply_to_email">
        {(field) => (
          <field.TextField
            label="Reply-To Email"
            type="email"
            placeholder="your-email@company.com"
            disabled={disabled}
            description="Replies will be sent to this address."
          />
        )}
      </form.AppField>

      <form.AppField name="subject">
        {(field) => (
          <field.TextField
            label="Subject Line"
            placeholder="Enter email subject…"
            disabled={disabled}
            maxLength={200}
            description={`${field.state.value.length}/200 characters`}
          />
        )}
      </form.AppField>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <form.AppField name="body">
            {(field) => (
              <field.TextareaField
                id={`reachout-${kind}-body`}
                label="Message Body"
                placeholder="Enter your template…"
                disabled={disabled}
                maxLength={2000}
                rows={14}
                description={`${field.state.value.length}/2000 characters`}
              />
            )}
          </form.AppField>
        </div>
        <div className="space-y-2">
          <Label>Insert variable</Label>
          <div className="flex flex-col gap-1.5">
            {variables.map((variable) => (
              <Button
                key={variable.key}
                type="button"
                variant="outline"
                size="sm"
                className="justify-start font-mono text-xs"
                disabled={disabled}
                onClick={() => insertVariable(variable.key)}
                title={variable.description}
              >
                {variable.key}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onResetLocal}
          data-testid={`reset-template-${kind}`}
        >
          Reset to default
        </Button>
        <form.AppForm>
          <form.SubmitButton
            idleLabel="Save template"
            label="Saving…"
            disabled={disabled}
            data-testid={`save-template-${kind}`}
          />
        </form.AppForm>
      </div>
    </form>
  )
}
