import { test, expect } from '@playwright/test'

/**
 * Characterisation spec for the Jobs-list journey (ticket #4).
 * Same capture-against-source technique as the auth specs: authored to the
 * source app's behaviour, replayed against the new app. Uses E2E_EMAIL /
 * E2E_PASSWORD (a real Member with real Jobs in the Supabase project).
 */
test('member sees the SSR Jobs list and can open a Job detail', async ({
  page,
}) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle') // let the client hydrate before interacting

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  // SSR first paint: the Jobs list and at least one Job are present without a
  // client waterfall.
  const jobsList = page.getByTestId('jobs-list')
  await expect(jobsList).toBeVisible()
  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible()

  // Selecting a Job carries ?jobId= and opens its detail context.
  await firstJob.click()
  await expect(page).toHaveURL(/jobId=/)
  await expect(page.getByTestId('job-detail')).toBeVisible()
})

test('job search filters the Jobs list', async ({ page }) => {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()

  // A nonsense term collapses the list to the empty state.
  await page.getByLabel('Search jobs').fill('zzzz-no-such-job-zzzz')
  await expect(page.getByTestId('jobs-list')).toBeVisible()
  await expect(page.getByText(/no jobs match your search/i)).toBeVisible()
})

test('Jobs list is server-rendered on first paint (no client fetch)', async ({
  page,
}) => {
  // Establish the auth session via the UI, then perform a HARD document GET to
  // /dashboard. The Jobs list must be present in the server-rendered HTML
  // itself (prefetched + dehydrated in the loader), proving SSR first paint
  // rather than a post-hydration client fetch.
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  const response = await page.goto('/dashboard')
  expect(response).not.toBeNull()
  const html = (await response!.text()).toLowerCase()
  // A Job card is only emitted when the loader's prefetched data rendered SSR-side.
  expect(html).toContain('data-testid="job-card"')
})

