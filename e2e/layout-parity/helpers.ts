import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Desktop-primary viewport for layout-parity (ADR-0030 §4). */
export const LAYOUT_PARITY_VIEWPORT = { width: 1280, height: 800 } as const

/**
 * Sign in as the configured E2E Member and land on /dashboard.
 * Shared by layout-parity specs only — do not import into behavioural e2e/.
 */
export async function signInAsMember(page: Page) {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set for layout-parity')
  }

  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}
