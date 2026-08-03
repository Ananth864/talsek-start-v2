import { Bot, User } from 'lucide-react'
import type { ReactNode } from 'react'

/** Shared Bot/User bubbles for interview chat chrome (ported theme tokens). */
export function BotBubble({
  children,
  compact = false,
}: {
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[90%] gap-2 md:max-w-3xl md:gap-3">
        <div
          className={`mt-1 flex flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-muted ${
            compact ? 'h-6 w-6 md:h-7 md:w-7' : 'h-7 w-7 md:h-8 md:w-8'
          }`}
        >
          <Bot
            className={`text-primary ${compact ? 'h-3 w-3 md:h-3.5 md:w-3.5' : 'h-3.5 w-3.5 md:h-4 md:w-4'}`}
          />
        </div>
        <div
          className={`rounded-2xl border border-border bg-card ${
            compact
              ? 'px-3 py-2 md:px-4 md:py-3'
              : 'px-4 py-3 md:px-6 md:py-4'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function UserBubble({
  children,
  compact = false,
  processing = false,
}: {
  children: ReactNode
  compact?: boolean
  processing?: boolean
}) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[90%] gap-2 md:max-w-3xl md:gap-3">
        <div
          className={`rounded-2xl border border-border bg-muted ${
            compact
              ? 'px-3 py-2 md:px-4 md:py-3'
              : 'px-4 py-3 md:px-6 md:py-4'
          } ${processing ? 'opacity-90' : ''}`}
        >
          {children}
        </div>
        <div
          className={`mt-1 flex flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted ${
            compact ? 'h-6 w-6 md:h-7 md:w-7' : 'h-7 w-7 md:h-8 md:w-8'
          }`}
        >
          <User
            className={`text-muted-foreground ${compact ? 'h-3 w-3 md:h-3.5 md:w-3.5' : 'h-3.5 w-3.5 md:h-4 md:w-4'}`}
          />
        </div>
      </div>
    </div>
  )
}
