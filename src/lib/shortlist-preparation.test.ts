import { describe, expect, test } from 'bun:test'
import {
  BULK_SHORTLIST_MAX,
  DEFAULT_INTERVIEW_COST,
  SHORTLIST_COPY,
  prepareBulkShortlist,
  prepareShortlist,
  validateShortlistConfirmation,
} from '#/lib/shortlist-preparation'
import type {
  ShortlistJobInput,
  ShortlistTemplatesSnapshot,
} from '#/lib/shortlist-preparation'
import type {
  JobApplicationRow,
  JobStageRow,
} from '#/server/fn/job-applications'
import type { ReachoutTemplate } from '#/lib/reachout-template-shared'

function stage(
  id: string,
  name: string,
  order: number,
): JobStageRow {
  return {
    id,
    job_id: 'job-1',
    stage_id: `hs-${id}`,
    stage_order: order,
    hiring_stage: { id: `hs-${id}`, name },
  }
}

function application(overrides: {
  status?: JobApplicationRow['status']
  stageId?: string
}): JobApplicationRow {
  const stageId = overrides.stageId ?? 'stage-1'
  return {
    id: 'app-1',
    job_id: 'job-1',
    candidate_id: 'cand-1',
    current_stage_id: stageId,
    candidate_name: 'Ada Lovelace',
    status: overrides.status ?? 'active',
    processing_source: 'form',
    match_score: 20,
    final_score: 80,
    meets_all_non_negotiables: true,
    preferred_requirements_matched: 1,
    starred: false,
    resume_url: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    parsed_candidate_data: {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: 'not mentioned',
      location: 'Remote',
      current_role: 'Engineer',
      total_experience_years: 5,
      work_experience: [],
      education: [],
      technical_skills: [{ skill: 'TypeScript', justification: 'unit' }],
      soft_skills: [],
      certifications: [],
      summary: 'Unit fixture',
      potential_concerns: [],
      potential_concerns_questions: [],
      career_level: 'mid',
    },
    ai_analysis: null,
    email_content: null,
    candidate: { email: 'ada@example.com' },
    current_stage: {
      id: stageId,
      hiring_stage: { id: `hs-${stageId}`, name: 'Resume Screening' },
    },
  } as unknown as JobApplicationRow
}

const stages: JobStageRow[] = [
  stage('stage-1', 'Resume Screening', 1),
  stage('stage-2', 'Screening Interview', 2),
  stage('stage-3', 'Final Reachout', 3),
]

const job: ShortlistJobInput = {
  id: 'job-1',
  title: 'Staff Engineer',
  location: 'Remote',
  companies: { id: 'co-1', name: 'Talsek' },
}

function template(body: string): ReachoutTemplate {
  return {
    subject: 'Hello {{candidate_name}}',
    body,
    reply_to_email: 'recruiter@example.com',
    created_at: new Date(0).toISOString(),
  }
}

const templatesConfigured: ShortlistTemplatesSnapshot = {
  reachout: template('Hi {{candidate_name}} for {{job_title}}'),
  interview: template(
    'Hi {{candidate_name}}\n{{interview_link}}\nfor {{job_title}}',
  ),
  hasReachoutTemplate: true,
  hasInterviewTemplate: true,
}

const baseInput = {
  application: application({}),
  job,
  stages,
  canSendReachout: true,
  templates: templatesConfigured,
  creditBalance: 100,
  interviewCost: DEFAULT_INTERVIEW_COST,
  creditsLoading: false,
  ratesLoading: false,
}

describe('prepareShortlist', () => {
  test('blocks when permission is missing', () => {
    expect(
      prepareShortlist({
        ...baseInput,
        canSendReachout: false,
      }),
    ).toEqual({
      kind: 'block-permission',
      message: SHORTLIST_COPY.noPermission,
    })
  })

  test('uses board vs search copy when the application is missing', () => {
    expect(
      prepareShortlist({ ...baseInput, application: null, surface: 'board' }),
    ).toEqual({
      kind: 'application-missing',
      message: SHORTLIST_COPY.applicationMissingBoard,
    })
    expect(
      prepareShortlist({ ...baseInput, application: null, surface: 'search' }),
    ).toEqual({
      kind: 'application-missing',
      message: SHORTLIST_COPY.applicationMissingSearch,
    })
  })

  test('waits for credits before template fetch on interview Shortlist', () => {
    const decision = prepareShortlist({
      ...baseInput,
      templates: null,
      creditsLoading: true,
    })
    expect(decision.kind).toBe('wait-credits-loading')
  })

  test('blocks insufficient interview credits', () => {
    const decision = prepareShortlist({
      ...baseInput,
      creditBalance: 10,
      interviewCost: 40,
    })
    expect(decision.kind).toBe('block-insufficient-credits')
  })

  test('opens confirm with personalized Reachout when gates pass', () => {
    // Next stage is Screening Interview from stage-1 → interview template.
    const decision = prepareShortlist(baseInput)
    expect(decision.kind).toBe('open-confirm')
    if (decision.kind !== 'open-confirm') return
    expect(decision.templateType).toBe('interview')
    expect(decision.nextStage.id).toBe('stage-2')
    expect(decision.personalized.subject).toContain('Ada Lovelace')
    expect(decision.personalized.body).toContain('{{interview_link}}')
    expect(decision.personalized.body).toContain('Staff Engineer')
  })

  test('blocks rejected applications', () => {
    const decision = prepareShortlist({
      ...baseInput,
      application: application({ status: 'rejected' }),
    })
    expect(decision).toEqual({
      kind: 'block-rejected',
      message: SHORTLIST_COPY.rejected,
    })
  })
})

describe('prepareBulkShortlist', () => {
  const nextStage = { id: 'stage-2', name: 'Screening Interview' }

  test('enforces the selection cap', () => {
    const decision = prepareBulkShortlist({
      canSendReachout: true,
      selectedCount: BULK_SHORTLIST_MAX + 1,
      nextStage,
      templates: templatesConfigured,
      creditBalance: 10_000,
      interviewCost: DEFAULT_INTERVIEW_COST,
      creditsLoading: false,
      ratesLoading: false,
    })
    expect(decision.kind).toBe('block-selection-cap')
  })

  test('multiplies interview cost by selected count', () => {
    const decision = prepareBulkShortlist({
      canSendReachout: true,
      selectedCount: 3,
      nextStage,
      templates: templatesConfigured,
      creditBalance: 100,
      interviewCost: 40,
      creditsLoading: false,
      ratesLoading: false,
    })
    expect(decision).toEqual({
      kind: 'block-insufficient-credits',
      required: 120,
    })
  })

  test('returns template placeholders on open-confirm', () => {
    const decision = prepareBulkShortlist({
      canSendReachout: true,
      selectedCount: 2,
      nextStage: { id: 'stage-3', name: 'Final Reachout' },
      templates: templatesConfigured,
      creditBalance: 0,
      interviewCost: 40,
      creditsLoading: false,
      ratesLoading: false,
    })
    expect(decision.kind).toBe('open-confirm')
    if (decision.kind !== 'open-confirm') return
    expect(decision.subject).toContain('{{candidate_name}}')
    expect(decision.body).toContain('{{job_title}}')
  })
})

describe('validateShortlistConfirmation', () => {
  test('requires {{interview_link}} for interview templates', () => {
    expect(
      validateShortlistConfirmation({
        canSendReachout: true,
        templateType: 'interview',
        body: 'Please interview without the link',
      }),
    ).toEqual({
      kind: 'block-missing-interview-link',
      message: SHORTLIST_COPY.interviewLinkMissing,
    })

    expect(
      validateShortlistConfirmation({
        canSendReachout: true,
        templateType: 'interview',
        body: 'Link: {{interview_link}}',
      }),
    ).toEqual({ kind: 'valid' })
  })

  test('re-checks permission at confirm time', () => {
    expect(
      validateShortlistConfirmation({
        canSendReachout: false,
        templateType: 'final',
        body: 'Hello',
      }),
    ).toEqual({
      kind: 'block-permission',
      message: SHORTLIST_COPY.noPermission,
    })
  })
})
