import type {
  AIAnalysisJson,
  ParsedJobDataJson,
  RequirementItemJson,
  ResumeExtractionJson,
} from '#/integrations/supabase/types'
import { normalizeRequirementList } from '#/lib/requirements'
import { generateObjectWithRetry } from './ai-services'
import {
  buildJobMatchWritePayload,
  ensureExactIdSet,
} from './build-match-result'
import {
  getJobMatchCoreAnalysisPrompt,
  getJobMatchRequirementsAnalysisPrompt,
} from './prompts'
import {
  jobMatchCoreAnalysisSchema,
  jobMatchRequirementsAnalysisSchema,
} from './schemas'

function buildCandidateContext(input: {
  extracted: ResumeExtractionJson
  jobTitle: string
  companyName: string | null
}): string {
  const { extracted, jobTitle, companyName } = input
  const workExperience =
    extracted.work_experience.length > 0
      ? extracted.work_experience
          .map(
            (exp, index) => `
${index + 1}. ${exp.role} at ${exp.company} (${exp.duration})
   Responsibilities & Achievements: ${
     exp.experience_details?.join('; ') || 'Not detailed'
   }
`,
          )
          .join('')
      : 'No work experience provided'

  const technicalSkills =
    extracted.technical_skills.length > 0
      ? extracted.technical_skills
          .map(
            (skill, index) => `
${index + 1}. ${skill.skill}
   Evidence: ${skill.justification || 'No evidence provided'}
`,
          )
          .join('')
      : 'No technical skills provided'

  const softSkills =
    extracted.soft_skills.length > 0
      ? extracted.soft_skills
          .map(
            (skill, index) => `
${index + 1}. ${skill.skill}
   Evidence: ${skill.justification || 'No evidence provided'}
`,
          )
          .join('')
      : 'No soft skills provided'

  const education =
    extracted.education.length > 0
      ? extracted.education
          .map(
            (edu) =>
              `• ${edu.degree} in ${edu.field} from ${edu.institution} (${
                edu.year || 'Year not specified'
              })`,
          )
          .join('\n')
      : 'No education provided'

  const certifications =
    extracted.certifications.length > 0
      ? extracted.certifications.join(', ')
      : 'None listed'

  const concerns =
    extracted.potential_concerns.length > 0
      ? extracted.potential_concerns
          .map(
            (concern, index) => `
${index + 1}. ${concern.concern}
   Supporting Evidence: ${concern.justification || 'No evidence provided'}
`,
          )
          .join('')
      : 'No concerns identified'

  return `CANDIDATE PROFILE:
Name: ${extracted.name}
Experience Level: ${extracted.total_experience_years} years (${extracted.career_level})
Current Role: ${extracted.current_role}
Location: ${extracted.location}

CANDIDATE WORK EXPERIENCE:
${workExperience}

CANDIDATE TECHNICAL SKILLS & EVIDENCE:
${technicalSkills}

CANDIDATE SOFT SKILLS & EVIDENCE:
${softSkills}

CANDIDATE EDUCATION:
${education}

CANDIDATE CERTIFICATIONS: ${certifications}

CANDIDATE POTENTIAL CONCERNS:
${concerns}

JOB DETAILS:
Position: ${jobTitle}
Company: ${companyName || 'Not specified'}`
}

export type JobMatchAnalysisResult = {
  matchScore: number
  finalScore: number
  meetsAllNonNegotiables: boolean
  preferredRequirementsMet: number
  aiAnalysis: AIAnalysisJson
  preferred: RequirementItemJson[]
  nonNegotiables: RequirementItemJson[]
  coreModelUsed: string
  requirementsModelUsed: string
  fallbackUsed: boolean
}

/**
 * Job Match Analysis AI op — ports the parallel core + requirements
 * `generateObjectWithRetry` calls from the source `job-match-analysis` edge
 * function. Primary OpenAI → fallback Grok for both legs. Credit consumption
 * and DB writes stay in the orchestrator.
 */
export async function runJobMatchAnalysis(input: {
  extracted: ResumeExtractionJson
  jobTitle: string
  companyName: string | null
  preferredRequirements: unknown
  nonNegotiables: unknown
  parsedJobData: ParsedJobDataJson
}): Promise<JobMatchAnalysisResult> {
  const preferred = normalizeRequirementList(
    input.preferredRequirements as never,
    'preferred',
  )
  const nonNegotiables = normalizeRequirementList(
    input.nonNegotiables as never,
    'non_negotiable',
  )

  const preferredIds = preferred.map((req) => req.id)
  const nonNegotiableIds = nonNegotiables.map((req) => req.id)

  if (
    new Set(preferredIds).size !== preferredIds.length ||
    new Set(nonNegotiableIds).size !== nonNegotiableIds.length
  ) {
    throw new Error(
      'Duplicate requirement IDs detected; cannot proceed with analysis',
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const candidateContext = buildCandidateContext({
    extracted: input.extracted,
    jobTitle: input.jobTitle,
    companyName: input.companyName,
  })
  const roleReadiness =
    input.parsedJobData.role_readiness_summary ||
    'No role readiness summary available'

  const [coreAnalysisResult, requirementsAnalysisResult] = await Promise.all([
    generateObjectWithRetry({
      primaryModel: 'openai',
      fallbackModel: 'grok',
      schema: jobMatchCoreAnalysisSchema,
      operationName: 'Job Match Core Analysis',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getJobMatchCoreAnalysisPrompt(
                today,
                candidateContext,
                roleReadiness,
              ),
            },
          ],
        },
      ],
      providerOptions: {
        openai: {
          reasoningEffort: 'medium',
          textVerbosity: 'low',
        },
        groq: {
          reasoningEffort: 'medium',
          reasoningFormat: 'hidden',
        },
        google: {
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      },
    }),
    generateObjectWithRetry({
      primaryModel: 'openai',
      fallbackModel: 'grok',
      schema: jobMatchRequirementsAnalysisSchema,
      operationName: 'Job Match Requirements Analysis',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getJobMatchRequirementsAnalysisPrompt(
                today,
                candidateContext,
                preferred,
                nonNegotiables,
              ),
            },
          ],
        },
      ],
      providerOptions: {
        openai: {
          reasoningEffort: 'medium',
        },
      },
    }),
  ])

  const preferredDetailsRaw =
    requirementsAnalysisResult.object.preferred_requirements_analysis.details
  const nonNegotiableDetailsRaw =
    requirementsAnalysisResult.object.non_negotiables_analysis.details

  ensureExactIdSet(
    'preferred_requirements',
    preferredIds,
    preferredDetailsRaw.map((d) => d.id),
  )
  ensureExactIdSet(
    'non_negotiables',
    nonNegotiableIds,
    nonNegotiableDetailsRaw.map((d) => d.id),
  )

  const preferredDetailMap = new Map(
    preferredDetailsRaw.map((detail) => [detail.id, detail]),
  )
  const nonNegotiableDetailMap = new Map(
    nonNegotiableDetailsRaw.map((detail) => [detail.id, detail]),
  )

  const enrichedPreferredDetails = preferred.map((req) => {
    const aiDetail = preferredDetailMap.get(req.id)
    if (!aiDetail) {
      throw new Error(
        `Missing AI detail for preferred requirement ${req.id}`,
      )
    }
    return {
      id: req.id,
      text: req.text,
      meets: aiDetail.meets,
      evidence: aiDetail.evidence,
    }
  })

  const enrichedNonNegotiableDetails = nonNegotiables.map((req) => {
    const aiDetail = nonNegotiableDetailMap.get(req.id)
    if (!aiDetail) {
      throw new Error(
        `Missing AI detail for non-negotiable requirement ${req.id}`,
      )
    }
    return {
      id: req.id,
      text: req.text,
      meets: aiDetail.meets,
      evidence: aiDetail.evidence,
    }
  })

  const write = buildJobMatchWritePayload({
    core: coreAnalysisResult.object,
    preferredDetails: enrichedPreferredDetails,
    nonNegotiableDetails: enrichedNonNegotiableDetails,
    preferred,
    nonNegotiables,
  })

  return {
    ...write,
    preferred,
    nonNegotiables,
    coreModelUsed: coreAnalysisResult.modelUsed,
    requirementsModelUsed: requirementsAnalysisResult.modelUsed,
    fallbackUsed:
      coreAnalysisResult.fallbackUsed ||
      requirementsAnalysisResult.fallbackUsed,
  }
}
