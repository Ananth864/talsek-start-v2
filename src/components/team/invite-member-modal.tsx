import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Loader2, Mail, ShieldQuestion } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { Button } from '#/components/ui/button'
import { Switch } from '#/components/ui/switch'
import {
  MEMBER_PERMISSIONS_DEFAULT,
  MEMBER_PERMISSIONS_META,
  memberPermissionsWithDefaultsSchema,
} from '#/lib/permissions-shared'
import type {
  MemberPermissionKey,
  MemberPermissions,
} from '#/lib/permissions-shared'

export type InviteMemberValues = {
  email: string
  firstName: string
  lastName: string
  role: 'member' | 'admin'
  message?: string
  permissions: MemberPermissions
}

const inviteMemberSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['member', 'admin']),
  message: z
    .string()
    .max(1000, 'Message must be 1000 characters or fewer')
    .optional()
    .transform((value) => (value?.trim() ? value : undefined)),
  permissions: memberPermissionsWithDefaultsSchema,
})

type InviteMemberModalProps = {
  open: boolean
  onClose: () => void
  onInvite: (values: InviteMemberValues) => Promise<void>
}

type FormErrors = Partial<Record<keyof InviteMemberValues, string>>

const roleOptions: Array<{
  value: InviteMemberValues['role']
  label: string
}> = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
]

const createAdminPermissions = (): MemberPermissions =>
  MEMBER_PERMISSIONS_META.reduce<MemberPermissions>(
    (acc, { key }) => ({
      ...acc,
      [key]: true,
    }),
    {} as MemberPermissions,
  )

const createEmptyForm = (): InviteMemberValues => ({
  email: '',
  firstName: '',
  lastName: '',
  role: 'member',
  message: undefined,
  permissions: { ...MEMBER_PERMISSIONS_DEFAULT },
})

export function InviteMemberModal({
  open,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const [values, setValues] = useState<InviteMemberValues>(() =>
    createEmptyForm(),
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(createEmptyForm())
      setErrors({})
      setFormError(null)
    }
  }, [open])

  const parsedResult = useMemo(
    () => inviteMemberSchema.safeParse(values),
    [values],
  )
  const hasValidationErrors = !parsedResult.success

  const handleChange = <TKey extends keyof InviteMemberValues>(
    key: TKey,
    value: InviteMemberValues[TKey],
  ) => {
    setValues((previous) => {
      let next: InviteMemberValues = {
        ...previous,
        [key]: value,
      }

      if (key === 'role') {
        const roleValue = value as InviteMemberValues['role']
        next = {
          ...next,
          permissions:
            roleValue === 'admin'
              ? createAdminPermissions()
              : { ...MEMBER_PERMISSIONS_DEFAULT },
        }
      }

      return next
    })
    setErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }))
  }

  const handlePermissionToggle = (
    key: MemberPermissionKey,
    checked: boolean,
  ) => {
    setValues((previous) => ({
      ...previous,
      permissions: {
        ...previous.permissions,
        [key]: checked,
      },
    }))
  }

  const handleSubmit = async () => {
    setFormError(null)

    const result = inviteMemberSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors = result.error.flatten((issue) => issue.message)
        .fieldErrors
      const formattedErrors: FormErrors = {}
      ;(Object.keys(fieldErrors) as Array<keyof InviteMemberValues>).forEach(
        (field) => {
          const messages = fieldErrors[field]
          if (messages && messages.length > 0) {
            formattedErrors[field] = messages[0] ?? 'Invalid value'
          }
        },
      )
      setErrors(formattedErrors)
      return
    }

    try {
      setSubmitting(true)
      await onInvite(result.data)
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to invite member'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) =>
        !submitting ? (isOpen ? undefined : onClose()) : undefined
      }
    >
      <DialogContent className="sm:max-w-lg" data-testid="invite-member-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invite a team member
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          {formError ? (
            <div
              className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-testid="invite-form-error"
            >
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">First name</Label>
              <Input
                id="invite-first-name"
                data-testid="invite-first-name"
                value={values.firstName}
                onChange={(event) =>
                  handleChange('firstName', event.target.value)
                }
                autoComplete="off"
                disabled={submitting}
                placeholder="Jane"
              />
              {errors.firstName ? (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">Last name</Label>
              <Input
                id="invite-last-name"
                data-testid="invite-last-name"
                value={values.lastName}
                onChange={(event) =>
                  handleChange('lastName', event.target.value)
                }
                autoComplete="off"
                disabled={submitting}
                placeholder="Doe"
              />
              {errors.lastName ? (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Work email</Label>
            <Input
              id="invite-email"
              data-testid="invite-email"
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              autoComplete="off"
              disabled={submitting}
              placeholder="name@company.com"
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={values.role}
              onValueChange={(value: InviteMemberValues['role']) =>
                handleChange('role', value)
              }
              disabled={submitting}
            >
              <SelectTrigger data-testid="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Permissions</Label>
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              {MEMBER_PERMISSIONS_META.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    id={`invite-permission-${key}`}
                    data-testid={`invite-permission-${key}`}
                    checked={values.permissions[key]}
                    onCheckedChange={(checked) =>
                      handlePermissionToggle(key, checked)
                    }
                    disabled={submitting}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-message"
              className="flex items-center gap-1 text-sm"
            >
              <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
              Personalised message (optional)
            </Label>
            <Textarea
              id="invite-message"
              data-testid="invite-message"
              value={values.message ?? ''}
              onChange={(event) => handleChange('message', event.target.value)}
              autoComplete="off"
              disabled={submitting}
              placeholder="Add a short welcome message (will appear in the invite email)"
              rows={3}
            />
            {errors.message ? (
              <p className="text-xs text-destructive">{errors.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || hasValidationErrors}
              data-testid="invite-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending invite...
                </>
              ) : (
                'Send invite'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
