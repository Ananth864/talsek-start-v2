// Shared JSON shapes -------------------------------------------------
// Audit log metadata (currently unstructured but JSON object if present)
//
// NOTE: FormQuestion is ported with its owning domain (forms). Kept loose here
// so the generated Database type compiles standalone without dragging in the
// (replaced) edge-function schema tree. `ParsedJobData` and
// `ScreeningInterviewInformation` are narrowed to concrete shapes now that the
// Jobs write path (#5) owns them — this also makes both JSON columns
// serializable across the server-function boundary (ADR-0009 §1), so they are
// re-added to the canonical Jobs select.
//
// `ResumeExtraction` (parsed_candidate_data) is narrowed here for the candidate
// board read path (#6): the board displays parsed candidate data, which the
// default server-function serializer can only carry once the column is a
// concrete (unknown-free) shape (ADR-0009 §1 / ADR-0011). It mirrors the
// source's `resumeExtractionSchema` verbatim.
type FormQuestion = Record<string, unknown>

// Core AI job-match analysis persisted inside job_applications.ai_analysis.
// Narrowed for the candidate profile detail (#7): the dialog reads scores,
// recommendation, rationale, strengths, and concerns, which the default
// server-function serializer can only carry once the column is a concrete
// (unknown-free) shape (ADR-0009 §1 — same precedent as `ResumeExtraction`).
// Mirrors the source's `jobMatchCoreAnalysisSchema` (supabase/functions/
// _shared/schemas/ai-response-schemas.ts) verbatim.
type JobMatchCoreAnalysis = {
  individual_scores: {
    role_responsibility_readiness_score: number
    concerns_mitigation_score: number
    prestige_score: number
  }
  recommendation: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'POOR_FIT'
  rationale: string
  candidate_readiness: string
  strengths_for_role: string[]
  potential_concerns: string[]
}

// Resume extraction output persisted on job_applications.parsed_candidate_data.
// Mirrors the source `resumeExtractionSchema` (supabase/functions/_shared/
// schemas/ai-response-schemas.ts). Every field has a schema default, so a
// well-formed stored value carries them all; accessors still guard for null/
// legacy rows defensively.
type ResumeExtraction = {
  name: string
  email: string
  phone: string
  location: string
  current_role: string
  total_experience_years: number
  work_experience: WorkExperienceJson[]
  education: EducationJson[]
  technical_skills: SkillWithEvidenceJson[]
  soft_skills: SkillWithEvidenceJson[]
  certifications: string[]
  summary: string
  potential_concerns: PotentialConcernJson[]
  potential_concerns_questions: string[]
  career_level: 'student' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive'
}

// AI-extracted job-description analysis (parse-job-description output). Mirrors
// the source's `jobParsingSchema` so the create-job payload and the stored
// column share one typed shape.
export type ParsedJobData = {
  preferred_requirements: string[]
  non_negotiables: string[]
  role_readiness_summary: string
  role_readiness_questions: string[]
}

// Company settings payload stored in JSONB column
export type ReachoutTemplateJson = {
  subject: string;
  body: string;
  reply_to_email: string;
  created_at: string;
};

export type ProfilePermissionsJson = {
  canCreateJob: boolean;
  canSendReachout: boolean;
  canManageTemplates: boolean;
  canManageForms: boolean;
};

export type CompanySettingsJson = {
  reachout_template?: ReachoutTemplateJson;
  interview_template?: ReachoutTemplateJson;
};

export type FormQuestionsJson = FormQuestion[];

// Form submission payload captured from public form
export type FormSubmissionDataJson = {
  phone: string;
  salary?: number;
  currentSalary?: number;
  experience?: number;
  noticePeriod?: number;
  qualification?:
    | "High School"
    | "Bachelor's"
    | "Master's"
    | "PhD"
    | "Post Doc";
  relocation?: "Yes" | "No";
  github?: string;
  [key: `customQuestion_${string}`]: string | undefined;
};

// Resume extraction output persisted on job applications
export type WorkExperienceJson = {
  company: string;
  role: string;
  duration: string;
  experience_details?: string[];
};

export type EducationJson = {
  degree: string;
  field: string;
  institution: string;
  year?: string | null;
};

export type SkillWithEvidenceJson = {
  skill: string;
  justification: string;
};

export type PotentialConcernJson = {
  concern: string;
  justification: string;
};

export type ResumeExtractionJson = ResumeExtraction;

// Job parsing outputs
export type ParsedJobDataJson = ParsedJobData

// Screening interview configuration stored on job. For `resume_only` an empty
// object is stored; for `resume_interview` the full shape is populated. Matches
// the source's `screeningInterviewInformationSchema` + the column comment.
export type ScreeningInterviewInformationJson = {
  expected_joining_date:
    | 'Immediately (0-1 Month)'
    | 'In 1-2 Months'
    | 'In 2-3 Months'
  job_type: {
    mode:
      | 'Remote (Anywhere)'
      | 'Remote (In Country)'
      | 'Hybrid'
      | 'Work From office'
    location: string
    work_arrangement: string
  }
  shift_timings: { start: string; end: string }
  travel_requirements: string
}

// Interview session context
export type InterviewQuestionTypeJson =
  | "ai_conversation"
  | "transcription_only"
  | "manual_input"
  | "boolean_choice"
  | "display_only";

export type InterviewQuestionCategoryJson = "question" | "informative";

export type InterviewQuestionJson = {
  id: string;
  category: InterviewQuestionCategoryJson;
  type: InterviewQuestionTypeJson;
  question: string;
  max_follow_ups?: number;
  placeholder?: string;
};

export type InterviewSessionContextJson = {
  candidate_name: string;
  job_title: string;
  company_name: string;
  questions: InterviewQuestionJson[];
};

export type QuestionFollowUpJson = {
  question: string;
  answer: string;
  reasoning: string;
  timestamp: string;
  initialAnswer?: string;
};

export type QuestionCompletedJson = {
  questionId: string;
  category: InterviewQuestionCategoryJson;
  mainQuestion: string;
  mainAnswer: string;
  followUps?: QuestionFollowUpJson[];
  ai_assessment?: string | null;
  satisfactory?: boolean | null;
  timestamp: string;
};

// AI analysis payload (stored shape)
export type AIRequirementDetailJson = {
  id: string;
  text: string;
  meets: boolean;
  evidence?: string;
};

export type AIRequirementsAnalysisJson = {
  details: AIRequirementDetailJson[];
};

export type AINonNegotiablesAnalysisJson = {
  details: AIRequirementDetailJson[];
};

// AI analysis data stored in job_applications.ai_analysis JSONB column
export type AIAnalysisJson = Omit<JobMatchCoreAnalysis, "individual_scores"> & {
  individual_scores: JobMatchCoreAnalysis["individual_scores"] & {
    overall_fit_score: number;
  };
  preferred_requirements_analysis: AIRequirementsAnalysisJson;
  non_negotiables_analysis: AINonNegotiablesAnalysisJson;
};

// Bullet-based email insights payload
export type EmailBulletInsightsJson = {
  candidate_highlights: string[]; // max 3 items, each ≤20 words
  company_join_highlights: string[]; // max 3 items, each ≤20 words
};

export type EmailContentJson = {
  email_body?: string;
  email_analysis?: EmailBulletInsightsJson;
};

// Non-negotiables and preferred requirements
export type RequirementItemJson = {
  id: string;
  text: string;
  include: boolean;
};

export type RequirementListJson = RequirementItemJson[];

// Custom question text overrides (id -> custom string)
export type CustomQuestionTextJson = Record<string, string>;

// View-specific JSON (application_summary_view.form_questions)
export type ApplicationSummaryFormQuestionsJson = FormQuestionsJson;
