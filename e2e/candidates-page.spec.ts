import { test, expect } from '@playwright/test'
import type { Download, Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Cross-job Candidates page (#27): filters compose with a result count;
 * Excel and PDF-ZIP exports download. Playwright suite is paused for the
 * port-completion batch — this spec is written for when E2E is re-enabled.
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function openCandidatesPage(page: Page) {
  await page.getByTestId('candidates-nav').click()
  await expect(page).toHaveURL(/\/candidates/)
  await expect(page.getByTestId('candidates-page')).toBeVisible()
  await expect(page.getByTestId('candidates-filters')).toBeVisible()
}

async function expectDownload(
  downloadPromise: Promise<Download>,
  extension: string,
) {
  const download = await downloadPromise
  const suggested = download.suggestedFilename()
  expect(suggested.toLowerCase().endsWith(extension)).toBe(true)
  const target = path.join(
    test.info().outputDir,
    suggested || `download${extension}`,
  )
  await download.saveAs(target)
  expect(fs.existsSync(target)).toBe(true)
  expect(fs.statSync(target).size).toBeGreaterThan(0)
  return download
}

test('Candidates page is reachable from the sidebar and filters drive a result count', async ({
  page,
}) => {
  await signIn(page)
  await openCandidatesPage(page)

  await expect(page.getByTestId('candidates-empty-prompt')).toBeVisible()
  await expect(page.getByTestId('candidates-result-count')).toHaveText(
    'Candidates',
  )

  // Compose filters: name + starred (at least one required).
  await page.getByTestId('filter-name').fill('a')
  await page.getByTestId('filter-starred').click()
  await page.getByTestId('candidates-search').click()

  await expect(page).toHaveURL(/name=a/)
  await expect(page).toHaveURL(/starred=/)

  await expect(page.getByTestId('candidates-result-count')).toHaveText(
    /\d+ candidates? found/,
  )

  const countText = await page.getByTestId('candidates-result-count').innerText()
  const match = countText.match(/(\d+)/)
  expect(match).toBeTruthy()
  const count = Number(match![1])

  if (count === 0) {
    await expect(page.getByTestId('candidates-no-results')).toBeVisible()
  } else {
    await expect(page.getByTestId('candidate-cards')).toBeVisible()
    await expect(page.getByTestId('candidate-card').first()).toBeVisible()
  }

  await page.getByTestId('candidates-clear').click()
  await expect(page.getByTestId('candidates-empty-prompt')).toBeVisible()
  await expect(page).toHaveURL(/\/candidates\/?$/)
})

test('Excel and PDF-ZIP export download the filtered set', async ({ page }) => {
  await signIn(page)
  await openCandidatesPage(page)

  // Broad name filter to maximize chance of results on the E2E account.
  await page.getByTestId('filter-name').fill('a')
  await page.getByTestId('candidates-search').click()
  await expect(page.getByTestId('candidates-result-count')).toHaveText(
    /\d+ candidates? found/,
  )

  const countText = await page.getByTestId('candidates-result-count').innerText()
  const count = Number(countText.match(/(\d+)/)?.[1] ?? 0)
  if (count === 0) {
    await expect(page.getByTestId('candidates-no-results')).toBeVisible()
    // Export stays disabled with zero results — still assert the control.
    await expect(page.getByTestId('candidates-export')).toBeDisabled()
    return
  }

  await expect(page.getByTestId('candidates-export')).toBeEnabled()

  const excelDownload = page.waitForEvent('download')
  await page.getByTestId('candidates-export').click()
  await page.getByTestId('candidates-export-excel').click()
  await expectDownload(excelDownload, '.xlsx')
  await expect(page.getByTestId('candidates-export-status')).toContainText(
    /Exported .* Excel/i,
  )

  const zipDownload = page.waitForEvent('download', { timeout: 120_000 })
  await page.getByTestId('candidates-export').click()
  await page.getByTestId('candidates-export-zip').click()
  await expectDownload(zipDownload, '.zip')
  await expect(page.getByTestId('candidates-export-status')).toContainText(
    /Exported .* ZIP/i,
  )
})
