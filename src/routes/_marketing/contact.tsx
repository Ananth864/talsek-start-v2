import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '#/components/marketing/contact-page'

/**
 * Public contact page on the shared marketing shell. Signed-in Members may
 * still open it (header Contact Us / FAQ CTA) without a dead-end redirect.
 */
export const Route = createFileRoute('/_marketing/contact')({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: 'Contact Us — Talsek' },
      {
        name: 'description',
        content:
          'Get in touch with the Talsek team or book a demo to see AI-powered hiring in action.',
      },
    ],
  }),
})
