import { useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  Globe,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  MousePointer,
  Settings2,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'

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
 * Post-create success surface — source interaction shape (#37) with ported
 * paint. Forwarding email + optional form link copy, how-to-use guidance, and
 * primary done CTA. Form Config remains opt-in (ADR-0029), not a forced step.
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
        className="max-h-[90vh] w-[85vw] max-w-5xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="mb-2 flex items-center justify-center gap-3 text-xl font-semibold text-emerald-600 dark:text-emerald-300">
            <span className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <Check className="size-5" />
            </span>
            <span>Job Posting Created Successfully!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-l-4 border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center space-x-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    Your Unique Forwarding Email
                  </h4>
                  <p className="text-sm text-primary">
                    Direct email collection for applications
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  id="success-forwarding-email"
                  data-testid="success-forwarding-email"
                  value={forwardingEmail}
                  readOnly
                  className="border font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={() => void copy(forwardingEmail, 'email')}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  data-testid="copy-success-forwarding-email"
                  title="Copy forwarding email"
                  aria-label="Copy forwarding email"
                >
                  {copiedEmail ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>

              {copiedEmail ? (
                <p className="mt-2 flex items-center space-x-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <Check className="size-4" />
                  <span>Email copied to clipboard!</span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          {formLink ? (
            <Card className="border-l-4 border-accent bg-accent/10">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="rounded-full bg-accent/20 p-2 text-accent-foreground">
                    <LinkIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Application Form Link
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Smart form with pre-screening capabilities
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    id="success-form-link"
                    data-testid="success-form-link"
                    value={formLink}
                    readOnly
                    className="border font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => void copy(formLink, 'form')}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    data-testid="copy-success-form-link"
                    title="Copy apply form link"
                    aria-label="Copy apply form link"
                  >
                    {copiedForm ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>

                {copiedForm ? (
                  <p className="mt-2 flex items-center space-x-1 text-sm text-emerald-700 dark:text-emerald-300">
                    <Check className="size-4" />
                    <span>Form link copied to clipboard!</span>
                  </p>
                ) : null}
              </CardContent>
            </Card>
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

          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-xl font-bold text-foreground">
                How to Use Your Application Methods
              </h3>
              <p className="text-sm text-muted-foreground">
                Professional ways to collect applications from candidates
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden border-l-4 border-primary bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Mail className="size-5" />
                    Email Applications
                  </CardTitle>
                  <CardDescription>
                    Direct email collection with automatic processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <Globe className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Job Postings
                        </p>
                        <p className="text-muted-foreground">
                          Add to LinkedIn, job boards, company website
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Direct Outreach
                        </p>
                        <p className="text-muted-foreground">
                          Share in messages, social posts, networking
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          Referral Programs
                        </p>
                        <p className="text-muted-foreground">
                          Easy sharing for employee referrals
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="mr-1 size-3" />
                      Auto-parsing
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      AI-scoring
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {formLink ? (
                <Card className="overflow-hidden border-l-4 border-accent bg-accent/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-accent-foreground">
                      <LinkIcon className="size-5" />
                      Application Form
                    </CardTitle>
                    <CardDescription>
                      Custom form with pre-screening filters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                        <MousePointer className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Apply Buttons
                          </p>
                          <p className="text-muted-foreground">
                            Direct link for &quot;Apply Now&quot; CTAs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Embedded Forms
                          </p>
                          <p className="text-muted-foreground">
                            Integrate into websites, portals
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                        <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            Social Sharing
                          </p>
                          <p className="text-muted-foreground">
                            Share form link in posts, messages
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="mr-1 size-3" />
                        Pre-screening
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Smart filtering
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <Card className="border border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-900/20">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Automatic AI Processing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      All applications are intelligently processed
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                  {(
                    [
                      ['Parse', 'Extract info from resumes'],
                      ['Analyze', 'Match job requirements'],
                      ['Score', 'Rank candidate fit'],
                      ['Organize', 'Add to pipeline'],
                    ] as const
                  ).map(([title, blurb]) => (
                    <div
                      key={title}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                        {title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {blurb}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-border pt-6">
            {onConfigureForm && canManageForms ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full max-w-md"
                data-testid="success-configure-form"
                onClick={onConfigureForm}
              >
                <Settings2 className="size-4" />
                {formLink
                  ? 'Edit application form'
                  : 'Configure application form'}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 shadow-sm hover:shadow-md"
              size="lg"
              data-testid="success-dialog-done"
            >
              Perfect! Let&apos;s start receiving applications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
