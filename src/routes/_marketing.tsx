import { Outlet, createFileRoute } from '@tanstack/react-router'
import { CalBookingProvider } from '#/components/marketing/cal-booking-context'
import { MarketingFooter } from '#/components/marketing/marketing-footer'
import { MarketingHeader } from '#/components/marketing/marketing-header'

/**
 * Pathless layout for public marketing pages: shared header, footer, and
 * one Cal.com demo-booking dialog (#31).
 */
export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <CalBookingProvider>
      <div className="min-h-screen bg-background text-foreground">
        <MarketingHeader />
        <Outlet />
        <MarketingFooter />
      </div>
    </CalBookingProvider>
  )
}
