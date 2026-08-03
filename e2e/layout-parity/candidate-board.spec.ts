import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  LAYOUT_PARITY_VIEWPORT,
  signInAsMember,
} from './helpers'

/**
 * Layout-parity: Candidate board structure + interaction (#38 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source reference: ../talsek CandidatesList + StageTabs + CardActions +
 * CandidateProfileDialog + ShortlistConfirmationModal + bulk chrome.
 * Adaptive card consolidation (ADR-0027) is preserved.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

async function openBoard(page: Page) {
  await signInAsMember(page)

  const firstJob = page.getByTestId('job-card').first()
  await expect(firstJob).toBeVisible({ timeout: 15_000 })

  // Auto-select may already set jobId; click ensures the board mounts.
  await expect
    .poll(() => new URL(page.url()).searchParams.get('jobId'), {
      timeout: 15_000,
    })
    .toBeTruthy()
  await firstJob.click()

  const board = page.getByTestId('candidates-list')
  await expect(board).toBeVisible({ timeout: 15_000 })
  await expect(board.getByText(/Loading candidates/i)).toHaveCount(0, {
    timeout: 15_000,
  })
  return board
}

/** Prefer a Job/stage that already has Job Applications on the board. */
async function openBoardWithCards(
  page: Page,
  opts?: { requirePipelineActions?: boolean },
) {
  const board = await openBoard(page)
  const requirePipelineActions = opts?.requirePipelineActions ?? false

  const jobs = page.getByTestId('job-card')
  const jobCount = await jobs.count()

  for (let i = 0; i < jobCount; i++) {
    if (i > 0) {
      await jobs.nth(i).click()
      await expect(page.getByTestId('candidates-list')).toBeVisible({
        timeout: 15_000,
      })
      await expect(
        page.getByTestId('candidates-list').getByText(/Loading candidates/i),
      ).toHaveCount(0, { timeout: 15_000 })
    }

    const list = page.getByTestId('candidates-list')
    const stageCount = await list.getByTestId('stage-tab').count()

    for (let s = 0; s < stageCount; s++) {
      // Re-query tabs each pass — stage changes remount the rail.
      const tab = list.getByTestId('stage-tab').nth(s)
      if ((await tab.getAttribute('aria-selected')) !== 'true') {
        try {
          await tab.click({ timeout: 5_000 })
        } catch {
          continue
        }
        await expect(list.getByText(/Loading candidates/i)).toHaveCount(0, {
          timeout: 15_000,
        })
      }

      const cards = page.getByTestId('candidate-card')
      if ((await cards.count()) === 0) continue

      if (requirePipelineActions) {
        const actionable = cards.filter({
          has: page.getByTestId('candidate-card-actions'),
        })
        if ((await actionable.count()) === 0) continue
      }

      await expect(cards.first()).toBeVisible()
      return list
    }
  }

  test.skip(
    true,
    requirePipelineActions
      ? 'Needs a non-final stage card with Shortlist/Reject chrome'
      : 'Needs at least one Job Application on the board',
  )
  return board
}

test.describe('Candidate board layout parity', () => {
  test('board chrome: stage tabs share a row with Bulk Action and Filter', async ({
    page,
  }) => {
    const board = await openBoard(page)

    const header = board.getByTestId('candidates-board-header')
    await expect(header).toBeVisible()

    const tabs = header.getByTestId('stage-tabs')
    await expect(tabs).toBeVisible()
    await expect(tabs).toHaveAttribute('role', 'tablist')

    const stageTab = tabs.getByTestId('stage-tab').first()
    await expect(stageTab).toBeVisible()
    await expect(stageTab).toHaveAttribute('role', 'tab')

    await expect(header.getByTestId('bulk-action-menu')).toBeVisible()
    await expect(header.getByTestId('bulk-action-menu')).toHaveText(
      /Bulk Action/i,
    )
    await expect(header.getByTestId('fit-filter')).toBeVisible()
    await expect(header.getByTestId('fit-filter')).toContainText(/Filter/i)
    await expect(header.getByTestId('candidate-search')).toHaveCount(0)

    // Source chrome does not show aggregate counts above the card list.
    await expect(board.getByText(/candidates ·/i)).toHaveCount(0)
  })

  test('Bulk Action dropdown exposes Select to Shortlist / Reject', async ({
    page,
  }) => {
    await openBoard(page)

    await page.getByTestId('bulk-action-menu').click()
    const shortlist = page.getByTestId('bulk-shortlist-enter')
    const reject = page.getByTestId('bulk-reject-enter')
    await expect(shortlist).toBeVisible()
    await expect(shortlist).toContainText(/Select to Shortlist/i)
    await expect(reject).toBeVisible()
    await expect(reject).toContainText(/Select to Reject/i)

    const enter = (await shortlist.isEnabled())
      ? shortlist
      : (await reject.isEnabled())
        ? reject
        : null
    test.skip(
      !enter,
      'Needs a non-final Hiring Stage to enter bulk selection',
    )

    await enter!.click()
    const bar = page.getByTestId('bulk-action-confirm-bar')
    await expect(bar).toBeVisible()
    await expect(bar).toContainText(/selected/i)
    await expect(page.getByTestId('bulk-action-cancel')).toBeVisible()
    await expect(page.getByTestId('bulk-action-select-all')).toBeVisible()
    await expect(page.getByTestId('bulk-action-confirm')).toBeVisible()
  })

  test('Filter dropdown lists fit options with descriptions', async ({
    page,
  }) => {
    await openBoard(page)

    await page.getByTestId('fit-filter').click()
    await expect(page.getByTestId('fit-filter-all')).toBeVisible()
    await expect(page.getByTestId('fit-filter-all')).toContainText(
      /All Candidates/i,
    )
    await expect(page.getByTestId('fit-filter-all')).toContainText(
      /Active candidates only/i,
    )
    await expect(page.getByTestId('fit-filter-perfect_fit')).toContainText(
      /Perfect Fit/i,
    )
    await expect(page.getByTestId('fit-filter-rejected')).toContainText(
      /Rejected Candidates/i,
    )

    await page.getByTestId('fit-filter-rejected').click()
    await expect(page.getByTestId('fit-filter')).toHaveAttribute(
      'data-filter',
      'rejected',
    )
    await expect(page.getByTestId('fit-filter')).toContainText(/^Filter$/i)
  })

  test('list denseness and card key control order: AI → Shortlist → Reject', async ({
    page,
  }) => {
    await openBoardWithCards(page, { requirePipelineActions: true })

    const cards = page.getByTestId('candidate-cards')
    await expect(cards).toBeVisible()
    await expect(cards).toHaveAttribute('data-layout', /list|grid/)

    // Prefer list denseness for control-order asserts (account menu if needed).
    if ((await cards.getAttribute('data-layout')) === 'grid') {
      await page.getByTestId('account-menu-trigger').click()
      await page.getByTestId('candidate-view-toggle').click()
      await expect(cards).toHaveAttribute('data-layout', 'list')
    }

    const card = page
      .getByTestId('candidate-card')
      .filter({ has: page.getByTestId('candidate-card-actions') })
      .first()
    await expect(card).toBeVisible()

    await expect(card.getByTestId('candidate-star-toggle')).toBeVisible()
    await expect(card.getByTestId('candidate-view-profile')).toBeVisible()
    await expect(card.getByTestId('candidate-shortlist')).toBeVisible()
    await expect(card.getByTestId('candidate-reject')).toBeVisible()

    const actions = card.getByTestId('candidate-card-actions')
    await expect(actions).toBeVisible()
    const actionIds = await actions.evaluate((el) =>
      [...el.querySelectorAll('[data-testid]')]
        .map((node) => node.getAttribute('data-testid'))
        .filter(Boolean),
    )
    expect(actionIds).toEqual([
      'candidate-view-profile',
      'candidate-shortlist',
      'candidate-reject',
    ])

    // Resume lives under identity, not in the action row (source CandidateInfo).
    await expect(actions.getByText(/^Resume$/i)).toHaveCount(0)
  })

  test('profile dialog opens with source tab structure', async ({ page }) => {
    await openBoardWithCards(page)

    const card = page.getByTestId('candidate-card').first()
    await expect(card).toBeVisible()
    await card.getByTestId('candidate-view-profile').click()

    const dialog = page.getByTestId('candidate-profile-dialog')
    await expect(dialog).toBeVisible()

    const tabLabels = [
      'Overview',
      'Requirement Analysis',
      'Interview',
      'Resume Data',
      'Email',
    ]
    for (const label of tabLabels) {
      await expect(dialog.getByRole('tab', { name: label })).toBeVisible()
    }

    const tabs = dialog.getByRole('tab')
    const names = await tabs.allTextContents()
    expect(names.map((n) => n.trim())).toEqual(tabLabels)
  })

  test('Shortlist confirmation dialog interaction shape', async ({ page }) => {
    await openBoardWithCards(page, { requirePipelineActions: true })

    const card = page
      .getByTestId('candidate-card')
      .filter({ has: page.getByTestId('candidate-shortlist') })
      .first()
    await expect(card).toBeVisible()

    const shortlist = card.getByTestId('candidate-shortlist')
    test.skip(
      !(await shortlist.isEnabled()),
      'Needs an enabled Shortlist control (permission + next stage)',
    )

    await shortlist.click()

    // Template setup may appear first; close path still exercises open.
    const setup = page.getByTestId('shortlist-template-setup-dialog')
    const confirm = page.getByTestId('candidate-shortlist-dialog')
    await expect(setup.or(confirm)).toBeVisible()

    if (await setup.isVisible()) {
      await expect(
        setup.getByRole('button', { name: /save|cancel/i }).first(),
      ).toBeVisible()
      return
    }

    await expect(
      confirm.getByRole('heading', { name: /Shortlist Candidate/i }),
    ).toBeVisible()
    await expect(confirm.getByTestId('shortlist-subject')).toBeVisible()
    await expect(confirm.getByTestId('shortlist-body')).toBeVisible()
    await expect(
      confirm.getByRole('button', { name: /^Cancel$/i }),
    ).toBeVisible()
    await expect(confirm.getByTestId('candidate-shortlist-confirm')).toHaveText(
      /Send Reachout/i,
    )
  })

  test('Reject confirmation dialog interaction shape', async ({ page }) => {
    await openBoardWithCards(page, { requirePipelineActions: true })

    const card = page
      .getByTestId('candidate-card')
      .filter({ has: page.getByTestId('candidate-reject') })
      .first()
    await expect(card).toBeVisible()

    await card.getByTestId('candidate-reject').click()
    const dialog = page.getByTestId('candidate-reject-dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: /Reject Candidate/i }),
    ).toBeVisible()
    await expect(dialog).toContainText(/disappear/i)
    await expect(
      dialog.getByRole('button', { name: /^Cancel$/i }),
    ).toBeVisible()
    await expect(dialog.getByTestId('candidate-reject-confirm')).toHaveText(
      /Yes, Reject/i,
    )
  })
})
