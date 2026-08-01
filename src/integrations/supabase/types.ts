// Thin wrapper around generated Supabase types.
// Do NOT edit database-generated.types.ts directly; it is regenerated.
// Add your JSON overrides in this file using MergeDeep if/when needed.

import type { MergeDeep } from "type-fest";

import type {
  CompositeTypes,
  Constants,
  Database as DatabaseGenerated,
  Enums,
  Json,
} from "./database-generated.types";

// Import all JSON type definitions from shared file
import type {
  AIAnalysisJson,
  AINonNegotiablesAnalysisJson,
  AIRequirementDetailJson,
  AIRequirementsAnalysisJson,
  ApplicationSummaryFormQuestionsJson,
  CompanySettingsJson,
  CustomQuestionTextJson,
  EducationJson,
  EmailBulletInsightsJson,
  EmailContentJson,
  FormQuestionsJson,
  FormSubmissionDataJson,
  InterviewQuestionCategoryJson,
  InterviewQuestionJson,
  InterviewQuestionTypeJson,
  InterviewSessionContextJson,
  ParsedJobDataJson,
  PotentialConcernJson,
  ProfilePermissionsJson,
  QuestionCompletedJson,
  QuestionFollowUpJson,
  ReachoutTemplateJson,
  RequirementItemJson,
  RequirementListJson,
  ResumeExtractionJson,
  ScreeningInterviewInformationJson,
  SkillWithEvidenceJson,
  WorkExperienceJson,
} from "./json-types.ts";

// Re-export all JSON types
export type {
  AIAnalysisJson,
  AINonNegotiablesAnalysisJson,
  AIRequirementDetailJson,
  AIRequirementsAnalysisJson,
  ApplicationSummaryFormQuestionsJson,
  CompanySettingsJson,
  CustomQuestionTextJson,
  EducationJson,
  EmailBulletInsightsJson,
  EmailContentJson,
  FormQuestionsJson,
  FormSubmissionDataJson,
  InterviewQuestionCategoryJson,
  InterviewQuestionJson,
  InterviewQuestionTypeJson,
  InterviewSessionContextJson,
  ParsedJobDataJson,
  PotentialConcernJson,
  ProfilePermissionsJson,
  QuestionCompletedJson,
  QuestionFollowUpJson,
  ReachoutTemplateJson,
  RequirementItemJson,
  RequirementListJson,
  ResumeExtractionJson,
  ScreeningInterviewInformationJson,
  SkillWithEvidenceJson,
  WorkExperienceJson,
};

// Merge overrides into generated Database ----------------------------
export type Database = MergeDeep<DatabaseGenerated, {
  public: {
    Tables: {
      company_settings: {
        Row: { settings: CompanySettingsJson }; // Done
        Insert: { settings?: CompanySettingsJson }; // Done
        Update: { settings?: CompanySettingsJson }; // Done
      };
      profiles: {
        Row: { permissions: ProfilePermissionsJson };
        Insert: { permissions?: ProfilePermissionsJson };
        Update: { permissions?: ProfilePermissionsJson };
      };
      form_submissions: {
        Row: {
          submission_data: FormSubmissionDataJson; // Done
        };
        Insert: {
          submission_data?: FormSubmissionDataJson; // Done
        };
        Update: {
          submission_data?: FormSubmissionDataJson; // Done
        };
      };
      form_templates: {
        Row: { questions: FormQuestionsJson }; // Done
        Insert: { questions?: FormQuestionsJson }; // Done
        Update: { questions?: FormQuestionsJson }; // Done
      };
      interview_sessions: {
        Row: {
          current_question_follow_ups: QuestionFollowUpJson[];
          interview_context: InterviewSessionContextJson;
          questions_completed: QuestionCompletedJson[];
        };
        Insert: {
          current_question_follow_ups?: QuestionFollowUpJson[];
          interview_context: InterviewSessionContextJson;
          questions_completed?: QuestionCompletedJson[];
        };
        Update: {
          current_question_follow_ups?: QuestionFollowUpJson[];
          interview_context?: InterviewSessionContextJson;
          questions_completed?: QuestionCompletedJson[];
        };
      };
      job_applications: {
        Row: {
          ai_analysis: AIAnalysisJson; // Done:AIAnalysisJson extends JobMatchAnalysis with overall_fit_score added by the edge function
          email_content: EmailContentJson; // Done
          parsed_candidate_data: ResumeExtractionJson; // Done
        };
        Insert: {
          ai_analysis?: AIAnalysisJson; // Done
          email_content?: EmailContentJson; // Done
          parsed_candidate_data?: ResumeExtractionJson; // Done
        };
        Update: {
          ai_analysis?: AIAnalysisJson; // Done
          email_content?: EmailContentJson; // Done
          parsed_candidate_data?: ResumeExtractionJson; // Done
        };
      };
      job_form_configs: {
        Row: {
          custom_question_text: CustomQuestionTextJson; // Done
          questions: FormQuestionsJson; // Done
        };
        Insert: {
          custom_question_text?: CustomQuestionTextJson;
          questions?: FormQuestionsJson;
        };
        Update: {
          custom_question_text?: CustomQuestionTextJson;
          questions?: FormQuestionsJson;
        };
      };
      jobs: {
        Row: {
          non_negotiables: RequirementListJson; // Done
          preferred_requirements: RequirementListJson; // Done
          parsed_job_data: ParsedJobDataJson; // Done
          screening_interview_information: ScreeningInterviewInformationJson; // Done
        };
        Insert: {
          non_negotiables?: RequirementListJson;
          preferred_requirements?: RequirementListJson;
          parsed_job_data?: ParsedJobDataJson;
          screening_interview_information?: ScreeningInterviewInformationJson;
        };
        Update: {
          non_negotiables?: RequirementListJson;
          preferred_requirements?: RequirementListJson;
          parsed_job_data?: ParsedJobDataJson;
          screening_interview_information?: ScreeningInterviewInformationJson;
        };
      };
    };
    Views: {
      application_summary_view: {
        Row: {
          form_questions: ApplicationSummaryFormQuestionsJson | null;
        };
      };
    };
  };
}>;

// Re-export helper aliases from MERGED database type ----------
// Extract Tables types from the merged Database type for proper JSON typing
export type Tables<
  TTableName extends keyof Database["public"]["Tables"] =
    keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TTableName]["Row"];

export type TablesInsert<
  TTableName extends keyof Database["public"]["Tables"] =
    keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TTableName]["Insert"];

export type TablesUpdate<
  TTableName extends keyof Database["public"]["Tables"] =
    keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TTableName]["Update"];

export type { CompositeTypes, Constants, Enums, Json };
