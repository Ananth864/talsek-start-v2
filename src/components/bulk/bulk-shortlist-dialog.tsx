import { ArrowRight, Copy, Loader, Users } from 'lucide-react'
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

const TEMPLATE_VARIABLES = [
  { key: '{{candidate_name}}', label: 'Name' },
  { key: '{{candidate_email}}', label: 'Email' },
  { key: '{{job_title}}', label: 'Job Title' },
  { key: '{{current_role}}', label: 'Current Role' },
]

const INTERVIEW_VARIABLE = {
  key: '{{interview_link}}',
  label: 'Interview Link',
}

type BulkShortlistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateCount: number
  currentStage?: string
  nextStage?: string
  messageSubject: string
  messageBody: string
  onSubjectChange: (subject: string) => void
  onBodyChange: (body: string) => void
  onConfirm: () => void
  isLoading: boolean
  requireInterviewLink?: boolean
}

/**
 * Confirm dialog for bulk Shortlist — editable Reachout subject/body pre-filled
 * from the stage template (source `BulkShortlistModal`). Placeholders stay in
 * the message so the server personalizes per candidate.
 */
export function BulkShortlistDialog({
  open,
  onOpenChange,
  candidateCount,
  currentStage,
  nextStage,
  messageSubject,
  messageBody,
  onSubjectChange,
  onBodyChange,
  onConfirm,
  isLoading,
  requireInterviewLink = false,
}: BulkShortlistDialogProps) {
  const hasInterviewLink = messageBody.includes('{{interview_link}}')
  const isInterviewLinkMissing = requireInterviewLink && !hasInterviewLink

  const copyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable)
    } catch {
      // Clipboard may be unavailable in some E2E / permission contexts.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
        data-testid="bulk-shortlist-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Bulk Shortlist {candidateCount} Candidate
            {candidateCount === 1 ? '' : 's'}
          </DialogTitle>
          <DialogDescription>
            Review and send the Reachout message to all selected candidates
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-primary">
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <span className="font-semibold">
              {currentStage || 'Current Stage'}
            </span>
            <ArrowRight className="size-4" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-300">
              {nextStage || 'Next Stage'}
            </span>
          </div>
          <p className="mt-2 text-center text-xs">
            All {candidateCount} candidate{candidateCount === 1 ? '' : 's'} will
            be moved to the next hiring stage
          </p>
        </div>

        {!isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-shortlist-subject">Email Subject</Label>
              <Input
                id="bulk-shortlist-subject"
                value={messageSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Enter email subject…"
                data-testid="bulk-shortlist-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-shortlist-body">Email Message</Label>
              <Textarea
                id="bulk-shortlist-body"
                value={messageBody}
                onChange={(e) => onBodyChange(e.target.value)}
                className={`min-h-[200px] font-mono text-sm ${
                  isInterviewLinkMissing
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
                placeholder="Enter your message…"
                data-testid="bulk-shortlist-body"
              />
              {isInterviewLinkMissing ? (
                <p className="text-xs font-semibold text-destructive">
                  Interview template must include {'{{interview_link}}'}{' '}
                  placeholder
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click to copy variables to clipboard. Placeholders are
                  personalized per candidate when sent.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <Button
                    key={variable.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => void copyVariable(variable.key)}
                  >
                    <Copy className="size-3" />
                    {variable.label}
                  </Button>
                ))}
                {requireInterviewLink ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 border-emerald-500 px-2 text-xs text-emerald-600"
                    onClick={() => void copyVariable(INTERVIEW_VARIABLE.key)}
                  >
                    <Copy className="size-3" />
                    {INTERVIEW_VARIABLE.label}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" />
            Sending Reachouts…
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={
              isLoading ||
              !messageSubject.trim() ||
              !messageBody.trim() ||
              isInterviewLinkMissing
            }
            data-testid="bulk-shortlist-confirm"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 size-4 animate-spin" />
                Sending…
              </>
            ) : (
              `Shortlist ${candidateCount} Candidate${candidateCount === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
