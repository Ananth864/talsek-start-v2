import { useCallback, useEffect, useState } from 'react'
import {
  isOnboardingComplete,
  readOnboardingCompleted,
  writeOnboardingCompleted,
} from '#/lib/onboarding'
import type { OnboardingStepId } from '#/lib/onboarding'

/**
 * Client-persisted Get Started checklist completion (`localStorage.onboarding_state`).
 * Hydrates after mount so SSR and the first client paint stay empty/incomplete.
 */
export function useOnboardingState() {
  const [completedItems, setCompletedItems] = useState<OnboardingStepId[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCompletedItems(readOnboardingCompleted())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeOnboardingCompleted(completedItems)
  }, [completedItems, hydrated])

  const toggleItem = useCallback((id: OnboardingStepId) => {
    setCompletedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const allComplete = isOnboardingComplete(completedItems)

  return {
    completedItems,
    toggleItem,
    allComplete,
    hydrated,
  }
}
