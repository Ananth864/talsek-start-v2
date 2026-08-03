import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ActionHub } from '#/components/get-started/action-hub'
import { OnboardingChecklist } from '#/components/get-started/onboarding-checklist'
import { useOnboardingState } from '#/hooks/use-onboarding-state'

export const Route = createFileRoute('/_member/get-started')({
  component: GetStartedPage,
})

function GetStartedPage() {
  const { completedItems, toggleItem, allComplete, hydrated } =
    useOnboardingState()
  const [showHub, setShowHub] = useState(false)
  const openedFromHydrate = useRef(false)

  // On first hydrate only: if the Member already finished every step, open the hub.
  // Mid-session completion goes through `handleAllComplete` (after the checkmark pause).
  useEffect(() => {
    if (!hydrated || openedFromHydrate.current) return
    openedFromHydrate.current = true
    if (allComplete) {
      setShowHub(true)
    }
  }, [hydrated, allComplete])

  const handleAllComplete = useCallback(() => {
    setShowHub(true)
  }, [])

  return (
    <div
      className="flex flex-1 flex-col p-4 md:p-8"
      data-testid="get-started-page"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {showHub ? 'Dashboard Hub' : 'Welcome to Talsek'}
        </h1>
      </header>

      <main className="flex flex-col items-center">
        {!hydrated ? (
          <div
            className="w-full max-w-4xl animate-pulse space-y-4"
            data-testid="get-started-loading"
            aria-hidden
          >
            <div className="h-2 rounded-full bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        ) : showHub ? (
          <ActionHub />
        ) : (
          <div className="w-full space-y-8">
            <div className="mb-2 space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Let&apos;s get you set up
              </h2>
              <p className="text-muted-foreground">
                Follow these steps to configure your Company and hire your first
                Candidate.
              </p>
            </div>
            <OnboardingChecklist
              completedItems={completedItems}
              onToggle={toggleItem}
              onAllComplete={handleAllComplete}
            />
          </div>
        )}
      </main>
    </div>
  )
}
