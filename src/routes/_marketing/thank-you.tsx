import { createFileRoute } from '@tanstack/react-router'
import { ThankYouPage } from '#/components/marketing/thank-you-page'

/**
 * Post-booking thank-you page (Cal.com success redirect) on the shared shell.
 */
export const Route = createFileRoute('/_marketing/thank-you')({
  component: ThankYouPage,
  head: () => ({
    meta: [
      { title: 'Thank You — Talsek' },
      {
        name: 'description',
        content:
          'Your demo call is booked. Watch a platform walkthrough while you wait.',
      },
    ],
  }),
})
