import { z } from 'zod'

/**
 * AI response schemas ported from the source
 * (`supabase/functions/_shared/schemas/ai-response-schemas.ts`). The Zod
 * schema is the contract passed to the AI SDK's `generateObject`; the stored
 * JSON column types in `src/integrations/supabase/json-types.ts` are
 * hand-written to the same shapes so the types module stays free of a
 * dependency on this server library.
 */

// Job description parsing schema — passed to the AI SDK's `generateObject`. The
// `.describe()` strings are part of the schema sent to the model as guidance.
export const jobParsingSchema = z.object({
  preferred_requirements: z
    .array(z.string())
    .describe(
      'List of preferred requirements extracted from the job description',
    ),
  non_negotiables: z
    .array(z.string())
    .describe(
      'List of non-negotiable requirements extracted from the job description',
    ),
  role_readiness_summary: z
    .string()
    .describe(
      'Detailed summary capturing level-aware responsibility analysis with experience depth framework',
    ),
  role_readiness_questions: z
    .array(z.string())
    .describe(
      'Targeted interview questions to assess candidate readiness for core responsibilities',
    ),
})

export type JobParsingResult = z.infer<typeof jobParsingSchema>

// ─── Resume Extraction (#9) ──────────────────────────────────────────────

export const resumeExtractionSchema = z.object({
  name: z
    .string()
    .default('not mentioned')
    .describe('Full name of the candidate'),
  email: z
    .string()
    .default('not mentioned')
    .describe('Email address of the candidate'),
  phone: z
    .string()
    .default('not mentioned')
    .describe('Phone number of the candidate'),
  location: z
    .string()
    .default('not mentioned')
    .describe('City, state/country location of the candidate'),
  current_role: z
    .string()
    .default('not employed')
    .describe('Current job title of the candidate'),
  total_experience_years: z
    .number()
    .min(0)
    .default(0)
    .describe(
      'Number of years of professional work experience calculated ONLY from the work experience section of the resume',
    ),
  work_experience: z
    .array(
      z.object({
        company: z
          .string()
          .default('not mentioned')
          .describe('The company name where the candidate worked'),
        role: z
          .string()
          .default('not mentioned')
          .describe('The job title or position held at the company'),
        duration: z
          .string()
          .default('not mentioned')
          .describe('The time period the candidate worked at this company'),
        experience_details: z
          .array(z.string())
          .default([])
          .describe(
            'List of extracted responsibilities and achievements from this role',
          ),
      }),
    )
    .default([])
    .describe('List of work experiences with details about each position'),
  education: z
    .array(
      z.object({
        degree: z
          .string()
          .default('not mentioned')
          .describe("Type of degree earned (e.g., Bachelor's, Master's)"),
        field: z
          .string()
          .default('not mentioned')
          .describe('Field of study or major'),
        institution: z
          .string()
          .default('not mentioned')
          .describe('Name of the educational institution'),
        year: z
          .string()
          .default('not mentioned')
          .describe(
            'Graduation year, or status like "in progress" or "expected YYYY"',
          ),
      }),
    )
    .default([])
    .describe('List of educational qualifications and institutions'),
  technical_skills: z
    .array(
      z.object({
        skill: z
          .string()
          .describe('Name of the technical skill or technology'),
        justification: z
          .string()
          .describe(
            'Evidence from resume showing proficiency in this technical skill or technology(e.g., project, job responsibility, certification)',
          ),
      }),
    )
    .default([])
    .describe(
      'Inferred/Extracted technical skills/technologies with evidence from the resume',
    ),
  soft_skills: z
    .array(
      z.object({
        skill: z.string().describe('Name of the soft skill'),
        justification: z
          .string()
          .describe(
            'Evidence from resume demonstrating proficiency in this soft skill (e.g., leadership role, team collaboration)',
          ),
      }),
    )
    .default([])
    .describe('Soft skills with evidence from the resume'),
  certifications: z
    .array(z.string())
    .default([])
    .describe('List of professional certifications mentioned in the resume'),
  summary: z
    .string()
    .describe('2-3 sentence professional summary from the resume'),
  potential_concerns: z
    .array(
      z.object({
        concern: z
          .string()
          .describe('Description of a potential concern about the candidate'),
        justification: z
          .string()
          .describe(
            'Specific evidence from resume that raises this concern (e.g., employment gaps, frequent job changes)',
          ),
      }),
    )
    .default([])
    .describe('Potential concerns with evidence from the resume'),
  potential_concerns_questions: z
    .array(z.string())
    .default([])
    .describe(
      'Targeted questions to address the most pressing concerns identified',
    ),
  career_level: z
    .enum(['student', 'junior', 'mid', 'senior', 'lead', 'executive'])
    .default('junior')
    .describe(
      'Current career level based on experience and responsibilities',
    ),
})

export type ResumeExtractionResult = z.infer<typeof resumeExtractionSchema>

// ─── Job Match Analysis (#9) ─────────────────────────────────────────────

export const jobMatchCoreAnalysisSchema = z.object({
  individual_scores: z
    .object({
      role_responsibility_readiness_score: z
        .number()
        .min(0)
        .max(15)
        .describe(
          "Score from 0-15 evaluating how ready the candidate is to take on the role's responsibilities based on their background",
        ),
      concerns_mitigation_score: z
        .number()
        .min(0)
        .max(5)
        .describe(
          'Score from 0-5 evaluating how well potential concerns are mitigated',
        ),
      prestige_score: z
        .number()
        .min(0)
        .max(5)
        .describe(
          'Score from 0-5 evaluating quality/prestige of educational institutions and work experience companies',
        ),
    })
    .describe('Individual scoring components'),
  recommendation: z
    .enum(['STRONG_FIT', 'GOOD_FIT', 'MODERATE_FIT', 'POOR_FIT'])
    .describe('Overall recommendation based on the assessment'),
  rationale: z
    .string()
    .describe('Concise overall assessment considering all scoring factors'),
  candidate_readiness: z
    .string()
    .describe(
      'Concise discussion of readiness metrics and justification for the role responsibility readiness score',
    ),
  strengths_for_role: z
    .array(z.string())
    .describe(
      'Specific strengths that make this candidate suitable for the role',
    ),
  potential_concerns: z
    .array(z.string())
    .describe(
      "Potential concerns that could affect the candidate's success in the role",
    ),
})

const preferredRequirementDecisionSchema = z.object({
  id: z
    .string()
    .regex(/^preferred_\d+$/, {
      message: 'Must match the preferred_<number> id',
    })
    .describe(
      'The requirement ID provided by the server (e.g. preferred_1)',
    ),
  meets: z
    .boolean()
    .describe('Whether the candidate meets this specific preferred requirement'),
  evidence: z
    .string()
    .describe('Specific evidence from the resume supporting this assessment'),
})

const nonNegotiableRequirementDecisionSchema = z.object({
  id: z
    .string()
    .regex(/^non_negotiable_\d+$/, {
      message: 'Must match the non_negotiable_<number> id',
    })
    .describe(
      'The requirement ID provided by the server (e.g. non_negotiable_1)',
    ),
  meets: z
    .boolean()
    .describe(
      'Whether the candidate meets this specific non-negotiable requirement',
    ),
  evidence: z
    .string()
    .describe('Specific evidence from the resume supporting this assessment'),
})

export const jobMatchRequirementsAnalysisSchema = z.object({
  non_negotiables_analysis: z
    .object({
      details: z
        .array(nonNegotiableRequirementDecisionSchema)
        .describe(
          'Detailed analysis of each non-negotiable requirement keyed by ID',
        ),
    })
    .describe('Analysis of all non-negotiable job requirements'),
  preferred_requirements_analysis: z
    .object({
      details: z
        .array(preferredRequirementDecisionSchema)
        .describe(
          'Detailed analysis of each preferred requirement keyed by ID',
        ),
    })
    .describe('Analysis of all preferred job requirements'),
})

// ─── Email Analysis (#9) ─────────────────────────────────────────────────

export const emailBulletInsightsSchema = z.object({
  candidate_highlights: z
    .array(
      z.string().refine(
        (val) => {
          const wordCount = val
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length
          return wordCount <= 20
        },
        { message: 'Each candidate highlight must be 20 words or less' },
      ),
    )
    .max(3, 'Maximum 3 candidate highlights allowed'),
  company_join_highlights: z
    .array(
      z.string().refine(
        (val) => {
          const wordCount = val
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length
          return wordCount <= 20
        },
        { message: 'Each company join highlight must be 20 words or less' },
      ),
    )
    .max(3, 'Maximum 3 company join highlights allowed'),
})

export type EmailBulletInsightsResult = z.infer<typeof emailBulletInsightsSchema>
