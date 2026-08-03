import { Eye, EyeOff } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type'
> & {
  visible: boolean
  onToggleVisible: () => void
  toggleTestId?: string
}

/** Password input with source-equivalent visibility toggle. */
export function PasswordInput({
  visible,
  onToggleVisible,
  toggleTestId = 'password-visibility-toggle',
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        data-testid={toggleTestId}
        // Avoid aria-label containing "password" — Playwright getByLabel('Password')
        // would otherwise match this control (strict-mode collision with the input).
        aria-label={visible ? 'Hide' : 'Show'}
        title={visible ? 'Hide password' : 'Show password'}
        onClick={onToggleVisible}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded focus-visible:ring-2 focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  )
}
