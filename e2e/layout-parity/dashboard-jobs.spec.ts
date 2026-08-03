import { test, expect } from '@playwright/test'
import {
  LAYOUT_PARITY_VIEWPORT,
  signInAsMember,
} from './helpers'

/**
 * Layout-parity: Dashboard / Jobs board structure + interaction (#37 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source reference: ../talsek Dashboard + JobsList + JobCreationDialog + JobDetails.
 * Job wizard stays 2-step (ADR-0029); asserts interaction shape, not 4-step restore.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

test.describe('Dashboard / jobs layout parity', () => {
  test('jobs panel hierarchy: Your Jobs, search, create CTA, list denseness', async ({
    page,
  }) => {
    await signInAsMember(page)

    // Source DashboardPageMain is p-0 — no chrome "Jobs" page header.
    await expect(
      page.locator('main').getByRole('heading', { name: 'Jobs', exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Your Jobs', exact: true }),
    ).toBeVisible()

    const panel = page.getByTestId('jobs-panel')
    await expect(panel).toBeVisible()
    await expect(page.getByTestId('jobs-search-toggle')).toBeVisible()
    await expect(page.getByTestId('jobs-panel-collapse')).toBeVisible()

    const createJob = page.getByTestId('create-job-button')
    await expect(createJob).toBeVisible()
    await expect(createJob).toHaveText(/Add New Job|Permission Required/)

    await expect(page.getByTestId('jobs-list')).toBeVisible()
  })

  test('job card exposes applicants, PR/NN, copy/edit affordances', async ({
    page,
  }) => {
    await signInAsMember(page)

    const card = page.getByTestId('job-card').first()
    await expect(card).toBeVisible()

    await expect(card.getByTestId('job-card-applicants')).toContainText(
      /applicants/i,
    )
    await expect(card.getByText('PR', { exact: true })).toBeVisible()
    await expect(card.getByText('NN', { exact: true })).toBeVisible()

    // Status badge / Form on|off are not source card chrome.
    await expect(card.getByTestId('job-card-status')).toHaveCount(0)
    await expect(card.getByText(/Form on|Form off/i)).toHaveCount(0)

    await expect(card.getByTestId('open-job-details')).toBeVisible()

    // Copy controls are conditional on email / form link; assert order when present.
    const actions = card.getByTestId('job-card-actions')
    await expect(actions).toBeVisible()
    const actionIds = await actions.evaluate((el) =>
      [...el.querySelectorAll('[data-testid]')]
        .map((node) => node.getAttribute('data-testid'))
        .filter(Boolean),
    )
    const expectedOrder = [
      'copy-forwarding-email',
      'copy-apply-link',
      'open-job-details',
    ].filter((id) => actionIds.includes(id))
    expect(actionIds.filter((id) => expectedOrder.includes(id!))).toEqual(
      expectedOrder,
    )
  })

  test('search expands from icon and filters the jobs list', async ({
    page,
  }) => {
    await signInAsMember(page)

    await expect(page.getByLabel('Search jobs')).toHaveCount(0)
    await page.getByTestId('jobs-search-toggle').click()
    const search = page.getByLabel('Search jobs')
    await expect(search).toBeVisible()
    await search.fill('zzzz-no-such-job-zzzz')
    await expect(page.getByTestId('jobs-list')).toContainText(
      /No jobs match your search/i,
    )
    await expect(page).toHaveURL(/jobSearch=zzzz-no-such-job-zzzz/)
  })

  test('jobs panel collapses to icon rail and expands again', async ({
    page,
  }) => {
    await signInAsMember(page)

    const panel = page.getByTestId('jobs-panel')
    const expandedWidth = await panel.evaluate(
      (el) => el.getBoundingClientRect().width,
    )
    expect(expandedWidth).toBeGreaterThanOrEqual(240)

    await page.getByTestId('jobs-panel-collapse').click()
    await expect
      .poll(async () => panel.evaluate((el) => el.getBoundingClientRect().width))
      .toBeLessThanOrEqual(80)
    await expect(
      page.getByRole('heading', { name: 'Your Jobs', exact: true }),
    ).toBeHidden()
    await expect(page.getByTestId('create-job-collapsed')).toBeVisible()

    await page.getByTestId('jobs-panel-collapse').click()
    await expect
      .poll(async () => panel.evaluate((el) => el.getBoundingClientRect().width))
      .toBeGreaterThanOrEqual(240)
    await expect(
      page.getByRole('heading', { name: 'Your Jobs', exact: true }),
    ).toBeVisible()
  })

  test('selecting a job card updates jobId without opening details', async ({
    page,
  }) => {
    await signInAsMember(page)

    const cards = page.getByTestId('job-card')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    test.skip(count < 2, 'Needs at least two Jobs to switch selection')

    const beforeId = new URL(page.url()).searchParams.get('jobId')
    expect(beforeId).toBeTruthy()

    await cards.nth(1).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('jobId'))
      .not.toBe(beforeId)
    await expect(page.getByTestId('job-detail')).toHaveCount(0)
  })

  test('create-job opens dialog with 2-step primary actions', async ({
    page,
  }) => {
    await signInAsMember(page)

    await page.getByTestId('create-job-button').click()
    const dialog = page.getByTestId('job-creation-dialog')
    await expect(dialog).toBeVisible()

    await expect(dialog.getByTestId('job-creation-step')).toContainText(
      /Step 1 of 2/i,
    )
    await expect(
      dialog.getByRole('heading', { name: /Job Details|Select Screening/i }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: /^Cancel$/i }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: /Parse & review|Next/i }),
    ).toBeVisible()
  })

  test('job-details pencil opens Edit Requirements entry point', async ({
    page,
  }) => {
    await signInAsMember(page)

    const card = page.getByTestId('job-card').first()
    await expect(card).toBeVisible()
    await card.getByTestId('open-job-details').click()

    const detail = page.getByTestId('job-detail')
    await expect(detail).toBeVisible()
    await expect(detail.getByTestId('edit-job-requirements')).toBeVisible()
    await expect(detail.getByTestId('edit-job-requirements')).toHaveText(
      'Edit Requirements',
    )
  })
})
