import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPage } from '#/components/marketing/privacy-page'

/**
 * Privacy policy on the shared marketing shell. Readable while signed in so
 * Members (and footer/legal links) are never sent to a dead end.
 */
export const Route = createFileRoute('/_marketing/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: 'Privacy Policy — Talsek' },
      {
        name: 'description',
        content:
          'How Talsek collects, uses, and protects personal information on the AI hiring platform.',
      },
    ],
  }),
})
