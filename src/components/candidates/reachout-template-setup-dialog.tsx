import { useEffect, useState } from 'react'
import { z } from 'zod'
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
import { Textarea } from '#/components/ui/textarea'
import {
  DEFAULT_INTERVIEW_TEMPLATE,
  DEFAULT_PROFESSIONAL_TEMPLATE,
  INTERVIEW_TEMPLATE_VARIABLES,
  TEMPLATE_VARIABLES,
  validateTemplate,
} from '#/lib/reachout-template-shared'
import type {
  ReachoutTemplate,
  TemplateKind,
} from '#/lib/reachout-template-shared'

type ReachoutTemplateSetupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: TemplateKind
  template: ReachoutTemplate | null
  onSave: (
    kind: TemplateKind,
    template: Omit<ReachoutTemplate, 'created_at'>,
  ) => Promise<unknown>
  onSaved: () => void | Promise<void>
}

/**
 * Mid-flow Reachout Template creation when Shortlist finds no configured
 * template for the next stage (source `ReachoutTemplateModal`, restricted).
 */
export function ReachoutTemplateSetupDialog({
  open,
  onOpenChange,
  kind,
  template,
  onSave,
  onSaved,
}: ReachoutTemplateSetupDialogProps) {
  const [replyToEmail, setReplyToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const source =
      template ??
      (kind === 'interview'
        ? DEFAULT_INTERVIEW_TEMPLATE
        : DEFAULT_PROFESSIONAL_TEMPLATE)
    setReplyToEmail(source.reply_to_email || '')
    setSubject(source.subject)
    setBody(source.body)
    setError(null)
  }, [open, template, kind])

  const variables =
    kind === 'interview' ? INTERVIEW_TEMPLATE_VARIABLES : TEMPLATE_VARIABLES

  const handleSave = async () => {
    const replyToResult = z
      .email()
      .trim()
      .min(1, 'Reply-to email is required')
      .safeParse(replyToEmail)
    if (!replyToResult.success) {
      setError(
        replyToResult.error.issues[0]?.message === 'Invalid email'
          ? 'Reply-to email must be a valid email address'
          : (replyToResult.error.issues[0]?.message ??
              'Reply-to email must be a valid email address'),
      )
      return
    }

    const draft: ReachoutTemplate = {
      subject,
      body,
      reply_to_email: replyToResult.data,
      created_at: new Date().toISOString(),
    }
    const errors = validateTemplate(draft, kind)
    if (errors.length > 0) {
      setError(errors[0] ?? 'Invalid template')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(kind, {
        subject: draft.subject,
        body: draft.body,
        reply_to_email: draft.reply_to_email,
      })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        data-testid="shortlist-template-setup-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            Set Up{' '}
            {kind === 'interview' ? 'Interview Shortlist' : 'Final Reachout'}{' '}
            Template
          </DialogTitle>
          <DialogDescription>
            A Reachout Template is required before shortlisting. Save one to
            continue — you can edit the message on the next step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-reply-to">Reply-To Email</Label>
            <Input
              id="setup-reply-to"
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="your-email@company.com"
              data-testid="setup-reply-to"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-subject">Subject Line</Label>
            <Input
              id="setup-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="setup-subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-body">Message Body</Label>
            <Textarea
              id="setup-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px]"
              data-testid="setup-body"
            />
            <div className="flex flex-wrap gap-2">
              {variables.map((variable) => (
                <Button
                  key={variable.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setBody((prev) => `${prev}${variable.key}`)}
                >
                  {variable.key}
                </Button>
              ))}
            </div>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !subject.trim() || !body.trim()}
            data-testid="setup-template-save"
          >
            {isSaving ? 'Saving…' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
