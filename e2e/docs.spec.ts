import { test, expect } from '@playwright/test'

/**
 * Documentation section smoke (#33). Playwright suite is paused for the
 * port-completion batch — keep this ready for when E2E is re-enabled.
 */

test('docs index redirects to get-started', async ({ page }) => {
  await page.goto('/docs')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveURL(/\/docs\/get-started\/?$/)
  await expect(page.getByTestId('docs-layout')).toBeVisible()
  await expect(page.getByTestId('docs-sidebar')).toBeVisible()
  // Sidebar accordion also exposes a "Get Started" heading — scope to the page H1.
  await expect(page.locator('h1', { hasText: 'Get Started' })).toBeVisible()
})

test('nested docs page renders with TOC sections', async ({ page }) => {
  await page.goto('/docs/billing/how-to-buy-credits/subscriptions')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveURL(/\/docs\/billing\/how-to-buy-credits\/subscriptions/)
  await expect(page.getByTestId('docs-layout')).toBeVisible()
  await expect(page.getByTestId('docs-content')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Subscriptions', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'On this page' }),
  ).toBeVisible()
})

test('docs sidebar navigates between pages', async ({ page }) => {
  await page.goto('/docs/get-started')
  await page.waitForLoadState('networkidle')

  await page.getByTestId('docs-nav-create-a-job').click()
  await expect(page).toHaveURL(/\/docs\/create-a-job/)
  await expect(
    page.getByRole('heading', { name: 'Create a Job', exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('docs-content')).toBeVisible()
})
