import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

/**
 * App-wide TanStack Form entry point (spec: populate useAppForm field kit).
 * Domain forms (#16 Reachout Templates / Form Config) use this instead of
 * ad-hoc controlled inputs.
 */
const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

function FieldErrors() {
  const field = useFieldContext()
  const errors = field.state.meta.errors
  if (!errors.length) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      {errors.map((error) =>
        typeof error === 'string' ? error : (error?.message ?? String(error)),
      ).join(', ')}
    </p>
  )
}

function TextField({
  label,
  placeholder,
  type = 'text',
  disabled,
  id,
  description,
  maxLength,
  className,
}: {
  label: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  disabled?: boolean
  id?: string
  description?: string
  maxLength?: number
  className?: string
}) {
  const field = useFieldContext<string>()
  const inputId = id ?? field.name
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        data-testid={`field-${field.name}`}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldErrors />
    </div>
  )
}

function TextareaField({
  label,
  placeholder,
  disabled,
  id,
  description,
  maxLength,
  rows = 8,
  className,
}: {
  label: string
  placeholder?: string
  disabled?: boolean
  id?: string
  description?: string
  maxLength?: number
  rows?: number
  className?: string
}) {
  const field = useFieldContext<string>()
  const inputId = id ?? field.name
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        className="min-h-[200px] resize-y"
        data-testid={`field-${field.name}`}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldErrors />
    </div>
  )
}

function SubmitButton({
  label,
  idleLabel,
  disabled,
  className,
  'data-testid': testId,
}: {
  label?: string
  idleLabel?: string
  disabled?: boolean
  className?: string
  'data-testid'?: string
}) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className={className}
          data-testid={testId}
        >
          {isSubmitting ? (label ?? 'Saving…') : (idleLabel ?? label ?? 'Save')}
        </Button>
      )}
    </form.Subscribe>
  )
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
  },
  formComponents: {
    SubmitButton,
  },
})

export { useFieldContext, useFormContext }
