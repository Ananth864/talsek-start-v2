import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { BotBubble } from './chat-bubbles'

type ManualInputQuestionProps = {
  question: string
  placeholder?: string
  onSubmit: (value: string) => void
  disabled?: boolean
}

export function ManualInputQuestion({
  question,
  placeholder = 'Enter your answer',
  onSubmit,
  disabled = false,
}: ManualInputQuestionProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const numValue = parseFloat(value)
    if (Number.isNaN(numValue) || value.trim() === '') {
      setError('Please enter a valid number')
      return
    }
    if (numValue < 0) {
      setError('Please enter a positive number')
      return
    }
    onSubmit(value)
    setValue('')
    setError('')
  }

  return (
    <div className="space-y-4" data-testid="interview-manual">
      <BotBubble>
        <p className="text-sm leading-relaxed md:text-base">{question}</p>
      </BotBubble>

      <div className="mx-auto w-full max-w-md space-y-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) handleSubmit()
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="bg-background"
          data-testid="interview-manual-input"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          data-testid="interview-manual-submit"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
