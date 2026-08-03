import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  LAYOUT_PARITY_VIEWPORT,
  signInAsMember,
} from './helpers'

/**
 * Layout-parity: Cross-job Candidates, Bulk Upload, Reachout Templates,
 * Form customization (#39 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source: ../talsek Candidates, BulkUpload, ReachoutTemplates, FormCustomization.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

async function openMemberSurface(page: Page, path: string, testId: string) {
  await signInAsMember(page)
  await page.goto(path)
  await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 15_000 })
}

test.describe('Candidates page layout parity', () => {
  test('filter chrome, export entry, and empty-prompt structure', async ({
    page,
  }) => {
    await openMemberSurface(page, '/candidates', 'candidates-page')

    const surface = page.getByTestId('candidates-page')
    const filters = page.getByTestId('candidates-filters')
    await expect(filters).toBeVisible()
    await expect(
      filters.getByRole('heading', { name: 'Filters', exact: true }),
    ).toBeVisible()
    await expect(filters.getByText('Search for candidates')).toBeVisible()

    await expect(page.getByTestId('filter-name')).toBeVisible()
    await expect(page.getByTestId('filter-job')).toBeVisible()
    await expect(page.getByTestId('filter-stage')).toBeVisible()
    await expect(page.getByTestId('filter-min-score')).toBeVisible()
    await expect(page.getByText('Starred only')).toBeVisible()
    await expect(page.getByText('Fulfilled non-negotiables')).toBeVisible()
    await expect(page.getByTestId('candidates-search')).toHaveText('Search')
    await expect(page.getByTestId('candidates-clear')).toHaveText('Clear')

    await expect(page.getByTestId('candidates-result-count')).toHaveText(
      'Candidates',
    )
    await expect(page.getByTestId('candidates-export')).toBeVisible()
    await expect(page.getByTestId('candidates-empty-prompt')).toContainText(
      /Set at least one filter and press Search/i,
    )

    // No page-level "Candidates" chrome heading — source is filters + results only.
    await expect(
      surface.getByRole('heading', { name: 'Candidates', exact: true }),
    ).toHaveCount(0)
  })

  test('search submits filters to URL and exposes results chrome', async ({
    page,
  }) => {
    await openMemberSurface(page, '/candidates', 'candidates-page')

    const nameInput = page.getByTestId('filter-name')
    await nameInput.click()
    await nameInput.fill('')
    await nameInput.pressSequentially('zzzz-layout-parity-no-match', {
      delay: 15,
    })
    await expect(nameInput).toHaveValue('zzzz-layout-parity-no-match')
    await expect(page.getByTestId('candidates-search')).toBeEnabled({
      timeout: 10_000,
    })
    await page.getByTestId('candidates-search').click()

    await expect(page).toHaveURL(/name=zzzz-layout-parity-no-match/)
    await expect(page.getByTestId('candidates-empty-prompt')).toHaveCount(0)
    await expect(page.getByTestId('candidates-result-count')).toContainText(
      /candidates? found/i,
    )
    await expect(page.getByTestId('candidates-export')).toBeVisible()

    await page.getByTestId('candidates-clear').click()
    await expect(page).toHaveURL(/\/candidates\/?$/)
    await expect(page.getByTestId('candidates-empty-prompt')).toBeVisible()
  })
})

test.describe('Bulk Upload layout parity', () => {
  test('Job & Files + Batch Status chrome without page title', async ({
    page,
  }) => {
    await openMemberSurface(page, '/bulk-upload', 'bulk-upload-page')

    const surface = page.getByTestId('bulk-upload-page')

    // Source has no page H1 — cards only under p-6.
    await expect(
      surface.getByRole('heading', { name: /bulk upload/i }),
    ).toHaveCount(0)

    const jobFiles = page.getByTestId('bulk-upload-job-files')
    await expect(jobFiles).toBeVisible()
    await expect(jobFiles.getByText('Job & Files', { exact: true })).toBeVisible()
    await expect(page.getByText('Target Job')).toBeVisible()
    await expect(page.getByTestId('bulk-upload-job-select')).toBeVisible()
    await expect(page.getByTestId('bulk-upload-dropzone')).toContainText(
      /Click to choose files or drop them here/i,
    )

    const batch = page.getByTestId('bulk-upload-batch-status')
    await expect(batch).toBeVisible()
    await expect(batch.getByText('Batch Status', { exact: true })).toBeVisible()
    await expect(batch.getByRole('button', { name: 'Clear' })).toBeVisible()
    await expect(page.getByTestId('bulk-upload-analyze')).toHaveText('Analyze')

    const table = page.getByTestId('bulk-upload-table')
    await expect(table.locator('th', { hasText: 'File' }).first()).toBeVisible()
    await expect(table.getByText('Email', { exact: true })).toBeVisible()
    await expect(table.locator('th', { hasText: 'Status' })).toBeVisible()
    await expect(table.locator('th', { hasText: 'Message' })).toBeVisible()
    // Source table has no Size column.
    await expect(table.locator('th', { hasText: 'Size' })).toHaveCount(0)
    await expect(table).toContainText(/No files selected/i)
  })
})

test.describe('Reachout Templates layout parity', () => {
  test('page header actions, tabs, and variable rail', async ({ page }) => {
    await openMemberSurface(
      page,
      '/reachout-templates',
      'reachout-templates-page',
    )

    const header = page.getByTestId('reachout-templates-header')
    await expect(
      header.getByRole('heading', {
        name: 'Reachout Templates',
        exact: true,
      }),
    ).toBeVisible()
    await expect(header.getByTestId('reset-template-interview')).toHaveText(
      /Reset to Default/i,
    )
    await expect(header.getByTestId('save-template-interview')).toHaveText(
      /Save Template/i,
    )

    await expect(
      page.getByRole('tab', { name: /Interview Shortlist/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: /Final Reachout/i }),
    ).toBeVisible()

    const interviewForm = page.getByTestId('reachout-template-form-interview')
    await expect(
      page.getByRole('heading', {
        name: 'Interview Shortlist Template',
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByLabel('Reply-To Email')).toBeVisible()
    await expect(page.getByLabel('Subject Line')).toBeVisible()
    await expect(page.getByLabel('Message Body')).toBeVisible()
    await expect(
      interviewForm.getByText('Available Variables', { exact: true }),
    ).toBeVisible()
    // Actions live in the page header, not under the form body.
    await expect(
      interviewForm.getByRole('button', { name: /Save Template/i }),
    ).toHaveCount(0)

    await page.getByRole('tab', { name: /Final Reachout/i }).click()
    await expect(header.getByTestId('save-template-final')).toBeVisible()
    await expect(header.getByTestId('reset-template-final')).toBeVisible()
    const finalForm = page.getByTestId('reachout-template-form-final')
    await expect(
      page.getByRole('heading', {
        name: 'Final Reachout Template',
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      finalForm.getByText('Available Variables', { exact: true }),
    ).toBeVisible()
  })
})

test.describe('Form customization layout parity', () => {
  test('header Cancel/Save and Questions / Live Preview split', async ({
    page,
  }) => {
    await openMemberSurface(page, '/form-settings', 'form-settings-page')

    await expect(
      page.getByRole('heading', {
        name: 'Customize Application Form',
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('form-settings-cancel')).toHaveText('Cancel')
    await expect(page.getByTestId('form-settings-save')).toContainText(
      /Save Form Template/i,
    )

    await expect(page.getByTestId('form-settings-questions-pane')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Questions', exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('form-question-builder')).toBeVisible()

    await expect(page.getByTestId('form-settings-preview-pane')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Live Preview', exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('form-preview')).toBeVisible()
  })
})
