import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '#/components/marketing/landing-page'
import { getAuthState } from '#/server/fn/auth'

/**
 * Root marketing landing. Visitors see the page; Members with a session are
 * sent to the dashboard (source ProtectedRoute requireAuth={false} behaviour).
 */
export const Route = createFileRoute('/_marketing/')({
  beforeLoad: async () => {
    const { user } = await getAuthState()
    if (user) throw redirect({ to: '/dashboard' })
  },
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: 'Talsek — AI hiring engine for startups',
      },
      {
        name: 'description',
        content:
          'Talsek scans resumes, runs AI screening interviews, and ranks candidates so you only interview the best.',
      },
    ],
  }),
})
