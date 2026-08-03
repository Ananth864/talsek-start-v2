import { createFileRoute } from '@tanstack/react-router'
import { Rocket } from 'lucide-react'

/**
 * Placeholder for the Get Started onboarding checklist (later ticket).
 * Keeps the sidebar entry reachable without blocking #25.
 */
export const Route = createFileRoute('/_member/get-started')({
  component: GetStartedPlaceholder,
})

function GetStartedPlaceholder() {
  return (
    <div
      className="flex flex-1 flex-col items-start gap-2 p-6"
      data-testid="get-started-placeholder"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Rocket className="h-5 w-5" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Get Started
        </h1>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        Onboarding checklist coming soon. Use the sidebar to reach Dashboard and
        the other Member tools meanwhile.
      </p>
    </div>
  )
}
