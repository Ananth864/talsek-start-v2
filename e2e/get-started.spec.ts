import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Get Started onboarding checklist + action hub (#29).
 * Playwright suite is paused for the port-completion batch — this spec is
 * written for when E2E is re-enabled.
 */

const STEP_IDS = [
  'customize-form',
  'reachout-templates',
  'add-team',
  'add-credits',
  'create-job',
] as const

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openGetStarted(page: Page) {
  await page.getByTestId('get-started-nav').click()
  await expect(page).toHaveURL(/\/get-started/)
  await expect(page.getByTestId('get-started-page')).toBeVisible()
}

test('Get Started is reachable from the sidebar and shows the checklist', async ({
  page,
}) => {
  await signIn(page)
  await page.evaluate(() => window.localStorage.removeItem('onboarding_state'))
  await openGetStarted(page)

  await expect(page.getByTestId('onboarding-checklist')).toBeVisible()
  await expect(page.getByText(/let's get you set up/i)).toBeVisible()

  for (const id of STEP_IDS) {
    await expect(page.getByTestId(`checklist-item-${id}`)).toBeVisible()
    await expect(page.getByTestId(`checklist-link-${id}`)).toBeVisible()
  }

  await page.getByTestId('checklist-link-customize-form').click()
  await expect(page).toHaveURL(/\/form-settings/)
})

test('checklist completion persists and swaps to the action hub', async ({
  page,
}) => {
  await signIn(page)
  await page.evaluate(() => window.localStorage.removeItem('onboarding_state'))
  await openGetStarted(page)

  await expect(page.getByTestId('onboarding-checklist')).toBeVisible()

  // Partial progress survives a reload.
  await page.getByTestId('checklist-toggle-customize-form').click()
  await expect(
    page.getByTestId('checklist-item-customize-form'),
  ).toHaveAttribute('data-completed', 'true')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('onboarding-checklist')).toBeVisible()
  await expect(
    page.getByTestId('checklist-item-customize-form'),
  ).toHaveAttribute('data-completed', 'true')

  for (const id of STEP_IDS) {
    const item = page.getByTestId(`checklist-item-${id}`)
    if ((await item.getAttribute('data-completed')) !== 'true') {
      await page.getByTestId(`checklist-toggle-${id}`).click()
    }
    await expect(item).toHaveAttribute('data-completed', 'true')
  }

  await expect(page.getByTestId('action-hub')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('heading', { name: /dashboard hub/i })).toBeVisible()
  await expect(page.getByTestId('action-hub-create-job')).toBeVisible()
  await expect(page.getByTestId('action-hub-candidates')).toBeVisible()
  await expect(page.getByTestId('action-hub-team')).toBeVisible()
  await expect(page.getByTestId('action-hub-billing')).toBeVisible()

  const stored = await page.evaluate(() =>
    window.localStorage.getItem('onboarding_state'),
  )
  expect(stored).toBeTruthy()
  const parsed = JSON.parse(stored!) as string[]
  expect(parsed).toEqual(expect.arrayContaining([...STEP_IDS]))
  expect(parsed).toHaveLength(STEP_IDS.length)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('action-hub')).toBeVisible()
  await expect(page.getByTestId('onboarding-checklist')).toHaveCount(0)
})
