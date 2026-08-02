import type {
  AIAnalysisJson,
  EmailBulletInsightsJson,
  RequirementItemJson,
  ResumeExtractionJson,
} from '#/integrations/supabase/types'
import { serverEnv } from '../env'
import { buildJobMatchWritePayload } from './build-match-result'

/**
 * Deterministic Resume AI pipeline outputs for E2E / no-credentials runs
 * (ADR-0014). Shapes match `ResumeExtractionJson` / `AIAnalysisJson` /
 * `EmailBulletInsightsJson` so the board and profile read paths stay happy.
 */

export function deterministicResumeExtraction(
  applicationId: string,
): ResumeExtractionJson {
  return {
    name: `E2E Pipeline Candidate ${applicationId.slice(0, 8)}`,
    email: 'e2e.pipeline@example.com',
    phone: 'not mentioned',
    location: 'Remote',
    current_role: 'Software Engineer',
    total_experience_years: 5,
    work_experience: [
      {
        company: 'Example Corp',
        role: 'Software Engineer',
        duration: '2020 - Present',
        experience_details: [
          'Built React and TypeScript features for an ATS product.',
        ],
      },
    ],
    education: [
      {
        degree: "Bachelor's",
        field: 'Computer Science',
        institution: 'Example University',
        year: '2019',
      },
    ],
    technical_skills: [
      {
        skill: 'TypeScript',
        justification: 'Listed under skills and used in recent role',
      },
    ],
    soft_skills: [
      {
        skill: 'Collaboration',
        justification: 'Cross-functional delivery mentioned in experience',
      },
    ],
    certifications: [],
    summary:
      'Mid-level engineer with product experience. Deterministic stub used when AI_PIPELINE_STUB is set or no provider keys are configured.',
    potential_concerns: [],
    potential_concerns_questions: [],
    career_level: 'mid',
  }
}

export function deterministicEmailInsights(): EmailBulletInsightsJson {
  return {
    candidate_highlights: [
      'Claims five years of TypeScript experience with concrete project context.',
    ],
    company_join_highlights: [
      'States interest in the product domain with company-specific detail.',
    ],
  }
}

/**
 * Builds a full Job Match write payload that meets every included requirement
 * and produces a stable final_score via `computeDynamicScore`.
 */
export function deterministicJobMatchWrite(input: {
  preferred: RequirementItemJson[]
  nonNegotiables: RequirementItemJson[]
}): {
  matchScore: number
  finalScore: number
  meetsAllNonNegotiables: boolean
  preferredRequirementsMet: number
  aiAnalysis: AIAnalysisJson
} {
  const preferredDetails = input.preferred.map((req) => ({
    id: req.id,
    text: req.text,
    meets: true,
    evidence: 'Deterministic stub — requirement treated as met.',
  }))
  const nonNegotiableDetails = input.nonNegotiables.map((req) => ({
    id: req.id,
    text: req.text,
    meets: true,
    evidence: 'Deterministic stub — requirement treated as met.',
  }))

  const core = {
    individual_scores: {
      role_responsibility_readiness_score: 12,
      concerns_mitigation_score: 4,
      prestige_score: 3,
    },
    recommendation: 'GOOD_FIT' as const,
    rationale:
      'Deterministic stub match — candidate meets included requirements.',
    candidate_readiness:
      'Stub readiness narrative for E2E / no-credentials runs.',
    strengths_for_role: ['TypeScript experience', 'Product delivery'],
    potential_concerns: [],
  }

  return buildJobMatchWritePayload({
    core,
    preferredDetails,
    nonNegotiableDetails,
    preferred: input.preferred,
    nonNegotiables: input.nonNegotiables,
  })
}

/** True when the pipeline should skip live provider calls. */
export function shouldUseAiPipelineStub(): boolean {
  if (serverEnv.AI_PIPELINE_STUB) return true
  // No provider that the chain's primary/fallback pairs need (ADR-0010 §5 /
  // ADR-0014 §5 — gate via validated serverEnv, not raw process.env).
  return (
    !serverEnv.OPENAI_API_KEY &&
    !serverEnv.GROK_API_KEY &&
    !serverEnv.GEMINI_API_KEY
  )
}
