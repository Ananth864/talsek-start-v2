import { test, expect } from '@playwright/test'

/**
 * Characterisation spec for the sign-in + dashboard journey.
 * Captured against the source app first, then replayed against the new app.
 * Uses E2E_EMAIL / E2E_PASSWORD (a real Member in the Supabase project).
 */
test('member signs in and sees the company Jobs dashboard', async ({ page }) => {
  await page.goto('/signin')

  await expect(
    page.getByRole('heading', { name: /sign in to talsek/i }),
  ).toBeVisible()

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
})
