import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Member sidebar shell (#25): shared nav, account menu theme toggle, sign-out.
 * Playwright suite is paused for the port-completion batch — this spec is
 * written for when E2E is re-enabled.
 */
async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('member sidebar shows core nav and account menu theme persists', async ({
  page,
}) => {
  await signIn(page)

  await expect(page.getByTestId('member-sidebar')).toBeVisible()
  await expect(page.getByTestId('dashboard-nav')).toBeVisible()
  await expect(page.getByTestId('form-settings-nav')).toBeVisible()
  await expect(page.getByTestId('bulk-upload-nav')).toBeVisible()
  await expect(page.getByTestId('create-job-button')).toBeVisible()

  await page.getByTestId('account-menu-trigger').click()
  await expect(page.getByTestId('account-menu')).toBeVisible()

  const before = await page.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  await page.getByTestId('theme-toggle').click()

  await expect
    .poll(async () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      ),
    )
    .not.toBe(before)

  const stored = await page.evaluate(() => window.localStorage.getItem('theme'))
  expect(stored === 'light' || stored === 'dark').toBe(true)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('member-sidebar')).toBeVisible()

  const afterReload = await page.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  expect(afterReload).toBe(stored)
})

test('member can sign out from the account menu', async ({ page }) => {
  await signIn(page)
  await page.getByTestId('account-menu-trigger').click()
  await page.getByTestId('sign-out').click()
  await expect(page).toHaveURL(/\/signin/)
})
