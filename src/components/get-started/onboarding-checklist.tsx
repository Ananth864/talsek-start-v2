import { useEffect } from 'react'
import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Briefcase,
  Check,
  CreditCard,
  FileText,
  Mail,
  Users,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { isOnboardingComplete, ONBOARDING_STEPS } from '#/lib/onboarding'
import type { OnboardingStepId } from '#/lib/onboarding'
import { cn } from '#/lib/utils'

const STEP_ICONS: Record<
  OnboardingStepId,
  ComponentType<{ className?: string }>
> = {
  'customize-form': FileText,
  'reachout-templates': Mail,
  'add-team': Users,
  'add-credits': CreditCard,
  'create-job': Briefcase,
}

type OnboardingChecklistProps = {
  completedItems: OnboardingStepId[]
  onToggle: (id: OnboardingStepId) => void
  onAllComplete: () => void
}

export function OnboardingChecklist({
  completedItems,
  onToggle,
  onAllComplete,
}: OnboardingChecklistProps) {
  const progress =
    (completedItems.length / ONBOARDING_STEPS.length) * 100
  const allMarked = isOnboardingComplete(completedItems)

  useEffect(() => {
    if (!allMarked) return
    // Brief pause so the last checkmark is visible before the hub swap.
    const timer = window.setTimeout(() => {
      onAllComplete()
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [allMarked, onAllComplete])

  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-8"
      data-testid="onboarding-checklist"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Your Progress</span>
          <span className="font-bold text-primary">
            {Math.round(progress)}% Completed
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
          data-testid="onboarding-progress"
        >
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {ONBOARDING_STEPS.map((item) => {
          const isCompleted = completedItems.includes(item.id)
          const Icon = STEP_ICONS[item.id]

          return (
            <Card
              key={item.id}
              className={cn(
                'transition-colors',
                isCompleted
                  ? 'border-primary/20 bg-muted/30'
                  : 'border-border bg-card',
              )}
              data-testid={`checklist-item-${item.id}`}
              data-completed={isCompleted ? 'true' : 'false'}
            >
              <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
                    isCompleted
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <h3
                      className={cn(
                        'text-lg font-semibold',
                        isCompleted &&
                          'text-muted-foreground line-through decoration-primary/50',
                      )}
                    >
                      {item.title}
                    </h3>
                    {isCompleted ? (
                      <Badge
                        variant="outline"
                        className="h-5 border-primary/30 bg-primary/5 px-1.5 text-[10px] text-primary"
                      >
                        Done
                      </Badge>
                    ) : null}
                  </div>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-auto sm:flex-row">
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link
                      to={item.route}
                      data-testid={`checklist-link-${item.id}`}
                    >
                      {item.ctaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    type="button"
                    variant={isCompleted ? 'ghost' : 'default'}
                    size="icon"
                    className={cn(
                      'h-10 w-10 rounded-full transition-colors',
                      isCompleted
                        ? 'text-primary hover:bg-primary/10 hover:text-primary'
                        : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground',
                    )}
                    onClick={() => onToggle(item.id)}
                    title={
                      isCompleted ? 'Mark as incomplete' : 'Mark as done'
                    }
                    aria-label={
                      isCompleted
                        ? `Mark ${item.title} incomplete`
                        : `Mark ${item.title} done`
                    }
                    data-testid={`checklist-toggle-${item.id}`}
                  >
                    <Check
                      className={cn(
                        'h-5 w-5',
                        isCompleted ? 'opacity-100' : 'opacity-50',
                      )}
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
