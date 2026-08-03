import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

/**
 * Characterisation for Team & admin (#15): invite, resend, update permissions.
 * Runs against the new app with EMAIL_STUB=1 (no live Resend).
 */

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for team E2E',
    )
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureE2EAdmin(): Promise<{ companyId: string; userId: string }> {
  const admin = adminClient()
  const email = process.env.E2E_EMAIL!
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, company_id, role, must_change_password')
    .eq('email', email)
    .maybeSingle()
  if (error || !profile?.company_id) {
    throw new Error(`E2E member profile not found: ${error?.message}`)
  }
  if (profile.role !== 'admin' || profile.must_change_password) {
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        role: 'admin',
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    if (updateError) {
      throw new Error(`Failed to promote E2E admin: ${updateError.message}`)
    }
  }
  return { companyId: profile.company_id, userId: profile.id }
}

async function deleteMemberByEmail(email: string) {
  const admin = adminClient()
  const normalized = email.trim().toLowerCase()
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (profile?.id) {
    await admin.from('profiles').delete().eq('id', profile.id)
    await admin.auth.admin.deleteUser(profile.id)
  }
}

test.describe('team invites & permissions', () => {
  test('admin can invite, resend invite, and update permissions', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await ensureE2EAdmin()

    const inviteEmail = `e2e-invite-${randomUUID().slice(0, 8)}@example.com`
    const firstName = 'E2E'
    const lastName = 'Invitee'

    try {
      await signIn(page)

      await page.getByTestId('team-nav').click()
      await expect(page).toHaveURL(/\/users/)
      await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible()

      await page.getByTestId('invite-member-button').click()
      await expect(page.getByTestId('invite-member-modal')).toBeVisible()

      await page.getByTestId('invite-first-name').fill(firstName)
      await page.getByTestId('invite-last-name').fill(lastName)
      await page.getByTestId('invite-email').fill(inviteEmail)
      await page.getByTestId('invite-permission-canCreateJob').click()
      await page.getByTestId('invite-submit').click()

      await expect(page.getByTestId('team-banner')).toContainText(
        /invite email sent|re-sent/i,
      )
      await expect(page.getByText(inviteEmail)).toBeVisible()
      await expect(page.getByText('Pending password setup').first()).toBeVisible()

      const admin = adminClient()
      const { data: invited } = await admin
        .from('profiles')
        .select('id, permissions, must_change_password')
        .eq('email', inviteEmail)
        .maybeSingle()
      expect(invited?.id).toBeTruthy()
      expect(invited?.must_change_password).toBe(true)
      const perms = invited?.permissions as {
        canCreateJob?: boolean
      } | null
      expect(perms?.canCreateJob).toBe(true)

      await page.getByTestId(`manage-member-${invited!.id}`).click()
      await expect(page).toHaveURL(new RegExp(`/users/${invited!.id}`))
      await expect(page.getByTestId('member-detail-name')).toContainText(
        `${firstName} ${lastName}`,
      )

      await page.getByTestId('permission-canSendReachout').click()
      await page.getByTestId('permissions-save').click()
      await expect(page.getByTestId('member-detail-banner')).toContainText(
        /permissions updated/i,
      )

      const { data: updated } = await admin
        .from('profiles')
        .select('permissions')
        .eq('id', invited!.id)
        .maybeSingle()
      const updatedPerms = updated?.permissions as {
        canCreateJob?: boolean
        canSendReachout?: boolean
      } | null
      expect(updatedPerms?.canCreateJob).toBe(true)
      expect(updatedPerms?.canSendReachout).toBe(true)

      await page.getByTestId('resend-invite-button').click()
      await expect(page.getByTestId('member-detail-banner')).toContainText(
        /re-sent/i,
      )
    } finally {
      await deleteMemberByEmail(inviteEmail)
    }
  })
})
