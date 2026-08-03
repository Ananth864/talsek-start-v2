import { createFileRoute } from '@tanstack/react-router'
import { TermsPage } from '#/components/marketing/terms-page'

/**
 * Terms of service on the shared marketing shell. Readable while signed in so
 * Members (and footer/legal links) are never sent to a dead end.
 */
export const Route = createFileRoute('/_marketing/terms')({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: 'Terms of Service — Talsek' },
      {
        name: 'description',
        content:
          'Terms governing use of the Talsek AI-powered hiring platform.',
      },
    ],
  }),
})
