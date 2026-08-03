import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { BotBubble } from './chat-bubbles'

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
      <BotBubble>
        <p className="whitespace-pre-line text-sm leading-relaxed md:text-base">
          {message}
        </p>
      </BotBubble>

      <div className="flex justify-center">
        <Button
          type="button"
          className="px-8 py-3"
          onClick={onComplete}
          disabled={disabled}
          data-testid="interview-display-continue"
        >
          {isLastQuestion ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Interview
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
