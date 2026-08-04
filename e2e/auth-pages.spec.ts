import { test, expect } from '@playwright/test'

/**
 * Auth surface: page rendering, validation, and the deterministic no-code
 * branches of the PKCE routes. The real email-link round-trips (signup
 * confirmation, password reset, Google OAuth) are environment-dependent and
 * verified manually — see docs/adr/0008.
 */

test('sign-up form validates and rejects a weak password client-side', async ({
  page,
}) => {
  await page.goto('/signup')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('First name').fill('E2E')
  await page.getByLabel('Last name').fill('Test')
  await page.getByLabel('Email').fill('e2e-signup@example.com')
  // Exact: Confirm password also matches getByLabel('Password').
  await page.getByLabel('Password', { exact: true }).fill('weakpass')
  // Confirm must be filled or native `required` blocks submit before JS rules.
  await page.getByLabel('Confirm password').fill('weakpass')

  // Weak password fails the client rule (needs upper + lower + digit) without a
  // Supabase call.
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(
    page.getByText(
      /password must be at least 8 characters and include upper, lower, and a digit/i,
    ),
  ).toBeVisible()
  // Still on /signup (no navigation, no Supabase call).
  await expect(page).toHaveURL(/\/signup/)
})

test('forgot-password is non-revealing for an unknown address', async ({
  page,
}) => {
  await page.goto('/forgot-password')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill('definitely-not-a-member-e2e@example.com')
  await page.getByRole('button', { name: /send reset link/i }).click()

  // Success chrome (copy appears twice; assert the unique heading + CTA).
  await expect(
    page.getByRole('heading', { name: 'Check your email', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText(/if an account exists for this address/i),
  ).toBeVisible()
})

test('confirm-email without a code shows the "check your email" resend UI', async ({
  page,
}) => {
  await page.goto('/confirm-email')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/check your email/i)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /resend confirmation email/i }),
  ).toBeVisible()
})

test('reset-password without a code redirects to forgot-password', async ({
  page,
}) => {
  await page.goto('/reset-password')
  await expect(page).toHaveURL(/\/forgot-password/)
})

test('OAuth callback without a code redirects to sign-in', async ({ page }) => {
  await page.goto('/auth/callback')
  await expect(page).toHaveURL(/\/signin/)
})

test('sign-in page offers Google OAuth', async ({ page }) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByRole('button', { name: /continue with google/i }),
  ).toBeVisible()
})
