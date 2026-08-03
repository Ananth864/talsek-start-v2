import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Building, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  COMPANY_SIZE_OPTIONS,
  companySetupSchema,
} from '#/lib/company-shared'
import { cn } from '#/lib/utils'

type CompanyCollectionModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (companyName: string, companySize: string) => Promise<void>
  userEmail?: string | null
  userName?: string | null
}

export function CompanyCollectionModal({
  open,
  onClose,
  onSubmit,
  userEmail,
  userName,
}: CompanyCollectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      companyName: '',
      companySize: '',
    },
    validators: {
      onChange: companySetupSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setError(null)
      try {
        await onSubmit(value.companyName, value.companySize)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to save company information. Please try again.',
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onClose()
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        data-testid="company-collection-dialog"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="size-5 text-primary" />
            Complete Your Setup
          </DialogTitle>
          <DialogDescription>
            {userName ? `Welcome ${userName}! ` : ''}
            Please tell us about your company to finish setting up your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {userEmail ? (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span>{' '}
                {userEmail}
              </p>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field name="companyName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                    autoComplete="organization"
                    autoFocus
                    className={cn(
                      field.state.meta.errors.length > 0 &&
                        'border-destructive focus-visible:border-destructive',
                    )}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0]?.message ??
                          'Invalid input')}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name="companySize">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company size</Label>
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="companySize"
                      className={cn(
                        'w-full',
                        field.state.meta.errors.length > 0 &&
                          'border-destructive focus-visible:border-destructive',
                      )}
                    >
                      <SelectValue placeholder="Select your company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0]?.message ??
                          'Invalid input')}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Sign Out
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit]) => (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || !canSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue to Dashboard'
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
