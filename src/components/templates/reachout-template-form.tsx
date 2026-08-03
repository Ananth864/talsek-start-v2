import { z } from 'zod'
import { Copy } from 'lucide-react'
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
}

export function ReachoutTemplateForm({
  kind,
  template,
  disabled = false,
  onSave,
}: ReachoutTemplateFormProps) {
  const variables =
    kind === 'interview' ? INTERVIEW_TEMPLATE_VARIABLES : TEMPLATE_VARIABLES
  const bodyFieldId = `reachout-${kind}-body`
  const formId = `reachout-${kind}-form`

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
    const textarea = document.getElementById(
      bodyFieldId,
    ) as HTMLTextAreaElement | null
    const current = form.getFieldValue('body')
    if (!textarea) {
      form.setFieldValue('body', `${current}${variable}`)
      return
    }
    const { selectionStart, selectionEnd } = textarea
    const next =
      current.slice(0, selectionStart) +
      variable +
      current.slice(selectionEnd)
    form.setFieldValue('body', next)
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = selectionStart + variable.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  return (
    <form
      id={formId}
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
            description="Replies will be sent to this email address. Leave empty to use your account email."
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

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <form.AppField name="body">
            {(field) => (
              <field.TextareaField
                id={bodyFieldId}
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
        <div className="lg:col-span-1">
          <Label className="text-sm font-medium">Available Variables</Label>
          <div className="mt-2 grid gap-2">
            {variables.map((variable) => (
              <Button
                key={variable.key}
                type="button"
                variant="outline"
                size="sm"
                className="justify-start text-xs disabled:cursor-not-allowed disabled:text-muted-foreground"
                disabled={disabled}
                onClick={() => insertVariable(variable.key)}
                title={variable.description}
              >
                <Copy className="mr-2 h-3 w-3" />
                {variable.key}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Click a variable to insert it at your cursor position.
          </p>
        </div>
      </div>
    </form>
  )
}
