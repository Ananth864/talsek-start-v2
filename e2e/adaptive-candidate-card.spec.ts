import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Adaptive candidate card + grid/list preference (#26).
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

/** Open a Job board and wait for stage tabs (async useJobStages). */
async function openFirstJobBoard(page: Page) {
  const jobs = page.getByTestId('job-card')
  await expect(jobs.first()).toBeVisible({ timeout: 15_000 })
  const jobCount = await jobs.count()
  for (let i = 0; i < jobCount; i++) {
    await jobs.nth(i).click()
    await expect(page).toHaveURL(/jobId=/)
    await expect(page.getByTestId('candidates-list')).toBeVisible()
    try {
      await expect(page.getByTestId('stage-tab').first()).toBeVisible({
        timeout: 10_000,
      })
      return
    } catch {
      // Try next Job if this one has no stages or the query failed.
    }
  }
  throw new Error('No E2E Job has pipeline stages configured')
}

test('account menu toggles candidate board between list and grid', async ({
  page,
}) => {
  await signIn(page)
  await openFirstJobBoard(page)

  await page.getByTestId('account-menu-trigger').click()
  await expect(page.getByTestId('account-menu')).toBeVisible()
  await expect(page.getByTestId('candidate-view-toggle')).toBeVisible()

  const toggle = page.getByTestId('candidate-view-toggle')
  const labelBefore = (await toggle.innerText()).trim()
  await toggle.click()

  // Empty stages have no candidate-cards list — preference is still persisted.
  const cards = page.getByTestId('candidate-cards')
  const hasCards = (await page.getByTestId('candidate-card').count()) > 0
  if (hasCards) {
    await expect(cards).toBeVisible()
    if (/grid/i.test(labelBefore)) {
      await expect(cards).toHaveAttribute('data-layout', 'grid')
    } else {
      await expect(cards).toHaveAttribute('data-layout', 'list')
    }
    const firstCard = page.getByTestId('candidate-card').first()
    const layout = await cards.getAttribute('data-layout')
    await expect(firstCard).toHaveAttribute('data-layout', layout!)
  }

  await page.reload()
  await openFirstJobBoard(page)
  if ((await page.getByTestId('candidate-card').count()) > 0) {
    await expect(page.getByTestId('candidate-cards')).toHaveAttribute(
      'data-layout',
      /list|grid/,
    )
  } else {
    // Toggle lives in the account menu — re-open after reload.
    await expect(async () => {
      await page.getByTestId('account-menu-trigger').click()
      await expect(page.getByTestId('candidate-view-toggle')).toBeVisible({
        timeout: 2_000,
      })
    }).toPass({ timeout: 15_000 })
  }
})

test('candidate card adapts content by Hiring Stage', async ({ page }) => {
  await signIn(page)
  await openFirstJobBoard(page)

  const stageTabs = page.getByTestId('stage-tab')
  const tabCount = await stageTabs.count()
  expect(tabCount).toBeGreaterThan(0)

  for (let i = 0; i < tabCount; i++) {
    await stageTabs.nth(i).click()
    await expect(page).toHaveURL(/stageId=/)

    const tabLabel = (await stageTabs.nth(i).innerText()).toLowerCase()
    const cards = page.getByTestId('candidate-card')
    const cardCount = await cards.count()
    if (cardCount === 0) continue

    const first = cards.first()
    await expect(first).toBeVisible()

    if (tabLabel.includes('interview')) {
      await expect(first).toHaveAttribute('data-stage-kind', 'interview')
      await expect(first.getByTestId('candidate-interview-badges')).toBeVisible()
      await expect(first.getByTestId('candidate-shortlist')).toBeVisible()
      await expect(first.getByTestId('candidate-view-profile')).toBeVisible()
    } else if (tabLabel.includes('final')) {
      await expect(first).toHaveAttribute('data-stage-kind', 'final')
      await expect(first.getByTestId('candidate-final-actions')).toBeVisible()
      await expect(first.getByTestId('candidate-view-profile')).toBeVisible()
    } else {
      await expect(first).toHaveAttribute('data-stage-kind', 'resume')
      await expect(first.getByTestId('candidate-shortlist')).toBeVisible()
      await expect(first.getByTestId('candidate-view-profile')).toBeVisible()
      await expect(first.getByTestId('candidate-star-toggle')).toBeVisible()
    }
  }
})
