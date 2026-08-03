/**
 * Team & admin Member management (ticket #15 / ADR-0020).
 * Ports source edge fns: admin-create-member, admin-update-member-permissions.
 *
 * Reads use the user-scoped client (admin SELECT RLS). Writes that RLS forbids
 * (profiles UPDATE is self-only) and Auth Admin API calls use getAdminClient()
 * after a user-scoped `user_is_company_admin` check.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth'
import { getAdminClient, getRequestOrigin } from '../lib/supabase'
import { sendInviteEmail } from '../lib/email'
import {
  memberPermissionsSchema,
  normalizeMemberPermissions,
} from '#/lib/permissions-shared'
import type { MemberPermissions } from '#/lib/permissions-shared'
import type { Database } from '#/integrations/supabase/types'
import type { ProfilePermissionsJson } from '#/integrations/supabase/json-types'

export type TeamMemberRow = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'member' | 'admin'
  must_change_password: boolean
  permissions: MemberPermissions
  company_id: string | null
}

const memberSelect =
  'id, email, first_name, last_name, role, must_change_password, permissions, company_id' as const

function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateStrongPassword(length = 10): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}'
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  let password = ''
  for (let i = 0; i < length; i += 1) {
    const idx = randomValues[i] % alphabet.length
    password += alphabet[idx] ?? 'A'
  }
  return password
}

function mapProfileRow(row: {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  must_change_password: boolean
  permissions: ProfilePermissionsJson | null
  company_id: string | null
}): TeamMemberRow {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role === 'admin' ? 'admin' : 'member',
    must_change_password: Boolean(row.must_change_password),
    permissions: normalizeMemberPermissions(row.permissions ?? undefined),
    company_id: row.company_id,
  }
}

async function assertCompanyAdmin(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  const { data: isAdmin, error } = await supabase.rpc('user_is_company_admin', {
    target_company_id: companyId,
  })
  if (error) {
    throw new Error('Unable to verify permissions')
  }
  if (!isAdmin) {
    throw new Error('Not authorized to manage members')
  }
}

async function loadCompanyName(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle()
  if (error) {
    console.warn('[team] Failed to load company name', error.message)
  }
  return data?.name.trim() || 'Talsek'
}

async function generateRecoveryLink(
  email: string,
  redirectTo: string,
): Promise<string> {
  const { data, error } = await getAdminClient().auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })
  const actionLink = data.properties?.action_link
  if (error || !actionLink) {
    throw new Error(error?.message ?? 'Failed to generate password setup link')
  }
  return actionLink
}

// ─── Reads ───────────────────────────────────────────────────────────────

export const fetchTeamMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ companyId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context.supabase, data.companyId)

    // Company scoping via RLS (ADR-0004) — admin SELECT policy owns the filter.
    const { data: rows, error } = await context.supabase
      .from('profiles')
      .select(memberSelect)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to load team members: ${error.message}`)
    }

    return rows.map(mapProfileRow)
  })

export const fetchTeamMember = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      companyId: z.string().uuid(),
      memberId: z.string().uuid(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context.supabase, data.companyId)

    const { data: row, error } = await context.supabase
      .from('profiles')
      .select(memberSelect)
      .eq('id', data.memberId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load member: ${error.message}`)
    }
    if (!row) {
      throw new Error('Member not found')
    }

    return mapProfileRow(row)
  })

// ─── Writes ──────────────────────────────────────────────────────────────

const inviteMemberInput = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['member', 'admin']),
  message: z.string().max(1000).optional(),
  permissions: memberPermissionsSchema.optional(),
})

export const inviteMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(inviteMemberInput)
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context.supabase, data.companyId)

    const admin = getAdminClient()
    const assignedPermissions = normalizeMemberPermissions(data.permissions)
    const normalizedEmail = canonicalizeEmail(data.email)
    const companyName = await loadCompanyName(context.supabase, data.companyId)
    const redirectTo = `${getRequestOrigin()}/reset-password`

    const { data: existingProfile, error: existingProfileError } = await admin
      .from('profiles')
      .select('id, company_id, must_change_password, first_name, last_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingProfileError) {
      throw new Error('Failed to check for existing user')
    }

    if (existingProfile) {
      if (existingProfile.company_id !== data.companyId) {
        throw new Error('A profile with this email already exists')
      }

      const { data: existingAuthUser, error: existingAuthUserError } =
        await admin.auth.admin.getUserById(existingProfile.id)

      if (existingAuthUserError) {
        throw new Error('An account with this email already exists')
      }

      const authUser = existingAuthUser.user
      const existingUserMetadata = authUser.user_metadata as Record<
        string,
        unknown
      >
      const requiresPasswordChange =
        existingProfile.must_change_password === true ||
        existingUserMetadata.requires_password_change === true

      if (!requiresPasswordChange) {
        throw new Error('This member has already accepted their invite')
      }

      const { error: profileUpdateError } = await admin
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          must_change_password: true,
          permissions: assignedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)

      if (profileUpdateError) {
        throw new Error('Failed to refresh member information')
      }

      const { error: updateUserError } = await admin.auth.admin.updateUserById(
        existingProfile.id,
        {
          user_metadata: {
            ...existingUserMetadata,
            first_name: data.firstName,
            last_name: data.lastName,
            requires_password_change: true,
            invite_message: data.message ?? null,
          },
          app_metadata: {
            ...authUser.app_metadata,
            role: data.role,
          },
        },
      )

      if (updateUserError) {
        throw new Error('Failed to refresh member account')
      }

      const inviteLink = await generateRecoveryLink(normalizedEmail, redirectTo)

      try {
        await sendInviteEmail({
          to: normalizedEmail,
          inviteLink,
          companyName,
          firstName: data.firstName,
          lastName: data.lastName,
          customMessage: data.message ?? null,
          isResend: true,
        })
      } catch {
        throw new Error('Failed to deliver invite email')
      }

      return {
        action: 'resend' as const,
        success: true as const,
        userId: authUser.id,
        profileId: existingProfile.id,
        message: 'Invite email re-sent',
      }
    }

    const { data: existingAuthUsers, error: listUsersError } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 200 })

    if (listUsersError) {
      throw new Error('Failed to verify existing account')
    }

    const matchedAuthUser = existingAuthUsers.users.find(
      (authUser) => authUser.email?.toLowerCase() === normalizedEmail,
    )
    if (matchedAuthUser) {
      throw new Error('An account with this email already exists')
    }

    const temporaryPassword = generateStrongPassword()

    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          requires_password_change: true,
          invite_message: data.message ?? null,
        },
        app_metadata: {
          role: data.role,
        },
      })

    if (createUserError) {
      throw new Error('Failed to create account')
    }

    const newUserId = createdUser.user.id
    const profilePayload = {
      email: normalizedEmail,
      first_name: data.firstName,
      last_name: data.lastName,
      company_id: data.companyId,
      role: data.role,
      must_change_password: true,
      permissions: assignedPermissions,
    }

    let profileId: string | null = null

    const { data: updatedProfile, error: updateProfileError } = await admin
      .from('profiles')
      .update(profilePayload)
      .eq('id', newUserId)
      .select('id')
      .maybeSingle()

    if (updateProfileError || !updatedProfile) {
      const { data: insertedProfile, error: insertProfileError } = await admin
        .from('profiles')
        .insert([{ id: newUserId, ...profilePayload }])
        .select('id')
        .maybeSingle()

      if (insertProfileError || !insertedProfile) {
        throw new Error('Failed to persist profile information')
      }
      profileId = insertedProfile.id
    } else {
      profileId = updatedProfile.id
    }

    let inviteLink: string
    try {
      inviteLink = await generateRecoveryLink(normalizedEmail, redirectTo)
    } catch {
      throw new Error('Failed to generate password setup link')
    }

    try {
      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        companyName,
        firstName: data.firstName,
        lastName: data.lastName,
        customMessage: data.message ?? null,
        isResend: false,
      })
    } catch {
      throw new Error('Failed to deliver invite email')
    }

    return {
      action: 'create' as const,
      success: true as const,
      userId: newUserId,
      profileId,
      permissions: assignedPermissions,
      message: 'Member created and invite email sent',
    }
  })

const resendInviteInput = z.object({
  companyId: z.string().uuid(),
  memberId: z.string().uuid(),
})

export const resendInvite = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(resendInviteInput)
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context.supabase, data.companyId)

    const companyName = await loadCompanyName(context.supabase, data.companyId)
    const redirectTo = `${getRequestOrigin()}/reset-password`

    const { data: targetProfile, error: targetProfileError } =
      await context.supabase
        .from('profiles')
        .select(
          'id, email, first_name, last_name, company_id, must_change_password',
        )
        .eq('id', data.memberId)
        .maybeSingle()

    if (targetProfileError) {
      throw new Error('Failed to load member details')
    }
    if (!targetProfile) {
      throw new Error('Member not found')
    }
    if (!targetProfile.must_change_password) {
      throw new Error('This member has already accepted their invite')
    }
    if (!targetProfile.email) {
      throw new Error('Member record is missing an email address')
    }

    const normalizedEmail = canonicalizeEmail(targetProfile.email)
    const admin = getAdminClient()

    const { data: targetUser, error: getUserError } =
      await admin.auth.admin.getUserById(data.memberId)

    if (getUserError) {
      throw new Error('Account not found for this member')
    }

    let inviteLink: string
    try {
      inviteLink = await generateRecoveryLink(normalizedEmail, redirectTo)
    } catch {
      throw new Error('Failed to resend invite email')
    }

    const authUser = targetUser.user
    const userMetadata = authUser.user_metadata as Record<string, unknown>
    const customMessage =
      typeof userMetadata.invite_message === 'string' &&
      userMetadata.invite_message.trim().length > 0
        ? userMetadata.invite_message
        : null

    try {
      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        companyName,
        firstName:
          typeof userMetadata.first_name === 'string'
            ? userMetadata.first_name
            : targetProfile.first_name,
        lastName:
          typeof userMetadata.last_name === 'string'
            ? userMetadata.last_name
            : targetProfile.last_name,
        customMessage,
        isResend: true,
      })
    } catch {
      throw new Error('Failed to deliver invite email')
    }

    return {
      action: 'resend' as const,
      success: true as const,
      userId: authUser.id,
      profileId: targetProfile.id,
      message: 'Invite email re-sent',
    }
  })

const updateMemberPermissionsInput = z.object({
  companyId: z.string().uuid(),
  memberId: z.string().uuid(),
  permissions: memberPermissionsSchema,
})

export const updateMemberPermissions = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(updateMemberPermissionsInput)
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context.supabase, data.companyId)

    const normalizedPermissions = normalizeMemberPermissions(data.permissions)

    const { data: targetProfile, error: targetFetchError } =
      await context.supabase
        .from('profiles')
        .select('id')
        .eq('id', data.memberId)
        .maybeSingle()

    if (targetFetchError) {
      throw new Error('Failed to load member profile')
    }
    if (!targetProfile) {
      throw new Error('Member not found')
    }

    // profiles UPDATE RLS is self-only — service-role after admin check (ADR-0020).
    const { data: updated, error: updateError } = await getAdminClient()
      .from('profiles')
      .update({
        permissions: normalizedPermissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.memberId)
      .select('id')
      .maybeSingle()

    if (updateError || !updated) {
      throw new Error('Failed to update member permissions')
    }

    return {
      success: true as const,
      profileId: updated.id,
      permissions: normalizedPermissions,
      message: 'Member permissions updated successfully',
    }
  })
