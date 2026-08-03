import { CheckCircle, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import type { QuestionCompletedJson } from '#/integrations/supabase/json-types'

type ConversationModalProps = {
  open: boolean
  onClose: () => void
  question: QuestionCompletedJson | null
  questionNumber?: number
  candidateName?: string
}

/**
 * Full AI-conversation transcript for one completed interview question
 * (source `ConversationModal`). Hides follow-up `reasoning` (source parity).
 */
export function ConversationModal({
  open,
  onClose,
  question,
  questionNumber,
  candidateName,
}: ConversationModalProps) {
  if (!question) return null

  const hasFollowUps = question.followUps && question.followUps.length > 0

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        data-testid="conversation-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="text-primary" size={24} />
            Full Conversation
            {questionNumber ? `: Question ${questionNumber}` : ''}
            {candidateName ? ` for ${candidateName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <div className="flex items-start gap-2">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <span className="text-sm font-bold text-white">Q</span>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Question
                  </p>
                  <p className="leading-relaxed text-foreground">
                    {question.mainQuestion}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/60 p-4">
              <div className="flex items-start gap-2">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-foreground">
                  <span className="text-sm font-bold text-background">A</span>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-semibold text-foreground">
                    Candidate Answer
                  </p>
                  <p className="leading-relaxed text-foreground">
                    {question.mainAnswer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {hasFollowUps ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-border" />
                <span className="px-2 text-sm font-semibold text-muted-foreground">
                  Follow-up Discussion
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {question.followUps!.map((followUp, index) => (
                <div
                  key={index}
                  className="space-y-3 border-l-2 border-blue-300 pl-4 dark:border-blue-700"
                  data-testid="conversation-follow-up"
                >
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500">
                        <span className="text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 text-xs font-semibold text-blue-900 dark:text-blue-200">
                          Follow-up Question {index + 1}
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">
                          {followUp.question}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/60 p-4">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted-foreground">
                        <span className="text-xs font-bold text-background">
                          A
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 text-xs font-semibold text-foreground">
                          Candidate Answer
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">
                          {followUp.answer}
                        </p>
                        {followUp.timestamp ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(followUp.timestamp).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {question.ai_assessment ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-border" />
                <span className="px-2 text-sm font-semibold text-muted-foreground">
                  AI Assessment
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="mt-1 shrink-0 text-emerald-600"
                    size={20}
                  />
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Overall Evaluation
                    </p>
                    <p className="leading-relaxed text-foreground">
                      {question.ai_assessment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
            data-testid="conversation-close"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
