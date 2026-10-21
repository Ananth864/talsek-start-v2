import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { CalBookingProvider } from '#/components/marketing/cal-booking-context'
import { MarketingFooter } from '#/components/marketing/marketing-footer'
import { MarketingHeader } from '#/components/marketing/marketing-header'

/**
 * Pathless layout for public marketing pages: shared header, footer, and
 * one Cal.com demo-booking dialog (#31).
 *
 * Sets [data-marketing-theme] on <html> so the screening-desk token palette
 * (ADR-0032) applies to portals too; gated routes keep the product theme.
 */
export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-marketing-theme', '')
    return () => root.removeAttribute('data-marketing-theme')
  }, [])

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
