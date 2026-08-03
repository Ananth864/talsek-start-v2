import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Candidate board + profile dialog (tickets #6 / #7).
 * Uses E2E_EMAIL / E2E_PASSWORD. Shortlist/reject send paths are covered by
 * shortlist-reachout.spec.ts and bulk-upload-shortlist.spec.ts.
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('selecting a Job shows its candidate board grouped by Hiring Stage', async ({
  page,
}) => {
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)

  await expect(page.getByTestId('candidates-list')).toBeVisible()
  await expect(page.getByTestId('stage-tabs')).toBeVisible()
  const stageTabs = page.getByTestId('stage-tab')
  const tabCount = await stageTabs.count()
  expect(tabCount).toBeGreaterThan(0)

  const selectedTabs = page.locator(
    '[data-testid="stage-tab"][aria-selected="true"]',
  )
  await expect(selectedTabs).toHaveCount(1)

  await expect(page.getByTestId('fit-filter')).toBeVisible()
  await expect(page.getByTestId('candidate-search')).toBeVisible()

  const cards = page.getByTestId('candidate-card')
  const cardCount = await cards.count()
  if (cardCount > 0) {
    await expect(cards.first()).toBeVisible()
    await expect(cards.first().getByRole('img', { name: /Match score/ })).toBeVisible()
    await expect(cards.first().getByTestId('candidate-status')).toBeVisible()
    await expect(cards.first().getByTestId('candidate-star-toggle')).toBeVisible()
    await expect(cards.first().getByTestId('candidate-shortlist')).toBeVisible()

    if (tabCount > 1) {
      await stageTabs.nth(1).click()
      await expect(page).toHaveURL(/stageId=/)
    }
  } else {
    await expect(
      page.getByText(/no candidates (in this stage|match this filter)/i),
    ).toBeVisible()
  }
})

test('opening a candidate from the board shows the full profile dialog (#7)', async ({
  page,
}) => {
  await signIn(page)
  await page.getByTestId('job-card').first().click()
  await expect(page).toHaveURL(/jobId=/)
  await expect(page.getByTestId('candidates-list')).toBeVisible()

  const cards = page.getByTestId('candidate-card')
  const cardCount = await cards.count()
  if (cardCount === 0) {
    await expect(page.getByText(/no candidates in this stage/i)).toBeVisible()
    return
  }

  const firstCard = cards.first()
  const ringLabel = await firstCard
    .getByRole('img', { name: /Match score/ })
    .getAttribute('aria-label')
  await firstCard.getByTestId('candidate-view-profile').click()

  const dialog = page.getByTestId('candidate-profile-dialog')
  await expect(dialog).toBeVisible()

  const matchBadge = dialog.getByTestId('profile-match-score')
  if (await matchBadge.isVisible()) {
    const badgeText = await matchBadge.innerText()
    const badgeScore = badgeText.match(/(\d+)/)?.[1]
    expect(ringLabel).toContain(`${badgeScore}`)
  } else {
    await expect(dialog.getByTestId('profile-interview-score')).toBeVisible()
  }

  await expect(dialog.getByRole('tab', { name: 'Overview' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Requirement Analysis' }).click()
  await dialog.getByRole('tab', { name: 'Resume Data' }).click()
  await dialog.getByRole('tab', { name: 'Email' }).click()

  const downloadPromise = page.waitForEvent('download')
  await dialog.getByTestId('profile-download-pdf').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
})
