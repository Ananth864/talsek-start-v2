export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      billing_customers: {
        Row: {
          billing_admin_user_id: string
          billing_email: string
          billing_name: string
          company_id: string
          created_at: string
          dodo_customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          billing_admin_user_id: string
          billing_email: string
          billing_name: string
          company_id: string
          created_at?: string
          dodo_customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          billing_admin_user_id?: string
          billing_email?: string
          billing_name?: string
          company_id?: string
          created_at?: string
          dodo_customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_billing_admin_user_id_fkey"
            columns: ["billing_admin_user_id"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "billing_customers_billing_admin_user_id_fkey"
            columns: ["billing_admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          currency: string
          dodo_customer_id: string
          dodo_payment_id: string
          dodo_subscription_id: string | null
          id: string
          metadata: Json
          payment_type: Database["public"]["Enums"]["billing_product_type_enum"]
          refunded_amount_cents: number
          status: string
          tax_amount_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          currency?: string
          dodo_customer_id: string
          dodo_payment_id: string
          dodo_subscription_id?: string | null
          id?: string
          metadata?: Json
          payment_type: Database["public"]["Enums"]["billing_product_type_enum"]
          refunded_amount_cents?: number
          status: string
          tax_amount_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          currency?: string
          dodo_customer_id?: string
          dodo_payment_id?: string
          dodo_subscription_id?: string | null
          id?: string
          metadata?: Json
          payment_type?: Database["public"]["Enums"]["billing_product_type_enum"]
          refunded_amount_cents?: number
          status?: string
          tax_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products_config: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period_enum"]
          created_at: string
          credits_granted: number
          currency: string
          description: string
          display_name: string
          dodo_product_id: string
          id: string
          is_active: boolean
          metadata: Json
          plan_code: string
          price_cents: number
          service_costs_id: string
          updated_at: string
          validity_days: number
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period_enum"]
          created_at?: string
          credits_granted: number
          currency?: string
          description?: string
          display_name: string
          dodo_product_id: string
          id?: string
          is_active?: boolean
          metadata?: Json
          plan_code: string
          price_cents: number
          service_costs_id: string
          updated_at?: string
          validity_days?: number
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period_enum"]
          created_at?: string
          credits_granted?: number
          currency?: string
          description?: string
          display_name?: string
          dodo_product_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          plan_code?: string
          price_cents?: number
          service_costs_id?: string
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_products_config_service_costs_id_fkey"
            columns: ["service_costs_id"]
            isOneToOne: false
            referencedRelation: "service_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          dodo_product_id: string
          dodo_subscription_id: string
          id: string
          is_on_demand: boolean
          metadata: Json
          plan_code: string
          quantity: number
          status: Database["public"]["Enums"]["subscription_status_enum"]
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          company_id: string
          created_at?: string
          current_period_end: string
          current_period_start: string
          dodo_product_id: string
          dodo_subscription_id: string
          id?: string
          is_on_demand?: boolean
          metadata?: Json
          plan_code: string
          quantity?: number
          status: Database["public"]["Enums"]["subscription_status_enum"]
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          dodo_product_id?: string
          dodo_subscription_id?: string
          id?: string
          is_on_demand?: boolean
          metadata?: Json
          plan_code?: string
          quantity?: number
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          auto_refill_amount_cents: number
          auto_refill_enabled: boolean
          auto_refill_threshold_credits: number
          company_id: string
          company_size: string
          last_auto_refill_at: string
          low_balance_alert_threshold: number
          settings: Json
          updated_at: string
        }
        Insert: {
          auto_refill_amount_cents?: number
          auto_refill_enabled?: boolean
          auto_refill_threshold_credits?: number
          company_id: string
          company_size?: string
          last_auto_refill_at?: string
          low_balance_alert_threshold?: number
          settings?: Json
          updated_at?: string
        }
        Update: {
          auto_refill_amount_cents?: number
          auto_refill_enabled?: boolean
          auto_refill_threshold_credits?: number
          company_id?: string
          company_size?: string
          last_auto_refill_at?: string
          low_balance_alert_threshold?: number
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          amount_initial: number
          amount_remaining: number
          company_id: string
          created_at: string
          expires_at: string
          id: string
          source_payment_id: string | null
          source_type: Database["public"]["Enums"]["credit_source_enum"]
        }
        Insert: {
          amount_initial: number
          amount_remaining: number
          company_id: string
          created_at?: string
          expires_at: string
          id?: string
          source_payment_id?: string | null
          source_type: Database["public"]["Enums"]["credit_source_enum"]
        }
        Update: {
          amount_initial?: number
          amount_remaining?: number
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          source_payment_id?: string | null
          source_type?: Database["public"]["Enums"]["credit_source_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_source_payment_id_fkey"
            columns: ["source_payment_id"]
            isOneToOne: false
            referencedRelation: "billing_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          company_id: string
          created_at: string
          description: string
          id: string
          ledger_entry_id: string | null
          reference_id: string | null
          reference_type: string
          transaction_type: Database["public"]["Enums"]["credit_transaction_type_enum"]
        }
        Insert: {
          amount: number
          balance_after: number
          company_id: string
          created_at?: string
          description: string
          id?: string
          ledger_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string
          transaction_type: Database["public"]["Enums"]["credit_transaction_type_enum"]
        }
        Update: {
          amount?: number
          balance_after?: number
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          ledger_entry_id?: string | null
          reference_id?: string | null
          reference_type?: string
          transaction_type?: Database["public"]["Enums"]["credit_transaction_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          candidate_id: string
          id: string
          ip_address: unknown
          job_form_config_id: string
          processed_at: string | null
          processing_status: string
          resume_path: string
          submission_data: Json
          submitted_at: string
          user_agent: string
        }
        Insert: {
          candidate_id: string
          id?: string
          ip_address: unknown
          job_form_config_id: string
          processed_at?: string | null
          processing_status?: string
          resume_path: string
          submission_data?: Json
          submitted_at?: string
          user_agent: string
        }
        Update: {
          candidate_id?: string
          id?: string
          ip_address?: unknown
          job_form_config_id?: string
          processed_at?: string | null
          processing_status?: string
          resume_path?: string
          submission_data?: Json
          submitted_at?: string
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_job_form_config_id_fkey"
            columns: ["job_form_config_id"]
            isOneToOne: false
            referencedRelation: "job_form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          questions: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          questions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_stages: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string
          current_question_follow_ups: Json
          current_question_index: number
          expires_at: string
          id: string
          interview_context: Json
          job_application_id: string
          job_id: string
          questions_completed: Json
          started_at: string | null
          status: Database["public"]["Enums"]["interview_session_status"]
          token: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          current_question_follow_ups?: Json
          current_question_index?: number
          expires_at?: string
          id?: string
          interview_context: Json
          job_application_id: string
          job_id: string
          questions_completed?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          current_question_follow_ups?: Json
          current_question_index?: number
          expires_at?: string
          id?: string
          interview_context?: Json
          job_application_id?: string
          job_id?: string
          questions_completed?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          ai_analysis: Json
          candidate_id: string
          candidate_name: string
          created_at: string
          current_stage_id: string
          email_content: Json
          final_score: number
          id: string
          job_id: string
          match_score: number
          meets_all_non_negotiables: boolean
          parsed_candidate_data: Json
          preferred_requirements_matched: number
          processing_source: Database["public"]["Enums"]["processing_source_enum"]
          resume_url: string
          starred: boolean
          status: Database["public"]["Enums"]["job_application_status_enum"]
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json
          candidate_id: string
          candidate_name?: string
          created_at?: string
          current_stage_id: string
          email_content?: Json
          final_score?: number
          id?: string
          job_id: string
          match_score?: number
          meets_all_non_negotiables?: boolean
          parsed_candidate_data?: Json
          preferred_requirements_matched?: number
          processing_source?: Database["public"]["Enums"]["processing_source_enum"]
          resume_url?: string
          starred?: boolean
          status?: Database["public"]["Enums"]["job_application_status_enum"]
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json
          candidate_id?: string
          candidate_name?: string
          created_at?: string
          current_stage_id?: string
          email_content?: Json
          final_score?: number
          id?: string
          job_id?: string
          match_score?: number
          meets_all_non_negotiables?: boolean
          parsed_candidate_data?: Json
          preferred_requirements_matched?: number
          processing_source?: Database["public"]["Enums"]["processing_source_enum"]
          resume_url?: string
          starred?: boolean
          status?: Database["public"]["Enums"]["job_application_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "job_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_form_configs: {
        Row: {
          created_at: string
          custom_question_text: Json
          expires_at: string
          form_template_id: string
          form_url_token: string
          id: string
          is_enabled: boolean
          job_id: string
          questions: Json
        }
        Insert: {
          created_at?: string
          custom_question_text?: Json
          expires_at?: string
          form_template_id: string
          form_url_token: string
          id?: string
          is_enabled?: boolean
          job_id: string
          questions?: Json
        }
        Update: {
          created_at?: string
          custom_question_text?: Json
          expires_at?: string
          form_template_id?: string
          form_url_token?: string
          id?: string
          is_enabled?: boolean
          job_id?: string
          questions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "job_form_configs_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_form_configs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_form_configs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stages: {
        Row: {
          created_at: string
          id: string
          job_id: string
          stage_id: string
          stage_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          stage_id: string
          stage_order: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          stage_id?: string
          stage_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_stages_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: string
          created_at: string
          forwarding_code: string
          forwarding_email: string
          id: string
          job_description_raw: string
          job_posting_link: string
          location: string
          non_negotiables: Json
          parsed_job_data: Json
          preferred_requirements: Json
          salary_range: string
          screening_interview_information: Json
          status: Database["public"]["Enums"]["job_status_enum"]
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          forwarding_code: string
          forwarding_email: string
          id?: string
          job_description_raw?: string
          job_posting_link?: string
          location?: string
          non_negotiables?: Json
          parsed_job_data?: Json
          preferred_requirements?: Json
          salary_range?: string
          screening_interview_information?: Json
          status?: Database["public"]["Enums"]["job_status_enum"]
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          forwarding_code?: string
          forwarding_email?: string
          id?: string
          job_description_raw?: string
          job_posting_link?: string
          location?: string
          non_negotiables?: Json
          parsed_job_data?: Json
          preferred_requirements?: Json
          salary_range?: string
          screening_interview_information?: Json
          status?: Database["public"]["Enums"]["job_status_enum"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          dodo_customer_id: string | null
          dodo_payment_id: string | null
          dodo_subscription_id: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string
          status: string
          webhook_id: string
        }
        Insert: {
          dodo_customer_id?: string | null
          dodo_payment_id?: string | null
          dodo_subscription_id?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
          status?: string
          webhook_id: string
        }
        Update: {
          dodo_customer_id?: string | null
          dodo_payment_id?: string | null
          dodo_subscription_id?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          status?: string
          webhook_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          candidate_list_view: Database["public"]["Enums"]["candidate_list_view_type"]
          company_id: string | null
          created_at: string
          email: string
          email_notifications_enabled: boolean
          first_name: string
          id: string
          last_name: string
          must_change_password: boolean
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          candidate_list_view?: Database["public"]["Enums"]["candidate_list_view_type"]
          company_id?: string | null
          created_at?: string
          email: string
          email_notifications_enabled?: boolean
          first_name: string
          id: string
          last_name: string
          must_change_password?: boolean
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          candidate_list_view?: Database["public"]["Enums"]["candidate_list_view_type"]
          company_id?: string | null
          created_at?: string
          email?: string
          email_notifications_enabled?: boolean
          first_name?: string
          id?: string
          last_name?: string
          must_change_password?: boolean
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_reachout_emails: {
        Row: {
          bounced_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          job_application_id: string
          recipient_email: string
          reply_to_email: string
          sender_email: string
          sendgrid_message_id: string
          sent_at: string | null
          sent_by: string
          status: string | null
          subject: string
          target_stage_id: string | null
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          job_application_id: string
          recipient_email: string
          reply_to_email: string
          sender_email: string
          sendgrid_message_id: string
          sent_at?: string | null
          sent_by: string
          status?: string | null
          subject: string
          target_stage_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          job_application_id?: string
          recipient_email?: string
          reply_to_email?: string
          sender_email?: string
          sendgrid_message_id?: string
          sent_at?: string | null
          sent_by?: string
          status?: string | null
          subject?: string
          target_stage_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_reachout_emails_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_reachout_emails_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "application_summary_view"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sent_reachout_emails_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_reachout_emails_target_stage_id_fkey"
            columns: ["target_stage_id"]
            isOneToOne: false
            referencedRelation: "job_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      service_costs: {
        Row: {
          created_at: string
          id: string
          name: string
          resume_screening_cost: number
          screening_interview_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          resume_screening_cost: number
          screening_interview_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          resume_screening_cost?: number
          screening_interview_cost?: number
        }
        Relationships: []
      }
    }
    Views: {
      application_summary_view: {
        Row: {
          average_count: number | null
          below_average_count: number | null
          client_email: string | null
          client_first_name: string | null
          client_id: string | null
          client_last_name: string | null
          company_id: string | null
          company_name: string | null
          cutoff_time: string | null
          excellent_count: number | null
          good_count: number | null
          job_id: string | null
          job_title: string | null
          total_applications: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      attempt_auto_refill_lock: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      can_submit_form: {
        Args: { candidate_email: string; config_id: string }
        Returns: boolean
      }
      check_duplicate_application_email: {
        Args: { candidate_email: string; target_job_id: string }
        Returns: number
      }
      consume_company_credits:
        | {
            Args: {
              p_amount: number
              p_company_id: string
              p_description?: string
              p_reference_id?: string
              p_reference_type?: string
            }
            Returns: {
              error_message: string
              remaining_balance: number
              success: boolean
            }[]
          }
        | {
            Args: {
              p_amount: number
              p_company_id: string
              p_description?: string
              p_reference_id?: string
              p_reference_type?: string
              p_transaction_type?: Database["public"]["Enums"]["credit_transaction_type_enum"]
            }
            Returns: {
              error_message: string
              remaining_balance: number
              success: boolean
            }[]
          }
      create_default_form_template: {
        Args: { target_company_id: string }
        Returns: string
      }
      delete_candidate_completely: {
        Args: { candidate_id: string }
        Returns: boolean
      }
      expire_old_credits: { Args: never; Returns: number }
      find_or_create_candidate: {
        Args: { candidate_email: string }
        Returns: string
      }
      generate_form_url_token: { Args: never; Returns: string }
      get_companies_needing_auto_refill: {
        Args: never
        Returns: {
          auto_refill_amount_cents: number
          auto_refill_plan_code: string
          company_id: string
          current_balance: number
          dodo_subscription_id: string
        }[]
      }
      get_company_credit_balance: {
        Args: { p_company_id: string }
        Returns: number
      }
      get_company_service_cost: {
        Args: { p_company_id: string; p_service_code: string }
        Returns: number
      }
      get_company_service_rates: {
        Args: { p_company_id: string }
        Returns: {
          plan_name: string
          resume_screening_cost: number
          screening_interview_cost: number
        }[]
      }
      get_form_config_by_token: {
        Args: { form_token: string }
        Returns: {
          company_name: string
          config_id: string
          expires_at: string
          form_questions: Json
          is_enabled: boolean
          job_id: string
          job_title: string
        }[]
      }
      get_job_stage_counts: {
        Args: { p_company_id: string; p_job_id: string }
        Returns: {
          candidate_count: number
          stage_id: string
          stage_name: string
          stage_order: number
        }[]
      }
      get_or_create_form_template: {
        Args: { target_company_id: string }
        Returns: string
      }
      get_user_company_role: {
        Args: { target_company_id: string }
        Returns: string
      }
      get_user_email_summary: {
        Args: { user_email: string }
        Returns: {
          average_count: number
          below_average_count: number
          company_name: string
          excellent_count: number
          good_count: number
          job_title: string
          total_applications: number
        }[]
      }
      should_user_receive_notification: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_belongs_to_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      user_is_company_admin: {
        Args: { target_company_id: string }
        Returns: boolean
      }
    }
    Enums: {
      billing_period_enum: "monthly" | "yearly"
      billing_product_type_enum: "subscription" | "topup"
      candidate_list_view_type: "list" | "grid"
      company_plan_type_enum: "free" | "paid" | "grandfathered" | "custom"
      credit_source_enum: "subscription" | "topup" | "bonus"
      credit_transaction_type_enum:
        | "purchase"
        | "consume"
        | "expire"
        | "refund"
        | "bonus"
        | "screening_interview"
        | "resume_screening"
      interview_session_processing_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "expired"
      interview_session_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "expired"
      job_application_status_enum:
        | "pending"
        | "processing"
        | "active"
        | "failed"
        | "failed_validation"
        | "rejected"
        | "hired"
      job_status_enum: "active" | "closed" | "paused"
      processing_source_enum: "email" | "form" | "bulk_upload"
      subscription_status_enum:
        | "active"
        | "on_hold"
        | "cancelled"
        | "expired"
        | "pending"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_period_enum: ["monthly", "yearly"],
      billing_product_type_enum: ["subscription", "topup"],
      candidate_list_view_type: ["list", "grid"],
      company_plan_type_enum: ["free", "paid", "grandfathered", "custom"],
      credit_source_enum: ["subscription", "topup", "bonus"],
      credit_transaction_type_enum: [
        "purchase",
        "consume",
        "expire",
        "refund",
        "bonus",
        "screening_interview",
        "resume_screening",
      ],
      interview_session_processing_status: [
        "pending",
        "in_progress",
        "completed",
        "expired",
      ],
      interview_session_status: [
        "pending",
        "in_progress",
        "completed",
        "expired",
      ],
      job_application_status_enum: [
        "pending",
        "processing",
        "active",
        "failed",
        "failed_validation",
        "rejected",
        "hired",
      ],
      job_status_enum: ["active", "closed", "paused"],
      processing_source_enum: ["email", "form", "bulk_upload"],
      subscription_status_enum: [
        "active",
        "on_hold",
        "cancelled",
        "expired",
        "pending",
        "failed",
      ],
    },
  },
} as const
