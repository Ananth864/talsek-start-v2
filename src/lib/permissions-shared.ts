import { z } from 'zod'

/** Shared Member permission constants — safe for client + server. */

export const memberPermissionsSchema = z.object({
  canCreateJob: z.boolean(),
  canSendReachout: z.boolean(),
  canManageTemplates: z.boolean(),
  canManageForms: z.boolean(),
})

export type MemberPermissions = z.infer<typeof memberPermissionsSchema>
export type MemberPermissionKey = keyof MemberPermissions

export const MEMBER_PERMISSIONS_DEFAULT: MemberPermissions = {
  canCreateJob: false,
  canSendReachout: false,
  canManageTemplates: false,
  canManageForms: false,
}

export const MEMBER_PERMISSIONS_META: Array<{
  key: MemberPermissionKey
  label: string
  description: string
}> = [
  {
    key: 'canCreateJob',
    label: 'Create Jobs',
    description: 'Allows the member to create and publish new job listings.',
  },
  {
    key: 'canSendReachout',
    label: 'Send Reachouts',
    description: 'Grants access to send interview and final reachout messages.',
  },
  {
    key: 'canManageTemplates',
    label: 'Manage Templates',
    description: 'Enables editing interview and reachout communication templates.',
  },
  {
    key: 'canManageForms',
    label: 'Customize Forms',
    description: 'Allows editing job application form configurations.',
  },
]

export function normalizeMemberPermissions(
  permissions: Partial<MemberPermissions> | null | undefined,
): MemberPermissions {
  return {
    ...MEMBER_PERMISSIONS_DEFAULT,
    ...(permissions ?? {}),
  }
}

export const memberPermissionsWithDefaultsSchema = memberPermissionsSchema.transform(
  (value) => normalizeMemberPermissions(value),
)
