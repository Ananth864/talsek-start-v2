import { test, expect } from '@playwright/test'

/**
 * Jobs list + detail + search (ticket #4).
 * Uses E2E_EMAIL / E2E_PASSWORD (a real Member with Jobs in the Supabase project).
 */
test('member sees the Jobs list and can open a Job detail', async ({
  page,
}) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()

  const jobsList = page.getByTestId('jobs-list')
  await expect(jobsList).toBeVisible()
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()

  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)
  await firstJob.getByTestId('open-job-details').click()
  await expect(page.getByTestId('job-detail')).toBeVisible()
  await expect(page.getByTestId('job-detail')).toContainText(/.+/)
})

test('job search filters the Jobs list', async ({ page }) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByRole('heading', { name: 'Your Jobs' })).toBeVisible()

  // Search starts collapsed (icon button); expand before filling.
  await page.getByTestId('jobs-search-toggle').click()
  await page.getByTestId('jobs-search-input').fill('zzzz-no-such-job-zzzz')
  await expect(page.getByTestId('jobs-list')).toBeVisible()
  await expect(page.getByText(/no jobs match your search/i)).toBeVisible()
})
