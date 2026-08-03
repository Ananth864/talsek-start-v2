import { useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  Link as LinkIcon,
  Mail,
  Settings2,
  Zap,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

type JobCreationSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  forwardingEmail: string
  /** Present once a Form Config exists for the Job (after the opt-in shortcut). */
  formLink?: string | null
  /** Opens the existing Job Form Config dialog for this newly created Job. */
  onConfigureForm?: () => void
  canManageForms?: boolean
}

/**
 * Post-create success surface (source `JobCreationSuccessDialog` behaviour,
 * design-system layout). Offers copyable forwarding email, optional apply-form
 * link, next-step guidance, and an opt-in shortcut into Job Form Config (#28 /
 * stories 30–31) — form setup is no longer a forced wizard step.
 */
export function JobCreationSuccessDialog({
  open,
  onOpenChange,
  forwardingEmail,
  formLink,
  onConfigureForm,
  canManageForms = false,
}: JobCreationSuccessDialogProps) {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedForm, setCopiedForm] = useState(false)

  const copy = async (value: string, target: 'email' | 'form') => {
    try {
      await navigator.clipboard.writeText(value)
      if (target === 'email') {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } else {
        setCopiedForm(true)
        setTimeout(() => setCopiedForm(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="job-creation-success-dialog"
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Check className="size-4" />
            </span>
            Job created successfully
          </DialogTitle>
          <DialogDescription>
            Share the forwarding email to start collecting applications. Configure
            an application form when you are ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="success-forwarding-email">Forwarding email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="success-forwarding-email"
                data-testid="success-forwarding-email"
                value={forwardingEmail}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-testid="copy-success-forwarding-email"
                title="Copy forwarding email"
                aria-label="Copy forwarding email"
                onClick={() => void copy(forwardingEmail, 'email')}
              >
                {copiedEmail ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            {copiedEmail ? (
              <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                <Check className="size-3.5" />
                Email copied to clipboard
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Add this address to job boards, outreach, and referral programs —
              inbound resumes are parsed and scored automatically.
            </p>
          </div>

          {formLink ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="success-form-link">Application form link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="success-form-link"
                  data-testid="success-form-link"
                  value={formLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid="copy-success-form-link"
                  title="Copy apply form link"
                  aria-label="Copy apply form link"
                  onClick={() => void copy(formLink, 'form')}
                >
                  {copiedForm ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              {copiedForm ? (
                <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <Check className="size-3.5" />
                  Form link copied to clipboard
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Use this link for Apply CTAs, embeds, and social sharing.
              </p>
            </div>
          ) : (
            <div
              data-testid="success-form-setup-hint"
              className="rounded-md border border-dashed p-3 text-sm"
            >
              <div className="mb-1 flex items-center gap-2 font-medium">
                <FileText className="size-4 text-muted-foreground" />
                Application form
              </div>
              <p className="text-muted-foreground">
                No form yet. Configure questions to generate a shareable apply
                link for this Job.
              </p>
            </div>
          )}

          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              Post the forwarding email on LinkedIn and job boards.
            </li>
            <li className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              Share the apply link once the form is configured.
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
              Every application is parsed, matched, scored, and added to the
              pipeline automatically.
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {onConfigureForm && canManageForms ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              data-testid="success-configure-form"
              onClick={onConfigureForm}
            >
              <Settings2 className="size-4" />
              {formLink ? 'Edit application form' : 'Configure application form'}
            </Button>
          ) : null}
          <Button
            type="button"
            className="w-full"
            data-testid="success-dialog-done"
            onClick={() => onOpenChange(false)}
          >
            Start receiving applications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
