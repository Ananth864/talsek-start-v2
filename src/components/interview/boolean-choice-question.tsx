import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { BotBubble } from './chat-bubbles'

type BooleanChoiceQuestionProps = {
  question: string
  onSubmit: (value: 'Yes' | 'No') => void
  disabled?: boolean
}

export function BooleanChoiceQuestion({
  question,
  onSubmit,
  disabled = false,
}: BooleanChoiceQuestionProps) {
  return (
    <div className="space-y-4" data-testid="interview-boolean">
      <BotBubble>
        <p className="text-sm leading-relaxed md:text-base">{question}</p>
      </BotBubble>

      <div className="mx-auto flex w-full max-w-md gap-4">
        <Button
          type="button"
          className="h-14 flex-1"
          variant="outline"
          disabled={disabled}
          onClick={() => onSubmit('Yes')}
          data-testid="interview-boolean-yes"
        >
          <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
          Yes
        </Button>
        <Button
          type="button"
          className="h-14 flex-1"
          variant="outline"
          disabled={disabled}
          onClick={() => onSubmit('No')}
          data-testid="interview-boolean-no"
        >
          <XCircle className="mr-2 h-5 w-5 text-red-600" />
          No
        </Button>
      </div>
    </div>
  )
}
