import { test, expect } from '@playwright/test'

/**
 * Marketing static pages smoke (#32). Playwright suite is paused for the
 * port-completion batch — keep this ready for when E2E is re-enabled.
 */

const pages = [
  {
    path: '/pricing',
    testId: 'pricing-page',
    heading: /Simple, Credit-Based Pricing/i,
  },
  {
    path: '/contact',
    testId: 'contact-page',
    heading: /Contact Our Team/i,
  },
  {
    path: '/thank-you',
    testId: 'thank-you-page',
    heading: /Thank You!/i,
  },
  {
    path: '/privacy',
    testId: 'privacy-page',
    heading: /Privacy Policy/i,
  },
  {
    path: '/terms',
    testId: 'terms-page',
    heading: /Terms of Service/i,
  },
] as const

for (const pageDef of pages) {
  test(`${pageDef.path} renders on the marketing shell`, async ({ page }) => {
    await page.goto(pageDef.path)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId(pageDef.testId)).toBeVisible()
    await expect(page.getByRole('heading', { name: pageDef.heading })).toBeVisible()
    await expect(page.getByTestId('marketing-header')).toBeVisible()
    await expect(page.getByTestId('marketing-footer')).toBeVisible()
  })
}

test('pricing shows three tiers, credits explainer, and opens Cal booking', async ({
  page,
}) => {
  await page.goto('/pricing')
  await page.waitForLoadState('networkidle')

  await expect(page.getByTestId('pricing-tier-pay-as-you-go')).toBeVisible()
  await expect(page.getByTestId('pricing-tier-tier-1')).toBeVisible()
  await expect(page.getByTestId('pricing-tier-enterprise')).toBeVisible()
  await expect(page.getByTestId('credits-explainer')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'How Credits Work' }),
  ).toBeVisible()

  await page.getByTestId('pricing-book-demo').click()
  await expect(page.getByTestId('cal-booking-dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Book a Call' })).toBeVisible()
})

test('footer legal links resolve without dead ends', async ({ page }) => {
  await page.goto('/pricing')
  await page.waitForLoadState('networkidle')

  const footer = page.getByTestId('marketing-footer')
  await footer.getByRole('link', { name: 'Privacy Policy' }).click()
  await expect(page).toHaveURL(/\/privacy/)
  await expect(page.getByTestId('privacy-page')).toBeVisible()

  await page
    .getByTestId('marketing-footer')
    .getByRole('link', { name: 'Terms of Service' })
    .click()
  await expect(page).toHaveURL(/\/terms/)
  await expect(page.getByTestId('terms-page')).toBeVisible()
})

test('header contact and pricing links resolve', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page
    .getByTestId('marketing-header')
    .getByRole('link', { name: 'Pricing' })
    .click()
  await expect(page).toHaveURL(/\/pricing/)
  await expect(page.getByTestId('pricing-page')).toBeVisible()

  await page
    .getByTestId('marketing-header')
    .getByRole('link', { name: 'Contact Us' })
    .click()
  await expect(page).toHaveURL(/\/contact/)
  await expect(page.getByTestId('contact-page')).toBeVisible()
})
