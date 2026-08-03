import { test, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import {
  LAYOUT_PARITY_VIEWPORT,
  signInAsMember,
} from './helpers'

/**
 * Layout-parity: Team/Users (+ member detail), Billing, Get Started
 * (#40 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source: ../talsek Users, UserDetails, Billing, GetStarted.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

async function openMemberSurface(page: Page, path: string, testId: string) {
  await signInAsMember(page)
  await page.goto(path)
  await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
}

/** Click until a dialog/sheet appears — first click can be swallowed mid-hydrate. */
async function openDialogByTestId(
  page: Page,
  triggerTestId: string,
  dialog: Locator,
) {
  const trigger = page.getByTestId(triggerTestId)
  await expect(trigger).toBeEnabled()
  for (let attempt = 0; attempt < 3; attempt++) {
    await trigger.click()
    try {
      await expect(dialog).toBeVisible({ timeout: 3_000 })
      return
    } catch {
      // retry
    }
  }
  await expect(dialog).toBeVisible({ timeout: 10_000 })
}

test.describe('Team / Users layout parity', () => {
  test('header, invite CTA, search/refresh, and member table chrome', async ({
    page,
  }) => {
    await openMemberSurface(page, '/users', 'team-page')

    const surface = page.getByTestId('team-page')
    await expect(
      surface.getByRole('heading', { name: 'Team', exact: true }),
    ).toBeVisible()
    await expect(surface).toContainText(
      /Manage workspace access, roles, and permissions/i,
    )
    await expect(page.getByTestId('invite-member-button')).toHaveText(
      /Invite Member/i,
    )

    await expect(page.getByTestId('team-search')).toBeVisible()
    await expect(page.getByTestId('team-search')).toHaveAttribute(
      'placeholder',
      /Search by name, email, role, or status/i,
    )
    await expect(page.getByTestId('team-refresh')).toHaveText(/Refresh/i)

    const table = page.getByTestId('team-table')
    await expect(table).toBeVisible()
    for (const col of ['Name', 'Email', 'Role', 'Status', 'Actions']) {
      await expect(table.locator('th', { hasText: col })).toBeVisible()
    }
  })

  test('Invite Member opens dialog; Manage navigates to member detail', async ({
    page,
  }) => {
    await openMemberSurface(page, '/users', 'team-page')

    const inviteDialog = page.getByTestId('invite-member-modal')
    await openDialogByTestId(page, 'invite-member-button', inviteDialog)
    await expect(inviteDialog.getByText(/Invite a team member/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(inviteDialog).toBeHidden()

    const manage = page.locator('[data-testid^="manage-member-"]').first()
    await expect(manage).toBeVisible()
    await expect(manage).toHaveText(/Manage/i)
    await manage.click()
    await expect(page).toHaveURL(/\/users\/[^/]+/)
    await expect(page.getByTestId('member-detail-page')).toBeVisible()
  })

  test('member detail: back, Workspace Permissions, toggles, save chrome', async ({
    page,
  }) => {
    await openMemberSurface(page, '/users', 'team-page')

    await page.locator('[data-testid^="manage-member-"]').first().click()
    await expect(page.getByTestId('member-detail-page')).toBeVisible()

    await expect(page.getByTestId('back-to-team')).toBeVisible()
    await expect(page.getByTestId('member-detail-name')).toBeVisible()
    // Role badge is present for loaded members (Admin or Member).
    await expect(
      page.getByTestId('member-detail-page').getByText(/^(Admin|Member)$/),
    ).toBeVisible()

    const perms = page.getByTestId('member-permissions-card')
    await expect(perms).toBeVisible()
    // CardTitle is a div in both source and port — assert visible label text.
    await expect(perms.getByText('Workspace Permissions', { exact: true })).toBeVisible()
    await expect(perms).toContainText(
      /Toggle permissions to reflect the member/i,
    )

    // Source: each permission is its own bordered row (not one shared box).
    const rows = page.getByTestId('permission-row')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThanOrEqual(4)

    await expect(page.getByTestId('permissions-reset')).toHaveText(/Reset/i)
    await expect(page.getByTestId('permissions-save')).toHaveText(
      /Save Changes/i,
    )
    // Actions sit below the permissions card, not inside CardContent footer.
    await expect(
      perms.getByTestId('permissions-save'),
    ).toHaveCount(0)

    await page.getByTestId('back-to-team').click()
    await expect(page).toHaveURL(/\/users\/?$/)
    await expect(page.getByTestId('team-page')).toBeVisible()
  })
})

test.describe('Billing layout parity', () => {
  test('tabs, Current Plan, View all Plans sheet, top-up grid', async ({
    page,
  }) => {
    await openMemberSurface(page, '/billing', 'billing-page')

    const surface = page.getByTestId('billing-page')
    // Source has no page-level Billing H1 — tabs are the chrome.
    await expect(
      surface.getByRole('heading', { name: 'Billing', exact: true }),
    ).toHaveCount(0)

    await expect(page.getByTestId('billing-tab')).toBeVisible()
    await expect(page.getByTestId('usage-tab')).toBeVisible()
    await expect(page.getByTestId('invoices-tab')).toBeVisible()

    await expect(page.getByTestId('current-plan-card')).toBeVisible()
    await expect(
      page.getByTestId('current-plan-card').getByText('Current Plan', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByTestId('view-plans-button')).toHaveText(
      /View all Plans/i,
    )

    const topupGrid = page.getByTestId('billing-topup-grid')
    await expect(topupGrid).toBeVisible()
    await expect(page.getByTestId('add-credits-card')).toBeVisible()
    await expect(page.getByTestId('auto-refill-card')).toBeVisible()

    await expect(page.getByText('Credit Costs', { exact: true })).toBeVisible()
    await expect(page.getByText('Resume Screening', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Screening Interview', { exact: true }),
    ).toBeVisible()

    const plansSheet = page.getByRole('dialog')
    await openDialogByTestId(page, 'view-plans-button', plansSheet)
    await expect(
      plansSheet.getByText('Choose Your Plan', { exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('plans-sheet')).toBeAttached()
    await expect(plansSheet.getByTestId('view-full-pricing')).toBeVisible()
    await expect(
      plansSheet.getByTestId('plan-card-pay-as-you-go'),
    ).toBeVisible()
    await expect(plansSheet.getByTestId('plan-card-tier-1')).toBeVisible()
    await expect(plansSheet.getByTestId('plan-card-enterprise')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(plansSheet).toBeHidden()
  })

  test('Usage and Invoices tab regions and invoice PDF control', async ({
    page,
  }) => {
    await openMemberSurface(page, '/billing', 'billing-page')

    await page.getByTestId('usage-tab').click()
    const usage = page.getByTestId('usage-panel')
    await expect(usage).toBeVisible()
    await expect(usage.getByText('Wallet Balance', { exact: true })).toBeVisible()
    await expect(
      usage.getByText('Credits Used (14 days)', { exact: true }),
    ).toBeVisible()
    await expect(usage.getByText('Active Jobs', { exact: true })).toBeVisible()
    await expect(
      usage.getByText('Daily Credit Usage', { exact: true }),
    ).toBeVisible()
    await expect(
      usage.getByText('Usage by Category', { exact: true }),
    ).toBeVisible()
    await expect(
      usage.getByText('Credits Used per Job', { exact: true }),
    ).toBeVisible()

    await page.getByTestId('invoices-tab').click()
    const invoices = page.getByTestId('invoices-panel')
    await expect(invoices).toBeVisible()
    await expect(
      invoices.getByText('Invoice History', { exact: true }),
    ).toBeVisible()

    await expect(invoices.getByText('Loading payments...')).toHaveCount(0, {
      timeout: 15_000,
    })
    const pdfBtn = page.locator('[data-testid^="download-invoice-"]').first()
    if ((await pdfBtn.count()) > 0) {
      await expect(pdfBtn).toContainText(/PDF/i)
    } else {
      await expect(invoices).toContainText(/No invoices yet/i)
    }
  })

  test('Enterprise Contact Sales opens booking dialog', async ({ page }) => {
    await openMemberSurface(page, '/billing', 'billing-page')

    const plansSheet = page.getByRole('dialog')
    await openDialogByTestId(page, 'view-plans-button', plansSheet)

    const contact = plansSheet.getByTestId('plan-action-contact_sales')
    test.skip(
      !(await contact.isVisible().catch(() => false)),
      'Contact Sales only when not already on Enterprise cancel state',
    )
    await contact.click()
    await expect(page.getByTestId('cal-booking-dialog')).toBeVisible({
      timeout: 10_000,
    })
  })
})

test.describe('Get Started layout parity', () => {
  test('checklist hub: header, progress, steps, CTAs', async ({ page }) => {
    await signInAsMember(page)
    await page.evaluate(() =>
      window.localStorage.removeItem('onboarding_state'),
    )
    await page.goto('/get-started')
    await expect(page.getByTestId('get-started-page')).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'Welcome to Talsek', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Let's get you set up/i }),
    ).toBeVisible()

    const checklist = page.getByTestId('onboarding-checklist')
    await expect(checklist).toBeVisible()
    await expect(checklist.getByText('Your Progress')).toBeVisible()
    await expect(page.getByTestId('onboarding-progress')).toBeVisible()

    const stepIds = [
      'customize-form',
      'reachout-templates',
      'add-team',
      'add-credits',
      'create-job',
    ] as const
    for (const id of stepIds) {
      const item = page.getByTestId(`checklist-item-${id}`)
      await expect(item).toBeVisible()
      await expect(page.getByTestId(`checklist-link-${id}`)).toBeVisible()
      await expect(page.getByTestId(`checklist-toggle-${id}`)).toBeVisible()
    }

    await page.getByTestId('checklist-toggle-customize-form').click()
    await expect(
      page.getByTestId('checklist-item-customize-form'),
    ).toHaveAttribute('data-completed', 'true')

    await page.getByTestId('checklist-link-add-team').click()
    await expect(page).toHaveURL(/\/users/)
  })

  test('completed checklist shows Dashboard Hub action cards', async ({
    page,
  }) => {
    await signInAsMember(page)
    await page.evaluate(() => {
      window.localStorage.setItem(
        'onboarding_state',
        JSON.stringify([
          'customize-form',
          'reachout-templates',
          'add-team',
          'add-credits',
          'create-job',
        ]),
      )
    })
    await page.goto('/get-started')
    await expect(page.getByTestId('get-started-page')).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'Dashboard Hub', exact: true }),
    ).toBeVisible()
    const hub = page.getByTestId('action-hub')
    await expect(hub).toBeVisible()
    await expect(
      hub.getByRole('heading', { name: 'Quick Links', exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('action-hub-create-job')).toBeVisible()
    await expect(page.getByTestId('action-hub-candidates')).toBeVisible()
    await expect(page.getByTestId('action-hub-team')).toBeVisible()
    await expect(page.getByTestId('action-hub-billing')).toBeVisible()

    await page.getByTestId('action-hub-billing').click()
    await expect(page).toHaveURL(/\/billing/)
  })
})
