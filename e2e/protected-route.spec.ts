import { test, expect } from '@playwright/test'

/**
 * Protected-route guard + return-to-URL. Unauthenticated visitors are bounced
 * to /signin carrying the intended destination; after a real sign-in they land
 * back on it. Uses E2E_EMAIL / E2E_PASSWORD (a real Member).
 */
test('protected route redirects to sign-in and returns after login', async ({
  page,
}) => {
  // 1. Unauthenticated visit → bounced to /signin?redirect=/dashboard.
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle') // let the client hydrate before interacting
  await expect(page).toHaveURL(/\/signin/)
  await expect(page).toHaveURL(/redirect=%2Fdashboard/)
  await expect(page.getByLabel('Email')).toBeVisible()

  // 2. Sign in → returned to the originally requested /dashboard.
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
})
