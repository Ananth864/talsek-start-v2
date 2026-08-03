import { Button } from '#/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

type DisplayOnlyQuestionProps = {
  message: string
  onComplete: () => void
  isLastQuestion?: boolean
  disabled?: boolean
}

export function DisplayOnlyQuestion({
  message,
  onComplete,
  isLastQuestion = false,
  disabled = false,
}: DisplayOnlyQuestionProps) {
  return (
    <div className="space-y-6" data-testid="interview-display">
      <p className="whitespace-pre-line rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
        {message}
      </p>
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={onComplete}
          disabled={disabled}
          data-testid="interview-display-continue"
        >
          {isLastQuestion ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete interview
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
