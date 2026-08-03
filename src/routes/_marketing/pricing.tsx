import { createFileRoute } from '@tanstack/react-router'
import { PricingPage } from '#/components/marketing/pricing-page'

/**
 * Public pricing page. Authenticated Members may view it (source
 * allowAuthenticated) so they can compare tiers while signed in.
 */
export const Route = createFileRoute('/_marketing/pricing')({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: 'Pricing — Talsek' },
      {
        name: 'description',
        content:
          'Simple credit-based pricing for AI resume screening and screening interviews. Pay as you go, Tier 1, or Enterprise.',
      },
    ],
  }),
})
