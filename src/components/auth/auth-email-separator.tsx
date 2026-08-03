import { Separator } from '#/components/ui/separator'

/** Divider between OAuth and email/password forms (source copy). */
export function AuthEmailSeparator() {
  return (
    <div data-testid="auth-email-separator" className="relative">
      <Separator />
      <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
        or continue with email
      </span>
    </div>
  )
}
