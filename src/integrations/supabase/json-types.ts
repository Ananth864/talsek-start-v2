// Shared JSON shapes -------------------------------------------------
// Audit log metadata (currently unstructured but JSON object if present)
//
// NOTE: the precise shapes for CreateJobInput / FormQuestion /
// JobMatchCoreAnalysis / ParsedJobData / ResumeExtraction are ported with
// their owning domains (AI pipeline + forms). Kept loose here so the
// generated Database type compiles standalone without dragging in the
// (replaced) edge-function schema tree.
type CreateJobInput = Record<string, unknown>
type FormQuestion = Record<string, unknown>
type JobMatchCoreAnalysis = Record<string, unknown>
type ParsedJobData = Record<string, unknown>
type ResumeExtraction = Record<string, unknown>

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
export type ParsedJobDataJson = ParsedJobData;

// Screening interview configuration stored on job
export type ScreeningInterviewInformationJson =
  CreateJobInput["screeningInterviewInformation"];

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
