import { test, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { LAYOUT_PARITY_VIEWPORT } from './helpers'

/**
 * Layout-parity: Auth pages structure + interaction (#41 / ADR-0030).
 * Structure/interaction only — no screenshots, no paint asserts.
 * Source: ../talsek SignIn, SignUp, ForgotPassword, ResetPasswordPage,
 * ConfirmEmailPage. Credential success paths stay in e2e/auth-pages.spec.ts.
 */
test.use({ viewport: LAYOUT_PARITY_VIEWPORT })

async function openAuth(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

/** Vertical order of testids within a root (top → bottom). */
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

test.describe('Sign-in layout parity', () => {
  test('AuthLayout chrome, Google-first stack, fields, and secondary links', async ({
    page,
  }) => {
    await openAuth(page, '/signin')

    const layout = page.getByTestId('auth-layout')
    await expect(layout).toBeVisible()
    await expect(
      layout.getByRole('heading', { name: 'Welcome back', exact: true }),
    ).toBeVisible()
    await expect(layout).toContainText(/Sign in to your Talsek account/i)
    await expect(page.getByTestId('auth-layout-showcase')).toBeVisible()

    const card = page.getByTestId('auth-card')
    await expect(card).toBeVisible()

    const stackOrder = await orderedTestIds(card, [
      'google-oauth-button',
      'auth-email-separator',
      'auth-email-form',
    ])
    expect(stackOrder).toEqual([
      'google-oauth-button',
      'auth-email-separator',
      'auth-email-form',
    ])

    await expect(page.getByTestId('google-oauth-button')).toHaveText(
      /Continue with Google/i,
    )
    await expect(page.getByTestId('auth-email-separator')).toContainText(
      /or continue with email/i,
    )

    const form = page.getByTestId('auth-email-form')
    await expect(form.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(form.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByTestId('password-visibility-toggle')).toBeVisible()

    await expect(page.getByTestId('forgot-password-link')).toHaveText(
      /Forgot your password\?/i,
    )
    await expect(page.getByTestId('forgot-password-link')).toHaveAttribute(
      'href',
      '/forgot-password',
    )

    await expect(
      form.getByRole('button', { name: /^sign in$/i }),
    ).toBeVisible()

    await expect(page.getByTestId('auth-secondary-link')).toContainText(
      /Don't have an account\?/i,
    )
    await expect(
      page.getByTestId('auth-secondary-link').getByRole('link', {
        name: /^sign up$/i,
      }),
    ).toHaveAttribute('href', '/signup')
  })

  test('password visibility toggle switches input type', async ({ page }) => {
    await openAuth(page, '/signin')
    const password = page.getByLabel('Password', { exact: true })
    await expect(password).toHaveAttribute('type', 'password')
    await page.getByTestId('password-visibility-toggle').click()
    await expect(password).toHaveAttribute('type', 'text')
    await page.getByTestId('password-visibility-toggle').click()
    await expect(password).toHaveAttribute('type', 'password')
  })
})

test.describe('Sign-up layout parity', () => {
  test('AuthLayout, Google-first stack, confirm password, and sign-in link', async ({
    page,
  }) => {
    await openAuth(page, '/signup')

    const layout = page.getByTestId('auth-layout')
    await expect(layout).toBeVisible()
    await expect(
      layout.getByRole('heading', { name: 'Create your account', exact: true }),
    ).toBeVisible()
    await expect(layout).toContainText(
      /Join thousands of companies using Talsek/i,
    )
    await expect(page.getByTestId('auth-layout-showcase')).toBeVisible()

    const card = page.getByTestId('auth-card')
    const stackOrder = await orderedTestIds(card, [
      'google-oauth-button',
      'auth-email-separator',
      'auth-email-form',
    ])
    expect(stackOrder).toEqual([
      'google-oauth-button',
      'auth-email-separator',
      'auth-email-form',
    ])

    const form = page.getByTestId('auth-email-form')
    await expect(form.getByLabel('First name')).toBeVisible()
    await expect(form.getByLabel('Last name')).toBeVisible()
    await expect(form.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(form.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(form.getByLabel('Confirm password', { exact: true })).toBeVisible()
    await expect(page.getByTestId('password-visibility-toggle')).toBeVisible()
    await expect(
      page.getByTestId('confirm-password-visibility-toggle'),
    ).toBeVisible()

    await expect(
      form.getByRole('button', { name: /create account/i }),
    ).toBeVisible()

    await expect(page.getByTestId('auth-secondary-link')).toContainText(
      /Already have an account\?/i,
    )
    await expect(
      page.getByTestId('auth-secondary-link').getByRole('link', {
        name: /^sign in$/i,
      }),
    ).toHaveAttribute('href', '/signin')
  })
})

test.describe('Forgot password layout parity', () => {
  test('form structure, primary CTA, and secondary sign-in paths', async ({
    page,
  }) => {
    await openAuth(page, '/forgot-password')

    await expect(page.getByTestId('auth-back-link')).toHaveText(
      /Back to sign in/i,
    )
    await expect(page.getByTestId('auth-back-link')).toHaveAttribute(
      'href',
      '/signin',
    )

    const card = page.getByTestId('auth-card')
    await expect(
      card.getByRole('heading', {
        name: 'Forgot your password?',
        exact: true,
      }),
    ).toBeVisible()
    await expect(card).toContainText(
      /Enter your email and we'll send you reset instructions/i,
    )

    await expect(card.getByLabel(/email/i)).toBeVisible()
    await expect(
      card.getByRole('button', { name: /send reset link/i }),
    ).toBeVisible()

    await expect(page.getByTestId('auth-secondary-link')).toContainText(
      /Remember your password\?/i,
    )
    await expect(
      page.getByTestId('auth-secondary-link').getByRole('link', {
        name: /^sign in$/i,
      }),
    ).toHaveAttribute('href', '/signin')
  })

  test('success state exposes next steps and alternate actions', async ({
    page,
  }) => {
    await openAuth(page, '/forgot-password')
    await page.getByLabel(/email/i).fill('layout-parity-reset@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()

    const card = page.getByTestId('auth-card')
    await expect(
      card.getByRole('heading', { name: 'Check your email', exact: true }),
    ).toBeVisible()
    await expect(card).toContainText(/if an account exists/i)
    await expect(page.getByTestId('forgot-success-steps')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /send to different email/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /back to sign in/i }),
    ).toBeVisible()
  })
})

test.describe('Confirm email layout parity', () => {
  test('resend UI: heading, resend CTA, and back link', async ({ page }) => {
    await openAuth(page, '/confirm-email')

    const card = page.getByTestId('auth-card')
    await expect(
      card.getByRole('heading', { name: /check your email/i }),
    ).toBeVisible()
    await expect(
      card.getByRole('button', { name: /resend confirmation email/i }),
    ).toBeVisible()
    await expect(page.getByTestId('auth-back-link')).toHaveText(
      /Back to sign in/i,
    )
    await expect(page.getByTestId('auth-back-link')).toHaveAttribute(
      'href',
      '/signin',
    )
  })
})

test.describe('Reset password layout parity', () => {
  test('missing code redirects to forgot-password', async ({ page }) => {
    await openAuth(page, '/reset-password')
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('invalid code shows invalid-link chrome and recovery CTA', async ({
    page,
  }) => {
    await openAuth(page, '/reset-password?code=not-a-real-pkce-code')

    const card = page.getByTestId('auth-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(
      card.getByRole('heading', { name: /invalid reset link/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /back to sign in/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /request a new link/i }),
    ).toBeVisible()
  })
})
