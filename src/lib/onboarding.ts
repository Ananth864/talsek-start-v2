/**
 * Get Started onboarding checklist — step ids, deep links, and localStorage
 * persistence key. Completion is client-only (no Profile/DB write); matches
 * source behavioural contract for ticket #29.
 */

export const ONBOARDING_STORAGE_KEY = 'onboarding_state'

export const ONBOARDING_STEP_IDS = [
  'customize-form',
  'reachout-templates',
  'add-team',
  'add-credits',
  'create-job',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number]

export type OnboardingStepRoute =
  | '/form-settings'
  | '/reachout-templates'
  | '/users'
  | '/billing'
  | '/dashboard'

export type OnboardingStep = {
  id: OnboardingStepId
  title: string
  description: string
  route: OnboardingStepRoute
  ctaText: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'customize-form',
    title: 'Customize Application Form',
    description:
      'Set up branding and Form Template questions for Applicants.',
    route: '/form-settings',
    ctaText: 'Customize Form',
  },
  {
    id: 'reachout-templates',
    title: 'Set Reachout Templates',
    description:
      'Create personalized Reachout Templates for candidate communication.',
    route: '/reachout-templates',
    ctaText: 'Manage Templates',
  },
  {
    id: 'add-team',
    title: 'Add Team Members',
    description: 'Invite colleagues to collaborate on hiring for your Company.',
    route: '/users',
    ctaText: 'Invite Team',
  },
  {
    id: 'add-credits',
    title: 'Add Credits',
    description: 'Purchase credits to start processing Job Applications.',
    route: '/billing',
    ctaText: 'Go to Billing',
  },
  {
    id: 'create-job',
    title: 'Create First Job',
    description: 'Launch your first Job and start receiving Candidates.',
    route: '/dashboard',
    ctaText: 'Go to Dashboard',
  },
]

export type ActionHubLink = {
  title: string
  description: string
  route: '/dashboard' | '/candidates' | '/users' | '/billing'
  testId: string
}

export const ACTION_HUB_LINKS: ActionHubLink[] = [
  {
    title: 'Create New Job',
    description: 'Post a new job opening and find candidates.',
    route: '/dashboard',
    testId: 'action-hub-create-job',
  },
  {
    title: 'View Candidates',
    description: 'Review applications and manage pipelines.',
    route: '/candidates',
    testId: 'action-hub-candidates',
  },
  {
    title: 'Manage Team',
    description: 'Add or remove team members and settings.',
    route: '/users',
    testId: 'action-hub-team',
  },
  {
    title: 'Billing & Credits',
    description: 'Check your balance and top up credits.',
    route: '/billing',
    testId: 'action-hub-billing',
  },
]

function isStepId(value: unknown): value is OnboardingStepId {
  return (
    typeof value === 'string' &&
    (ONBOARDING_STEP_IDS as readonly string[]).includes(value)
  )
}

/** Read completed step ids from localStorage. Safe on the server (returns []). */
export function readOnboardingCompleted(): OnboardingStepId[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStepId)
  } catch {
    return []
  }
}

export function writeOnboardingCompleted(ids: OnboardingStepId[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // private mode / quota — ignore
  }
}

export function isOnboardingComplete(ids: readonly string[]): boolean {
  return ONBOARDING_STEP_IDS.every((id) => ids.includes(id))
}
