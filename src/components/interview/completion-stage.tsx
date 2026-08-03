import { Button } from '#/components/ui/button'
import { CheckCircle } from 'lucide-react'

export function CompletionStage() {
  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-center"
      data-testid="interview-complete"
    >
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold">Interview Complete!</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Thank you for taking the time to complete your interview. Your
          responses have been recorded and will be reviewed by our team.
        </p>
        <div
          className="mb-6 rounded-lg bg-primary/10 p-4 text-sm text-foreground"
          data-testid="interview-next-steps"
        >
          <strong>What happens next?</strong>
          <br />
          Our team will review your responses and contact you within 2-3
          business days with next steps.
        </div>
        <Button
          type="button"
          size="lg"
          className="px-8 py-3"
          data-testid="interview-close"
          onClick={() => {
            try {
              window.close()
            } catch {
              window.history.back()
            }
          }}
        >
          Close Interview
        </Button>
      </div>
    </div>
  )
}
