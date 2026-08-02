import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Characterisation spec for the candidate-board journey (ticket #6).
 * Same capture-against-source technique as the auth/jobs specs: authored to
 * the source app's behaviour, replayed against the new app. Uses E2E_EMAIL /
 * E2E_PASSWORD (a real Member with real Jobs in the Supabase project).
 *
 * The jobs owned by the E2E account are created via the #5 create-job flow, so
 * they carry a pipeline (job_stages) but may not yet have any applications
 * (applications arrive via the form/email flows — later tickets). The board is
 * therefore asserted structurally (it renders for the selected Job, stage tabs
 * present), and candidate content is asserted conditionally — when applications
 * exist the card surface (score, status, parsed data) is validated, otherwise
 * the empty-state path is. Full candidate-data parity locks when an
 * application-creation flow seeds fixtures (ADR-0011 follow-up).
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

  // Select the first Job — the right pane opens the candidate board.
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)

  // The board container and the stage tabs (the Job's pipeline) render.
  await expect(page.getByTestId('candidates-list')).toBeVisible()
  await expect(page.getByTestId('stage-tabs')).toBeVisible()
  const stageTabs = page.getByTestId('stage-tab')
  const tabCount = await stageTabs.count()
  expect(tabCount).toBeGreaterThan(0)

  // Exactly one stage tab is selected (the board defaults to the first stage).
  const selectedTabs = page.locator(
    '[data-testid="stage-tab"][aria-selected="true"]',
  )
  await expect(selectedTabs).toHaveCount(1)

  // Candidate content is conditional on whether the Job has applications yet.
  const cards = page.getByTestId('candidate-card')
  const cardCount = await cards.count()
  if (cardCount > 0) {
    // Parsed data / match score / Processing Status display on the card.
    await expect(cards.first()).toBeVisible()
    await expect(cards.first().getByRole('img', { name: /Match score/ })).toBeVisible()
    await expect(cards.first().getByTestId('candidate-status')).toBeVisible()

    // Switching stage tab updates the URL and re-filters the list.
    if (tabCount > 1) {
      await stageTabs.nth(1).click()
      await expect(page).toHaveURL(/stageId=/)
    }
  } else {
    // No applications yet — the board shows the empty-state copy, not an error.
    await expect(
      page.getByText(/no candidates in this stage/i),
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

  // Conditional on seeded applications, like the board spec above: the E2E
  // account's Jobs carry a pipeline but applications arrive via later tickets
  // (#9/#11). When a card exists, the AI Analysis action must open the
  // profile dialog with its tabbed detail and a match score consistent with
  // the board; PDF download is exercised end-to-end.
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

  // Header: match badge consistent with the card's score ring (both render
  // the persisted final_score).
  const badgeText = await dialog.getByTestId('profile-match-score').innerText()
  const badgeScore = badgeText.match(/(\d+)/)?.[1]
  expect(ringLabel).toContain(`${badgeScore}`)

  // The tabbed detail renders: Overview is default; the other tabs switch.
  await expect(dialog.getByRole('tab', { name: 'Overview' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Requirement Analysis' }).click()
  await dialog.getByRole('tab', { name: 'Resume Data' }).click()
  await dialog.getByRole('tab', { name: 'Email' }).click()

  // PDF rendering: the download event fires with a .pdf file.
  const downloadPromise = page.waitForEvent('download')
  await dialog.getByTestId('profile-download-pdf').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.pdf$/)
})

test('candidate board is server-rendered on first paint (no client fetch)', async ({
  page,
}) => {
  await signIn(page)
  // Pick a Job and read its id from the URL.
  await page.getByTestId('job-card').first().click()
  await expect(page).toHaveURL(/jobId=/)
  const url = page.url()

  // HARD document GET to the held URL: the board must be present in the
  // server-rendered HTML itself (prefetched + dehydrated in the loader), not
  // fetched post-hydration.
  const response = await page.goto(url)
  expect(response).not.toBeNull()
  const html = (await response!.text()).toLowerCase()
  expect(html).toContain('data-testid="candidates-list"')
  expect(html).toContain('data-testid="stage-tab"')
})
