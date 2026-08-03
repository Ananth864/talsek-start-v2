import { test, expect } from '@playwright/test'
import type { Locator } from '@playwright/test'
import {
  LAYOUT_PARITY_VIEWPORT,
  signInAsMember,
} from './helpers'

/**
 * Layout-parity: Member shell structure + interaction (spec #34 / ticket #36).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source reference: ../talsek DashboardLayout + DashboardSidebar.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

const CORE_NAV_ORDER = [
  'get-started-nav',
  'dashboard-nav',
  'form-settings-nav',
  'reachout-templates-nav',
  'bulk-upload-nav',
  'candidates-nav',
] as const

const ADMIN_NAV_ORDER = ['team-nav', 'billing-nav'] as const
const NAV_ORDER = [...CORE_NAV_ORDER, ...ADMIN_NAV_ORDER] as const

const ACCOUNT_MENU_ITEM_TESTIDS = [
  'theme-toggle',
  'candidate-view-toggle',
  'notifications-nav',
  'sign-out',
] as const

async function orderedTestIds(root: Locator, ids: readonly string[]) {
  return root.evaluate((el, testIds) => {
    return testIds
      .map((id) => {
        const node = el.querySelector(`[data-testid="${id}"]`)
        if (!node) return null
        return { id, top: node.getBoundingClientRect().top }
      })
      .filter((entry): entry is { id: string; top: number } => entry !== null)
      .sort((a, b) => a.top - b.top)
      .map((entry) => entry.id)
  }, [...ids])
}

test.describe('Member shell layout parity', () => {
  test('sidebar regions, core nav order, and docs guide are present', async ({
    page,
  }) => {
    await signInAsMember(page)

    const sidebar = page.getByTestId('member-sidebar')
    await expect(sidebar).toBeVisible()

    // Visible regions via public chrome — not shadcn data-sidebar internals.
    await expect(sidebar.getByText('Talsek', { exact: true })).toBeVisible()
    await expect(page.getByTestId('sidebar-trigger')).toBeVisible()
    await expect(page.getByTestId('dashboard-nav')).toBeVisible()
    await expect(page.getByTestId('docs-guide-link')).toBeVisible()
    await expect(page.getByTestId('account-menu-trigger')).toBeVisible()

    // No global top app bar on desktop (source DashboardLayout denseness).
    await expect(page.getByTestId('sidebar-trigger-mobile')).toBeHidden()

    const navTestIds = await orderedTestIds(sidebar, NAV_ORDER)
    expect(navTestIds).toEqual([...NAV_ORDER])

    await expect(page.getByTestId('docs-guide-link')).toContainText(/Guide$/)
  })

  test('sidebar collapses to icon rail and expands again', async ({ page }) => {
    await signInAsMember(page)

    const sidebar = page.getByTestId('member-sidebar')

    const expandedWidth = await sidebar.evaluate(
      (el) => el.getBoundingClientRect().width,
    )
    // Source: 14rem (224px) expanded
    expect(expandedWidth).toBeGreaterThanOrEqual(216)
    expect(expandedWidth).toBeLessThanOrEqual(232)

    await page.getByTestId('sidebar-trigger').click()

    // Width transition is 200ms — poll until the icon rail settles.
    await expect
      .poll(async () =>
        sidebar.evaluate((el) => el.getBoundingClientRect().width),
      )
      .toBeLessThanOrEqual(56)
    const collapsedWidth = await sidebar.evaluate(
      (el) => el.getBoundingClientRect().width,
    )
    // Source: 3rem (48px) icon rail
    expect(collapsedWidth).toBeGreaterThanOrEqual(40)
    expect(collapsedWidth).toBeLessThanOrEqual(56)

    // Labels hide in icon mode; brand wordmark is not shown
    await expect(sidebar.getByText('Talsek', { exact: true })).toBeHidden()
    await expect(sidebar.getByTestId('dashboard-nav')).toBeVisible()

    await page.getByTestId('sidebar-trigger').click()
    await expect
      .poll(async () =>
        sidebar.evaluate((el) => el.getBoundingClientRect().width),
      )
      .toBeGreaterThanOrEqual(216)
    await expect(sidebar.getByText('Talsek', { exact: true })).toBeVisible()
  })

  test('nav active state follows the current Member route', async ({ page }) => {
    await signInAsMember(page)

    const dashboardNav = page.getByTestId('dashboard-nav')
    await expect(dashboardNav).toHaveAttribute('data-active', 'true')

    await page.getByTestId('get-started-nav').click()
    await expect(page).toHaveURL(/\/get-started/)
    await expect(page.getByTestId('get-started-nav')).toHaveAttribute(
      'data-active',
      'true',
    )
    await expect(page.getByTestId('dashboard-nav')).not.toHaveAttribute(
      'data-active',
      'true',
    )

    await page.getByTestId('candidates-nav').click()
    await expect(page).toHaveURL(/\/candidates/)
    await expect(page.getByTestId('candidates-nav')).toHaveAttribute(
      'data-active',
      'true',
    )
  })

  test('account menu opens with source-ordered items and notifications path', async ({
    page,
  }) => {
    await signInAsMember(page)

    const trigger = page.getByTestId('account-menu-trigger')
    const companyName = (
      await trigger.locator('div.truncate span').first().textContent()
    )?.trim()
    const companyEmail = (
      await trigger.locator('div.truncate span').nth(1).textContent()
    )?.trim()
    expect(companyName && companyName.length > 1).toBe(true)
    expect(companyEmail).toMatch(/@/)

    await trigger.click()
    const menu = page.getByTestId('account-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByText(companyName!, { exact: true })).toBeVisible()
    await expect(menu.getByText(companyEmail!, { exact: true })).toBeVisible()

    for (const id of ACCOUNT_MENU_ITEM_TESTIDS) {
      await expect(menu.getByTestId(id)).toBeVisible()
    }

    const orderedIds = await orderedTestIds(menu, ACCOUNT_MENU_ITEM_TESTIDS)
    expect(orderedIds).toEqual([...ACCOUNT_MENU_ITEM_TESTIDS])

    await expect(menu.getByTestId('theme-toggle')).toContainText(
      /Switch to (Dark|Light) Mode/,
    )
    await expect(menu.getByTestId('candidate-view-toggle')).toContainText(
      /Switch to (List|Grid) View/,
    )
    await expect(menu.getByTestId('notifications-nav')).toHaveText(
      'Notifications',
    )
    await expect(menu.getByTestId('sign-out')).toHaveText('Sign Out')

    await menu.getByTestId('notifications-nav').click()
    await expect(page.getByTestId('notifications-dialog')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Email Notification Settings' }),
    ).toBeVisible()
  })

  test('primary Create Job CTA sits on the dashboard, not in the sidebar', async ({
    page,
  }) => {
    await signInAsMember(page)

    const sidebar = page.getByTestId('member-sidebar')
    await expect(sidebar.getByTestId('create-job-button')).toHaveCount(0)

    const createJob = page.getByTestId('create-job-button')
    await expect(createJob).toBeVisible()
    await expect(createJob).toHaveText(/Add New Job|Permission Required/)
  })
})
