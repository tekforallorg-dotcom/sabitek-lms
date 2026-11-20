// GENERATED FILE - do not edit by hand.
//
// TypeScript types for the Sabitek Supabase database, generated from the live
// project (jlylhwytecmhpaekffws) on 2026-11-20.
//
// Regenerate after every schema change:
//   npx supabase gen types typescript --project-id jlylhwytecmhpaekffws > types/supabase.ts
// (or the Supabase dashboard: API Docs -> Generate types), then re-add this header.

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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      advisor_ai_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hit_count: number | null
          id: string
          input_hash: string
          operation_type: string
          output_data: Json
          output_ref_id: string | null
          output_ref_table: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          input_hash: string
          operation_type: string
          output_data: Json
          output_ref_id?: string | null
          output_ref_table?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          input_hash?: string
          operation_type?: string
          output_data?: Json
          output_ref_id?: string | null
          output_ref_table?: string | null
        }
        Relationships: []
      }
      advisor_operations: {
        Row: {
          completed_at: string | null
          cost_kobo: number
          duration_ms: number | null
          error_message: string | null
          id: string
          input_summary: Json | null
          module: string
          operation_type: string
          output_id: string | null
          output_table: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
          wallet_ledger_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost_kobo: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          module: string
          operation_type: string
          output_id?: string | null
          output_table?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          wallet_ledger_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost_kobo?: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          module?: string
          operation_type?: string
          output_id?: string | null
          output_table?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
          wallet_ledger_id?: string | null
        }
        Relationships: []
      }
      advisor_pricing: {
        Row: {
          base_cost_kobo: number
          cache_ttl_hours: number | null
          cacheable: boolean | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          module: string
          operation_type: string
          requires_profile: boolean | null
          updated_at: string | null
        }
        Insert: {
          base_cost_kobo: number
          cache_ttl_hours?: number | null
          cacheable?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          module: string
          operation_type: string
          requires_profile?: boolean | null
          updated_at?: string | null
        }
        Update: {
          base_cost_kobo?: number
          cache_ttl_hours?: number | null
          cacheable?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          module?: string
          operation_type?: string
          requires_profile?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          cache_read_tokens: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string | null
        }
        Insert: {
          cache_read_tokens?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          user_id?: string | null
        }
        Update: {
          cache_read_tokens?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      career_profiles: {
        Row: {
          certifications: Json | null
          created_at: string | null
          education: Json | null
          email: string | null
          full_name: string | null
          id: string
          last_import_source: string | null
          links: Json | null
          location: string | null
          phone: string | null
          preferred_industries: Json | null
          profile_completeness: number | null
          projects: Json | null
          skills: Json | null
          summary: string | null
          target_roles: Json | null
          updated_at: string | null
          user_id: string | null
          work_experience: Json | null
        }
        Insert: {
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_import_source?: string | null
          links?: Json | null
          location?: string | null
          phone?: string | null
          preferred_industries?: Json | null
          profile_completeness?: number | null
          projects?: Json | null
          skills?: Json | null
          summary?: string | null
          target_roles?: Json | null
          updated_at?: string | null
          user_id?: string | null
          work_experience?: Json | null
        }
        Update: {
          certifications?: Json | null
          created_at?: string | null
          education?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_import_source?: string | null
          links?: Json | null
          location?: string | null
          phone?: string | null
          preferred_industries?: Json | null
          profile_completeness?: number | null
          projects?: Json | null
          skills?: Json | null
          summary?: string | null
          target_roles?: Json | null
          updated_at?: string | null
          user_id?: string | null
          work_experience?: Json | null
        }
        Relationships: []
      }
      career_results: {
        Row: {
          alternative_tracks: Json | null
          cert_map: Json | null
          confidence: number | null
          created_at: string | null
          id: string
          next_steps: Json | null
          plan_12w: Json | null
          plan_7d: Json | null
          primary_tracks: Json | null
          rationale: string | null
          roadmap_6m: Json | null
          survey_id: string | null
          top_tracks: Json
          user_id: string | null
        }
        Insert: {
          alternative_tracks?: Json | null
          cert_map?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          next_steps?: Json | null
          plan_12w?: Json | null
          plan_7d?: Json | null
          primary_tracks?: Json | null
          rationale?: string | null
          roadmap_6m?: Json | null
          survey_id?: string | null
          top_tracks: Json
          user_id?: string | null
        }
        Update: {
          alternative_tracks?: Json | null
          cert_map?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          next_steps?: Json | null
          plan_12w?: Json | null
          plan_7d?: Json | null
          primary_tracks?: Json | null
          rationale?: string | null
          roadmap_6m?: Json | null
          survey_id?: string | null
          top_tracks?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_results_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "career_surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      career_surveys: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_surveys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_url: string | null
          completion_date: string
          course_id: string | null
          created_at: string
          grade_percentage: number | null
          id: string
          issued_at: string
          kind: string
          program_id: string | null
          revoke_reason: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          certificate_url?: string | null
          completion_date: string
          course_id?: string | null
          created_at?: string
          grade_percentage?: number | null
          id?: string
          issued_at?: string
          kind?: string
          program_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          certificate_url?: string | null
          completion_date?: string
          course_id?: string | null
          created_at?: string
          grade_percentage?: number | null
          id?: string
          issued_at?: string
          kind?: string
          program_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          assistant_message: string
          created_at: string | null
          id: string
          user_id: string | null
          user_message: string
        }
        Insert: {
          assistant_message: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          user_message: string
        }
        Update: {
          assistant_message?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      cohort_invites: {
        Row: {
          cohort_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          metadata: Json
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["cohort_invite_status"]
          token: string
          type: Database["public"]["Enums"]["cohort_invite_type"]
          use_count: number
        }
        Insert: {
          cohort_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["cohort_invite_status"]
          token: string
          type?: Database["public"]["Enums"]["cohort_invite_type"]
          use_count?: number
        }
        Update: {
          cohort_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["cohort_invite_status"]
          token?: string
          type?: Database["public"]["Enums"]["cohort_invite_type"]
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cohort_invites_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_invites_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          cohort_id: string
          completed_at: string | null
          completion_certificate_id: string | null
          courses_completed: number | null
          created_at: string | null
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          last_activity_at: string | null
          progress_pct: number | null
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          sponsor_reference: string | null
          sponsorship: Database["public"]["Enums"]["sponsorship_type"]
          status: Database["public"]["Enums"]["cohort_member_status"]
          updated_at: string | null
          user_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cohort_id: string
          completed_at?: string | null
          completion_certificate_id?: string | null
          courses_completed?: number | null
          created_at?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_activity_at?: string | null
          progress_pct?: number | null
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          sponsor_reference?: string | null
          sponsorship?: Database["public"]["Enums"]["sponsorship_type"]
          status?: Database["public"]["Enums"]["cohort_member_status"]
          updated_at?: string | null
          user_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cohort_id?: string
          completed_at?: string | null
          completion_certificate_id?: string | null
          courses_completed?: number | null
          created_at?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_activity_at?: string | null
          progress_pct?: number | null
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          sponsor_reference?: string | null
          sponsorship?: Database["public"]["Enums"]["sponsorship_type"]
          status?: Database["public"]["Enums"]["cohort_member_status"]
          updated_at?: string | null
          user_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          access_code: string | null
          access_code_expires_at: string | null
          access_code_max_uses: number | null
          access_code_uses: number | null
          allow_late_enrollment: boolean | null
          code_expires_at: string | null
          code_max_uses: number | null
          created_at: string | null
          created_by: string | null
          default_sponsorship:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          description: string | null
          end_date: string | null
          enrollment_end_date: string | null
          enrollment_mode: Database["public"]["Enums"]["cohort_enrollment_mode"]
          enrollment_start_date: string | null
          id: string
          name: string
          program_id: string
          seat_limit: number | null
          send_reminder_emails: boolean | null
          send_welcome_email: boolean | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["cohort_status"]
          updated_at: string | null
        }
        Insert: {
          access_code?: string | null
          access_code_expires_at?: string | null
          access_code_max_uses?: number | null
          access_code_uses?: number | null
          allow_late_enrollment?: boolean | null
          code_expires_at?: string | null
          code_max_uses?: number | null
          created_at?: string | null
          created_by?: string | null
          default_sponsorship?:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          description?: string | null
          end_date?: string | null
          enrollment_end_date?: string | null
          enrollment_mode?: Database["public"]["Enums"]["cohort_enrollment_mode"]
          enrollment_start_date?: string | null
          id?: string
          name: string
          program_id: string
          seat_limit?: number | null
          send_reminder_emails?: boolean | null
          send_welcome_email?: boolean | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          updated_at?: string | null
        }
        Update: {
          access_code?: string | null
          access_code_expires_at?: string | null
          access_code_max_uses?: number | null
          access_code_uses?: number | null
          allow_late_enrollment?: boolean | null
          code_expires_at?: string | null
          code_max_uses?: number | null
          created_at?: string | null
          created_by?: string | null
          default_sponsorship?:
            | Database["public"]["Enums"]["sponsorship_type"]
            | null
          description?: string | null
          end_date?: string | null
          enrollment_end_date?: string | null
          enrollment_mode?: Database["public"]["Enums"]["cohort_enrollment_mode"]
          enrollment_start_date?: string | null
          id?: string
          name?: string
          program_id?: string
          seat_limit?: number | null
          send_reminder_emails?: boolean | null
          send_welcome_email?: boolean | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      community_offers: {
        Row: {
          created_at: string | null
          id: string
          mentor_id: string
          message: string | null
          proposed_rate_ngn: number | null
          request_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_id: string
          message?: string | null
          proposed_rate_ngn?: number | null
          request_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_id?: string
          message?: string | null
          proposed_rate_ngn?: number | null
          request_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_offers_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      community_profiles: {
        Row: {
          bio: string | null
          completion_rate: number | null
          created_at: string | null
          display_name: string | null
          id: string
          is_available_to_mentor: boolean | null
          is_looking_to_learn: boolean | null
          is_public: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          languages: Database["public"]["Enums"]["spoken_language"][] | null
          location: string | null
          meeting_link: string | null
          preferred_meeting_methods:
            | Database["public"]["Enums"]["meeting_method"][]
            | null
          preferred_session_lengths:
            | Database["public"]["Enums"]["session_length"][]
            | null
          response_time_hours: number | null
          suspended_at: string | null
          suspended_reason: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          completion_rate?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_available_to_mentor?: boolean | null
          is_looking_to_learn?: boolean | null
          is_public?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          languages?: Database["public"]["Enums"]["spoken_language"][] | null
          location?: string | null
          meeting_link?: string | null
          preferred_meeting_methods?:
            | Database["public"]["Enums"]["meeting_method"][]
            | null
          preferred_session_lengths?:
            | Database["public"]["Enums"]["session_length"][]
            | null
          response_time_hours?: number | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          completion_rate?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_available_to_mentor?: boolean | null
          is_looking_to_learn?: boolean | null
          is_public?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          languages?: Database["public"]["Enums"]["spoken_language"][] | null
          location?: string | null
          meeting_link?: string | null
          preferred_meeting_methods?:
            | Database["public"]["Enums"]["meeting_method"][]
            | null
          preferred_session_lengths?:
            | Database["public"]["Enums"]["session_length"][]
            | null
          response_time_hours?: number | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          extracted_at: string | null
          extracted_from_message_id: string | null
          id: string
          insight_content: string
          insight_type: string
          is_active: boolean | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_from_message_id?: string | null
          id?: string
          insight_content: string
          insight_type: string
          is_active?: boolean | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          extracted_at?: string | null
          extracted_from_message_id?: string | null
          id?: string
          insight_content?: string
          insight_type?: string
          is_active?: boolean | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      course_discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          amount: number
          course_id: string
          created_at: string | null
          currency: string
          id: string
          provider: string | null
          provider_transaction_id: string | null
          provider_tx_ref: string | null
          purchased_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string | null
          currency?: string
          id?: string
          provider?: string | null
          provider_transaction_id?: string | null
          provider_tx_ref?: string | null
          purchased_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          provider?: string | null
          provider_transaction_id?: string | null
          provider_tx_ref?: string | null
          purchased_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          estimated_duration_minutes: number | null
          id: string
          institution_id: string | null
          instructor_id: string
          intro_video_url: string | null
          is_free: boolean | null
          price: number | null
          price_cents: number | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"] | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          trailer_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          institution_id?: string | null
          instructor_id: string
          intro_video_url?: string | null
          is_free?: boolean | null
          price?: number | null
          price_cents?: number | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          trailer_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          institution_id?: string | null
          instructor_id?: string
          intro_video_url?: string | null
          is_free?: boolean | null
          price?: number | null
          price_cents?: number | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          trailer_video_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letter_documents: {
        Row: {
          action: string | null
          company_name: string | null
          created_at: string | null
          id: string
          insights: Json | null
          is_current: boolean | null
          length: string | null
          letter_text: string | null
          parent_id: string | null
          sections: Json | null
          status: string | null
          target_role: string
          tone: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          action?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          is_current?: boolean | null
          length?: string | null
          letter_text?: string | null
          parent_id?: string | null
          sections?: Json | null
          status?: string | null
          target_role: string
          tone?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          action?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          insights?: Json | null
          is_current?: boolean | null
          length?: string | null
          letter_text?: string | null
          parent_id?: string | null
          sections?: Json | null
          status?: string | null
          target_role?: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_letter_documents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cover_letter_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          company_name: string | null
          company_research: Json | null
          created_at: string | null
          cv_id: string | null
          facts_used: Json | null
          full_text: string | null
          id: string
          is_current: boolean | null
          job_description_text: string | null
          job_title: string | null
          length: string | null
          parent_version_id: string | null
          profile_id: string | null
          sections: Json | null
          status: string | null
          title: string | null
          tone: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          company_name?: string | null
          company_research?: Json | null
          created_at?: string | null
          cv_id?: string | null
          facts_used?: Json | null
          full_text?: string | null
          id?: string
          is_current?: boolean | null
          job_description_text?: string | null
          job_title?: string | null
          length?: string | null
          parent_version_id?: string | null
          profile_id?: string | null
          sections?: Json | null
          status?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          company_name?: string | null
          company_research?: Json | null
          created_at?: string | null
          cv_id?: string | null
          facts_used?: Json | null
          full_text?: string | null
          id?: string
          is_current?: boolean | null
          job_description_text?: string | null
          job_title?: string | null
          length?: string | null
          parent_version_id?: string | null
          profile_id?: string | null
          sections?: Json | null
          status?: string | null
          title?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cv_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_documents: {
        Row: {
          ats_score: number | null
          ats_warnings: Json | null
          company_name: string | null
          created_at: string | null
          format: string | null
          id: string
          is_current: boolean | null
          job_description_keywords: Json | null
          job_description_text: string | null
          level: string | null
          parent_version_id: string | null
          profile_id: string | null
          region: string | null
          sections: Json | null
          status: string | null
          target_role: string
          title: string | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          ats_score?: number | null
          ats_warnings?: Json | null
          company_name?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          is_current?: boolean | null
          job_description_keywords?: Json | null
          job_description_text?: string | null
          level?: string | null
          parent_version_id?: string | null
          profile_id?: string | null
          region?: string | null
          sections?: Json | null
          status?: string | null
          target_role: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          ats_score?: number | null
          ats_warnings?: Json | null
          company_name?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          is_current?: boolean | null
          job_description_keywords?: Json | null
          job_description_text?: string | null
          level?: string | null
          parent_version_id?: string | null
          profile_id?: string | null
          region?: string | null
          sections?: Json | null
          status?: string | null
          target_role?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_documents_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "cv_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key: string
          source: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key: string
          source?: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          source?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_runs: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          material_id: string | null
          model_used: string | null
          questions_approved: number | null
          questions_generated: number | null
          stats: Json | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          material_id?: string | null
          model_used?: string | null
          questions_approved?: number | null
          questions_generated?: number | null
          stats?: Json | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          material_id?: string | null
          model_used?: string | null
          questions_approved?: number | null
          questions_generated?: number | null
          stats?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_runs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_applications: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          email: string
          full_name: string
          id: string
          institution_id: string | null
          learner_count: string | null
          org_type: string
          organisation_name: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_title: string | null
          status: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          email: string
          full_name: string
          id?: string
          institution_id?: string | null
          learner_count?: string | null
          org_type?: string
          organisation_name: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string
          full_name?: string
          id?: string
          institution_id?: string | null
          learner_count?: string | null
          org_type?: string
          organisation_name?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_invites: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          expires_at: string | null
          id: string
          institution_id: string
          max_uses: number | null
          metadata: Json
          revoked_at: string | null
          revoked_by: string | null
          role: Database["public"]["Enums"]["institution_role"]
          status: Database["public"]["Enums"]["cohort_invite_status"]
          token: string
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string | null
          id?: string
          institution_id: string
          max_uses?: number | null
          metadata?: Json
          revoked_at?: string | null
          revoked_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          status?: Database["public"]["Enums"]["cohort_invite_status"]
          token: string
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          institution_id?: string
          max_uses?: number | null
          metadata?: Json
          revoked_at?: string | null
          revoked_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          status?: Database["public"]["Enums"]["cohort_invite_status"]
          token?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "institution_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_invites_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_invites_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          institution_id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["institution_role"]
          status: Database["public"]["Enums"]["institution_member_status"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          institution_id: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          status?: Database["public"]["Enums"]["institution_member_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["institution_role"]
          status?: Database["public"]["Enums"]["institution_member_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_members_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          accent_color: string | null
          address: string | null
          banner_url: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          email_domain_allowlist: string[] | null
          id: string
          kpi_pack: Json | null
          lga: string | null
          logo_url: string | null
          name: string
          onboarding_pack: Json | null
          rejection_reason: string | null
          reporting_pack: Json | null
          required_fields_pack: Json | null
          review_notes: string | null
          reviewed_by: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["institution_status"]
          terminology_pack: Json | null
          type: Database["public"]["Enums"]["institution_type"]
          updated_at: string
          verified_at: string | null
          vertical_metadata: Json | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email_domain_allowlist?: string[] | null
          id?: string
          kpi_pack?: Json | null
          lga?: string | null
          logo_url?: string | null
          name: string
          onboarding_pack?: Json | null
          rejection_reason?: string | null
          reporting_pack?: Json | null
          required_fields_pack?: Json | null
          review_notes?: string | null
          reviewed_by?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["institution_status"]
          terminology_pack?: Json | null
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          verified_at?: string | null
          vertical_metadata?: Json | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email_domain_allowlist?: string[] | null
          id?: string
          kpi_pack?: Json | null
          lga?: string | null
          logo_url?: string | null
          name?: string
          onboarding_pack?: Json | null
          rejection_reason?: string | null
          reporting_pack?: Json | null
          required_fields_pack?: Json | null
          review_notes?: string | null
          reviewed_by?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["institution_status"]
          terminology_pack?: Json | null
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          verified_at?: string | null
          vertical_metadata?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          can_monetize: boolean | null
          can_publish_public: boolean | null
          created_at: string
          headline: string | null
          id: string
          institution_id: string | null
          rejection_reason: string | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["instructor_status"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          can_monetize?: boolean | null
          can_publish_public?: boolean | null
          created_at?: string
          headline?: string | null
          id?: string
          institution_id?: string | null
          rejection_reason?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["instructor_status"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          can_monetize?: boolean | null
          can_publish_public?: boolean | null
          created_at?: string
          headline?: string | null
          id?: string
          institution_id?: string | null
          rejection_reason?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["instructor_status"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          feedback: Json | null
          id: string
          improved_answer: string | null
          question_id: string
          question_text: string
          score: number | null
          session_id: string | null
          user_answer: string | null
          user_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          improved_answer?: string | null
          question_id: string
          question_text: string
          score?: number | null
          session_id?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          improved_answer?: string | null
          question_id?: string
          question_text?: string
          score?: number | null
          session_id?: string | null
          user_answer?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_kits: {
        Row: {
          company_name: string | null
          created_at: string | null
          difficulty: string | null
          focus_areas: Json | null
          id: string
          input_hash: string | null
          prep_tips: Json | null
          profile_id: string | null
          questions: Json | null
          scoring_rubric: Json | null
          status: string | null
          target_role: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          focus_areas?: Json | null
          id?: string
          input_hash?: string | null
          prep_tips?: Json | null
          profile_id?: string | null
          questions?: Json | null
          scoring_rubric?: Json | null
          status?: string | null
          target_role: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          difficulty?: string | null
          focus_areas?: Json | null
          id?: string
          input_hash?: string | null
          prep_tips?: Json | null
          profile_id?: string | null
          questions?: Json | null
          scoring_rubric?: Json | null
          status?: string | null
          target_role?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_kits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          average_score: number | null
          completed_at: string | null
          completed_questions: number | null
          current_question_index: number | null
          id: string
          kit_id: string | null
          mode: string | null
          questions_asked: Json | null
          started_at: string | null
          status: string | null
          total_score: number | null
          user_id: string | null
        }
        Insert: {
          average_score?: number | null
          completed_at?: string | null
          completed_questions?: number | null
          current_question_index?: number | null
          id?: string
          kit_id?: string | null
          mode?: string | null
          questions_asked?: Json | null
          started_at?: string | null
          status?: string | null
          total_score?: number | null
          user_id?: string | null
        }
        Update: {
          average_score?: number | null
          completed_at?: string | null
          completed_questions?: number | null
          current_question_index?: number | null
          id?: string
          kit_id?: string | null
          mode?: string | null
          questions_asked?: Json | null
          started_at?: string | null
          status?: string | null
          total_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "interview_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_milestones: {
        Row: {
          achieved_at: string | null
          celebrated: boolean | null
          created_at: string | null
          id: string
          metadata: Json | null
          milestone_description: string | null
          milestone_name: string
          milestone_type: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          celebrated?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          milestone_description?: string | null
          milestone_name: string
          milestone_type: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          celebrated?: boolean | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          milestone_description?: string | null
          milestone_name?: string
          milestone_type?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_ai_artifacts: {
        Row: {
          key_points: Json | null
          lesson_id: string
          model: string | null
          suggested_questions: Json | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          key_points?: Json | null
          lesson_id: string
          model?: string | null
          suggested_questions?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          key_points?: Json | null
          lesson_id?: string
          model?: string | null
          suggested_questions?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ai_artifacts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          lesson_id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          lesson_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          lesson_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          content_type: string | null
          course_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string | null
          lesson_order: number
          module_id: string | null
          pdf_url: string | null
          powerpoint_url: string | null
          slug: string
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          lesson_order: number
          module_id?: string | null
          pdf_url?: string | null
          powerpoint_url?: string | null
          slug: string
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          lesson_order?: number
          module_id?: string | null
          pdf_url?: string | null
          powerpoint_url?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      material_chunks: {
        Row: {
          chunk_index: number
          created_at: string | null
          id: string
          material_id: string | null
          text: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          id?: string
          material_id?: string | null
          text: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          id?: string
          material_id?: string | null
          text?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_chunks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability: Json | null
          bio: string | null
          created_at: string | null
          headline: string | null
          hourly_rate_ngn: number | null
          id: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          headline?: string | null
          hourly_rate_ngn?: number | null
          id: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          headline?: string | null
          hourly_rate_ngn?: number | null
          id?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_entitlements: {
        Row: {
          consumed_at: string | null
          created_at: string | null
          device_id: string
          expires_at: string | null
          id: string
          payment_provider: string
          price_kobo: number
          status: string
          tool_type: string
          transaction_id: string | null
          updated_at: string | null
          word_count: number
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string | null
          device_id: string
          expires_at?: string | null
          id?: string
          payment_provider: string
          price_kobo?: number
          status?: string
          tool_type: string
          transaction_id?: string | null
          updated_at?: string | null
          word_count?: number
        }
        Update: {
          consumed_at?: string | null
          created_at?: string | null
          device_id?: string
          expires_at?: string | null
          id?: string
          payment_provider?: string
          price_kobo?: number
          status?: string
          tool_type?: string
          transaction_id?: string | null
          updated_at?: string | null
          word_count?: number
        }
        Relationships: []
      }
      mobile_operations: {
        Row: {
          action: string | null
          completed_at: string | null
          cost_kobo: number | null
          created_at: string | null
          device_id: string
          duration_ms: number | null
          entitlement_id: string | null
          error_message: string | null
          id: string
          input_chars: number | null
          input_text: string | null
          input_tokens: number | null
          model_name: string | null
          model_provider: string | null
          output_text: string | null
          output_tokens: number | null
          route_reason: string | null
          started_at: string | null
          status: string
          tool_type: string
          word_count: number | null
        }
        Insert: {
          action?: string | null
          completed_at?: string | null
          cost_kobo?: number | null
          created_at?: string | null
          device_id: string
          duration_ms?: number | null
          entitlement_id?: string | null
          error_message?: string | null
          id?: string
          input_chars?: number | null
          input_text?: string | null
          input_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          output_text?: string | null
          output_tokens?: number | null
          route_reason?: string | null
          started_at?: string | null
          status?: string
          tool_type: string
          word_count?: number | null
        }
        Update: {
          action?: string | null
          completed_at?: string | null
          cost_kobo?: number | null
          created_at?: string | null
          device_id?: string
          duration_ms?: number | null
          entitlement_id?: string | null
          error_message?: string | null
          id?: string
          input_chars?: number | null
          input_text?: string | null
          input_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          output_text?: string | null
          output_tokens?: number | null
          route_reason?: string | null
          started_at?: string | null
          status?: string
          tool_type?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_operations_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "mobile_entitlements"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_wallet_ledger: {
        Row: {
          amount_kobo: number
          balance_after_kobo: number
          balance_before_kobo: number
          created_at: string | null
          description: string | null
          device_id: string
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount_kobo: number
          balance_after_kobo: number
          balance_before_kobo: number
          created_at?: string | null
          description?: string | null
          device_id: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount_kobo?: number
          balance_after_kobo?: number
          balance_before_kobo?: number
          created_at?: string | null
          description?: string | null
          device_id?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_wallet_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "mobile_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_wallets: {
        Row: {
          balance_kobo: number
          created_at: string | null
          device_id: string
          id: string
          total_credited_kobo: number
          total_debited_kobo: number
          updated_at: string | null
        }
        Insert: {
          balance_kobo?: number
          created_at?: string | null
          device_id: string
          id?: string
          total_credited_kobo?: number
          total_debited_kobo?: number
          updated_at?: string | null
        }
        Update: {
          balance_kobo?: number
          created_at?: string | null
          device_id?: string
          id?: string
          total_credited_kobo?: number
          total_debited_kobo?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          href: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          href?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          href?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_metrics_daily: {
        Row: {
          avg_time_to_complete_minutes: number | null
          completion_rate: number | null
          created_at: string
          date: string
          id: string
          mau: number | null
          new_enrollments: number | null
          quiz_pass_rate: number | null
          total_active_users: number | null
          total_courses: number | null
          total_instructors: number | null
          updated_at: string
        }
        Insert: {
          avg_time_to_complete_minutes?: number | null
          completion_rate?: number | null
          created_at?: string
          date: string
          id?: string
          mau?: number | null
          new_enrollments?: number | null
          quiz_pass_rate?: number | null
          total_active_users?: number | null
          total_courses?: number | null
          total_instructors?: number | null
          updated_at?: string
        }
        Update: {
          avg_time_to_complete_minutes?: number | null
          completion_rate?: number | null
          created_at?: string
          date?: string
          id?: string
          mau?: number | null
          new_enrollments?: number | null
          quiz_pass_rate?: number | null
          total_active_users?: number | null
          total_courses?: number | null
          total_instructors?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string | null
          currency: string
          features: Json | null
          id: string
          interval: string
          name: string
          price: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string
          features?: Json | null
          id?: string
          interval?: string
          name: string
          price?: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string
          features?: Json | null
          id?: string
          interval?: string
          name?: string
          price?: number
          status?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: Database["public"]["Enums"]["skill_level"]
          proof_links: string[] | null
          skill_id: string
          skill_type: Database["public"]["Enums"]["skill_type"]
          tags: string[] | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          proof_links?: string[] | null
          skill_id: string
          skill_type: Database["public"]["Enums"]["skill_type"]
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          proof_links?: string[] | null
          skill_id?: string
          skill_type?: Database["public"]["Enums"]["skill_type"]
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      program_courses: {
        Row: {
          added_at: string | null
          added_by: string | null
          course_id: string
          id: string
          is_required: boolean | null
          position: number
          program_id: string
          unlock_rules: Json | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          course_id: string
          id?: string
          is_required?: boolean | null
          position?: number
          program_id: string
          unlock_rules?: Json | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          course_id?: string
          id?: string
          is_required?: boolean | null
          position?: number
          program_id?: string
          unlock_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "program_courses_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          allow_self_paced: boolean | null
          banner_url: string | null
          certificate_template_id: string | null
          completion_rules: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          institution_id: string
          issue_certificate: boolean | null
          name: string
          short_description: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["program_status"]
          thumbnail_url: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["program_visibility"]
        }
        Insert: {
          allow_self_paced?: boolean | null
          banner_url?: string | null
          certificate_template_id?: string | null
          completion_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id: string
          issue_certificate?: boolean | null
          name: string
          short_description?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_url?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["program_visibility"]
        }
        Update: {
          allow_self_paced?: boolean | null
          banner_url?: string | null
          certificate_template_id?: string | null
          completion_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string
          issue_certificate?: boolean | null
          name?: string
          short_description?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_url?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["program_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_cache: {
        Row: {
          answer: string
          created_at: string
          hits: number
          id: string
          lang: string
          lesson_id: string | null
          question: string
          question_hash: string
        }
        Insert: {
          answer: string
          created_at?: string
          hits?: number
          id?: string
          lang?: string
          lesson_id?: string | null
          question: string
          question_hash: string
        }
        Update: {
          answer?: string
          created_at?: string
          hits?: number
          id?: string
          lang?: string
          lesson_id?: string | null
          question?: string
          question_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_cache_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          passed: boolean
          score_percentage: number
          time_taken_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          passed: boolean
          score_percentage: number
          time_taken_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score_percentage?: number
          time_taken_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: number
          question_data: Json
          quiz_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          question_data: Json
          quiz_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          question_data?: Json
          quiz_id?: string | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string | null
          pass_percentage: number | null
          questions: Json
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_percentage?: number | null
          questions?: Json
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_percentage?: number | null
          questions?: Json
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          message_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          closed_at: string | null
          constraints: string[] | null
          created_at: string | null
          description: string
          id: string
          level: Database["public"]["Enums"]["skill_level"] | null
          offers_count: number | null
          preferred_language:
            | Database["public"]["Enums"]["spoken_language"]
            | null
          session_length: Database["public"]["Enums"]["session_length"] | null
          skill_id: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at: string | null
          urgency: Database["public"]["Enums"]["request_urgency"] | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          closed_at?: string | null
          constraints?: string[] | null
          created_at?: string | null
          description: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"] | null
          offers_count?: number | null
          preferred_language?:
            | Database["public"]["Enums"]["spoken_language"]
            | null
          session_length?: Database["public"]["Enums"]["session_length"] | null
          skill_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["request_urgency"] | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          closed_at?: string | null
          constraints?: string[] | null
          created_at?: string | null
          description?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"] | null
          offers_count?: number | null
          preferred_language?:
            | Database["public"]["Enums"]["spoken_language"]
            | null
          session_length?: Database["public"]["Enums"]["session_length"] | null
          skill_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          title?: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["request_urgency"] | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          session_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          session_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_attempts: {
        Row: {
          category: string | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          difficulty: string | null
          id: string
          material_id: string | null
          mode: string | null
          question_ids: string[] | null
          score: number | null
          started_at: string | null
          status: string | null
          time_limit_seconds: number | null
          time_taken_seconds: number | null
          title: string
          total_questions: number
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          material_id?: string | null
          mode?: string | null
          question_ids?: string[] | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          title: string
          total_questions: number
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          material_id?: string | null
          mode?: string | null
          question_ids?: string[] | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          title?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_attempts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_draft_responses: {
        Row: {
          attempt_id: string | null
          bookmarked: boolean | null
          created_at: string | null
          id: string
          question_id: string | null
          selected_answer: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempt_id?: string | null
          bookmarked?: boolean | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          selected_answer?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_id?: string | null
          bookmarked?: boolean | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          selected_answer?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_draft_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_draft_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_mastery: {
        Row: {
          category: string
          correct_attempts: number | null
          id: string
          last_practiced: string | null
          mastery_percentage: number | null
          topic: string
          total_attempts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          correct_attempts?: number | null
          id?: string
          last_practiced?: string | null
          mastery_percentage?: number | null
          topic: string
          total_attempts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          correct_attempts?: number | null
          id?: string
          last_practiced?: string | null
          mastery_percentage?: number | null
          topic?: string
          total_attempts?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_mastery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_materials: {
        Row: {
          category: string | null
          created_at: string | null
          extracted_text: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          level: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          level?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          level?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_questions: {
        Row: {
          category: string
          correct_answer: number
          correct_answers: number[] | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          id: string
          level: string | null
          material_id: string | null
          mode: string | null
          options: Json
          quality_score: number | null
          question: string
          question_type: string | null
          rationale: string | null
          reuse_count: number | null
          reviewed_by: string | null
          source_chunk_ids: string[] | null
          status: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          correct_answer: number
          correct_answers?: number[] | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          id?: string
          level?: string | null
          material_id?: string | null
          mode?: string | null
          options: Json
          quality_score?: number | null
          question: string
          question_type?: string | null
          rationale?: string | null
          reuse_count?: number | null
          reviewed_by?: string | null
          source_chunk_ids?: string[] | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          correct_answer?: number
          correct_answers?: number[] | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          id?: string
          level?: string | null
          material_id?: string | null
          mode?: string | null
          options?: Json
          quality_score?: number | null
          question?: string
          question_type?: string | null
          rationale?: string | null
          reuse_count?: number | null
          reviewed_by?: string | null
          source_chunk_ids?: string[] | null
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_questions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_questions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiquiz_responses: {
        Row: {
          attempt_id: string
          bookmarked: boolean | null
          correct: boolean | null
          created_at: string | null
          id: string
          question_id: string
          selected_answer: number | null
          time_seconds: number | null
          user_id: string
        }
        Insert: {
          attempt_id: string
          bookmarked?: boolean | null
          correct?: boolean | null
          created_at?: string | null
          id?: string
          question_id: string
          selected_answer?: number | null
          time_seconds?: number | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          bookmarked?: boolean | null
          correct?: boolean | null
          created_at?: string | null
          id?: string
          question_id?: string
          selected_answer?: number | null
          time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiquiz_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sabiquiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiquiz_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_files: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          extracted_chars: number | null
          extracted_text: string | null
          extracted_tokens: number | null
          extraction_error: string | null
          extraction_status: string | null
          file_size_bytes: number
          file_type: string
          id: string
          mime_type: string | null
          original_name: string
          session_id: string | null
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          extracted_chars?: number | null
          extracted_text?: string | null
          extracted_tokens?: number | null
          extraction_error?: string | null
          extraction_status?: string | null
          file_size_bytes: number
          file_type: string
          id?: string
          mime_type?: string | null
          original_name: string
          session_id?: string | null
          storage_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          extracted_chars?: number | null
          extracted_text?: string | null
          extracted_tokens?: number | null
          extraction_error?: string | null
          extraction_status?: string | null
          file_size_bytes?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          session_id?: string | null
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_messages: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          operation_id: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation_id?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation_id?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_operations: {
        Row: {
          action: string | null
          chunk_count: number | null
          completed_at: string | null
          cost_kobo: number
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          estimated_cost_kobo: number | null
          file_id: string | null
          id: string
          input_chars: number | null
          input_text: string | null
          input_tokens: number | null
          model_name: string
          model_provider: string
          output_text: string | null
          output_tokens: number | null
          pricing_rule_id: string | null
          route_reason: string | null
          session_id: string
          started_at: string | null
          status: string | null
          tool_type: string
          user_id: string
        }
        Insert: {
          action?: string | null
          chunk_count?: number | null
          completed_at?: string | null
          cost_kobo: number
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_kobo?: number | null
          file_id?: string | null
          id?: string
          input_chars?: number | null
          input_text?: string | null
          input_tokens?: number | null
          model_name: string
          model_provider: string
          output_text?: string | null
          output_tokens?: number | null
          pricing_rule_id?: string | null
          route_reason?: string | null
          session_id: string
          started_at?: string | null
          status?: string | null
          tool_type: string
          user_id: string
        }
        Update: {
          action?: string | null
          chunk_count?: number | null
          completed_at?: string | null
          cost_kobo?: number
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_kobo?: number | null
          file_id?: string | null
          id?: string
          input_chars?: number | null
          input_text?: string | null
          input_tokens?: number | null
          model_name?: string
          model_provider?: string
          output_text?: string | null
          output_tokens?: number | null
          pricing_rule_id?: string | null
          route_reason?: string | null
          session_id?: string
          started_at?: string | null
          status?: string | null
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_operations_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_pricing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_operations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_operations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_output_versions: {
        Row: {
          action: string | null
          content: string
          created_at: string | null
          id: string
          is_current: boolean | null
          operation_id: string
          session_id: string
          tool_type: string
          user_id: string
          version_number: number
        }
        Insert: {
          action?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          operation_id: string
          session_id: string
          tool_type: string
          user_id: string
          version_number: number
        }
        Update: {
          action?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          operation_id?: string
          session_id?: string
          tool_type?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_output_versions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_output_versions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_output_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_pricing_rules: {
        Row: {
          base_cost_kobo: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_input_tokens: number | null
          model_preference: string | null
          per_chunk_cost_kobo: number | null
          plan_tier: string
          tool_type: string
          updated_at: string | null
        }
        Insert: {
          base_cost_kobo: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_input_tokens?: number | null
          model_preference?: string | null
          per_chunk_cost_kobo?: number | null
          plan_tier?: string
          tool_type: string
          updated_at?: string | null
        }
        Update: {
          base_cost_kobo?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_input_tokens?: number | null
          model_preference?: string | null
          per_chunk_cost_kobo?: number | null
          plan_tier?: string
          tool_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sabiwrite_refunds: {
        Row: {
          amount_kobo: number
          created_at: string | null
          id: string
          ledger_entry_id: string | null
          operation_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string | null
          id?: string
          ledger_entry_id?: string | null
          operation_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string | null
          id?: string
          ledger_entry_id?: string | null
          operation_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_refunds_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "wallet_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_refunds_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "sabiwrite_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sabiwrite_refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_sessions: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          last_tool_used: string | null
          message_count: number | null
          status: string | null
          title: string | null
          total_cost_kobo: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          last_tool_used?: string | null
          message_count?: number | null
          status?: string | null
          title?: string | null
          total_cost_kobo?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          last_tool_used?: string | null
          message_count?: number | null
          status?: string | null
          title?: string | null
          total_cost_kobo?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sabiwrite_usage: {
        Row: {
          created_at: string | null
          date: string
          deepseek_count: number | null
          haiku_count: number | null
          id: string
          operation_count: number | null
          tool_type: string
          total_cost_kobo: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          deepseek_count?: number | null
          haiku_count?: number | null
          id?: string
          operation_count?: number | null
          tool_type: string
          total_cost_kobo?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          deepseek_count?: number | null
          haiku_count?: number | null
          id?: string
          operation_count?: number | null
          tool_type?: string
          total_cost_kobo?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sabiwrite_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_requests: {
        Row: {
          created_at: string | null
          id: string
          learner_id: string
          mentor_id: string
          message: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learner_id: string
          mentor_id: string
          message?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learner_id?: string
          mentor_id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_requests_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          learner_id: string
          meeting_provider: string | null
          meeting_url: string | null
          mentor_id: string
          notes: string | null
          offer_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          session_request_id: string | null
          skill_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          learner_id: string
          meeting_provider?: string | null
          meeting_url?: string | null
          mentor_id: string
          notes?: string | null
          offer_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_request_id?: string | null
          skill_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          learner_id?: string
          meeting_provider?: string | null
          meeting_url?: string | null
          mentor_id?: string
          notes?: string | null
          offer_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_request_id?: string | null
          skill_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "community_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_session_request_id_fkey"
            columns: ["session_request_id"]
            isOneToOne: false
            referencedRelation: "session_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          freeze_last_replenished: string | null
          freezes_available: number
          id: string
          last_freeze_used_on: string | null
          last_study_date: string | null
          longest_streak: number | null
          total_study_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          freeze_last_replenished?: string | null
          freezes_available?: number
          id?: string
          last_freeze_used_on?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          total_study_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          freeze_last_replenished?: string | null
          freezes_available?: number
          id?: string
          last_freeze_used_on?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          total_study_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          created_at: string | null
          last_read_at: string | null
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          last_read_at?: string | null
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          last_read_at?: string | null
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          context: string
          created_at: string | null
          id: string
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          context?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string | null
          currency: string
          id: string
          plan_id: string | null
          provider: string | null
          provider_transaction_id: string | null
          provider_tx_ref: string | null
          raw_event: Json | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_transaction_id?: string | null
          provider_tx_ref?: string | null
          raw_event?: Json | null
          status?: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_transaction_id?: string | null
          provider_tx_ref?: string | null
          raw_event?: Json | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_id: string
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_id: string
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_id?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_context: {
        Row: {
          career_goals: string[] | null
          created_at: string | null
          current_occupation: string | null
          id: string
          learning_goals: string[] | null
          learning_style: string | null
          preferred_study_times: string[] | null
          strong_topics: Json | null
          study_hours_per_week: number | null
          transition_timeline: string | null
          updated_at: string | null
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          career_goals?: string[] | null
          created_at?: string | null
          current_occupation?: string | null
          id?: string
          learning_goals?: string[] | null
          learning_style?: string | null
          preferred_study_times?: string[] | null
          strong_topics?: Json | null
          study_hours_per_week?: number | null
          transition_timeline?: string | null
          updated_at?: string | null
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          career_goals?: string[] | null
          created_at?: string | null
          current_occupation?: string | null
          id?: string
          learning_goals?: string[] | null
          learning_style?: string | null
          preferred_study_times?: string[] | null
          strong_topics?: Json | null
          study_hours_per_week?: number | null
          transition_timeline?: string | null
          updated_at?: string | null
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          created_at: string | null
          current_level: number | null
          id: string
          total_xp: number | null
          updated_at: string | null
          user_id: string
          week_start_date: string | null
          xp_this_week: number | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          week_start_date?: string | null
          xp_this_week?: number | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          week_start_date?: string | null
          xp_this_week?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_super_admin: boolean
          last_seen_at: string | null
          location: string | null
          phone: string | null
          plan_tier: string | null
          platform_role: Database["public"]["Enums"]["platform_role"] | null
          preferred_language: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_super_admin?: boolean
          last_seen_at?: string | null
          location?: string | null
          phone?: string | null
          plan_tier?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          preferred_language?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_super_admin?: boolean
          last_seen_at?: string | null
          location?: string | null
          phone?: string | null
          plan_tier?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"] | null
          preferred_language?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          interest: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          interest?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          interest?: string | null
          source?: string
        }
        Relationships: []
      }
      wallet_accounts: {
        Row: {
          balance_kobo: number
          created_at: string | null
          currency: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_kobo?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_kobo?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount_kobo: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          service: string | null
          service_ref_id: string | null
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_kobo: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          service?: string | null
          service_ref_id?: string | null
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_kobo?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          service?: string | null
          service_ref_id?: string | null
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount_kobo: number
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference: string | null
          service: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          service?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          service?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          created_at: string
          id: string
          points: number
          ref_id: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          ref_id: string
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          ref_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      wallet_summary: {
        Row: {
          service: string | null
          total_credited_kobo: number | null
          total_spent_kobo: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_milestone: {
        Args: {
          p_metadata?: Json
          p_milestone_description?: string
          p_milestone_name: string
          p_milestone_type: string
          p_user_id: string
        }
        Returns: string
      }
      auto_generate_certificate: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: string
      }
      can_complete_lesson: {
        Args: { p_lesson_id: string; p_user: string }
        Returns: boolean
      }
      can_manage_cohort: {
        Args: { p_cohort_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_lesson_quiz: {
        Args: { p_lesson: string; p_user: string }
        Returns: boolean
      }
      can_manage_program: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: boolean
      }
      can_read_course: {
        Args: { p_course: string; p_user: string }
        Returns: boolean
      }
      can_self_enroll: { Args: { p_course: string }; Returns: boolean }
      check_course_completion: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: {
          average_grade: number
          certificate_exists: boolean
          is_complete: boolean
          lessons_completed: number
          lessons_total: number
          quizzes_passed: number
          quizzes_total: number
        }[]
      }
      generate_certificate_number: { Args: never; Returns: string }
      generate_slug: { Args: { name: string }; Returns: string }
      get_public_profiles: {
        Args: { p_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          id: string
          profile_image_url: string
          role: string
        }[]
      }
      get_thread_unread_count: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: number
      }
      get_unread_count: { Args: { p_user_id: string }; Returns: number }
      has_institution_role: {
        Args: { p_institution: string; p_roles: string[] }
        Returns: boolean
      }
      instructor_can_view_user: { Args: { p_user: string }; Returns: boolean }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_cohort_member: {
        Args: { p_cohort_id: string; p_user_id: string }
        Returns: boolean
      }
      is_institution_admin: {
        Args: { p_institution_id: string; p_user_id: string }
        Returns: boolean
      }
      is_lesson_unlocked: {
        Args: { p_lesson_id: string; p_user: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_program_member: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: boolean
      }
      update_study_streak: { Args: { p_user_id: string }; Returns: undefined }
      wallet_apply: {
        Args: {
          p_amount_kobo: number
          p_description: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_reference_type?: string
          p_service: string
          p_service_ref_id?: string
          p_type: string
          p_user: string
          p_welcome_bonus_kobo?: number
        }
        Returns: Json
      }
      wallet_complete_topup: {
        Args: {
          p_expected_user?: string
          p_metadata?: Json
          p_paid_kobo: number
          p_reference: string
          p_service?: string
          p_welcome_bonus_kobo?: number
        }
        Returns: Json
      }
      wallet_ensure: {
        Args: { p_user: string; p_welcome_bonus_kobo?: number }
        Returns: string
      }
      wallet_purchase_course: {
        Args: {
          p_course: string
          p_user: string
          p_welcome_bonus_kobo?: number
        }
        Returns: Json
      }
    }
    Enums: {
      cohort_enrollment_mode:
        | "invite_only"
        | "access_code"
        | "approval_required"
        | "public"
      cohort_invite_status: "ACTIVE" | "REVOKED" | "EXPIRED" | "EXHAUSTED"
      cohort_invite_type: "LINK" | "QR" | "EMAIL_CAMPAIGN" | "BULK_CSV"
      cohort_member_status:
        | "pending_approval"
        | "invited"
        | "active"
        | "completed"
        | "removed"
        | "withdrawn"
      cohort_status: "draft" | "active" | "closed" | "archived"
      course_status: "draft" | "published" | "archived" | "unpublished"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      difficulty_level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "all-levels"
        | "expert"
      institution_member_status: "active" | "invited" | "suspended"
      institution_role:
        | "institution_admin"
        | "program_manager"
        | "facilitator"
        | "viewer"
        | "instructor"
      institution_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "archived"
      institution_type:
        | "school"
        | "ngo"
        | "government"
        | "training_center"
        | "company"
        | "other"
      instructor_status: "pending" | "approved" | "limited" | "suspended"
      meeting_method:
        | "google_meet"
        | "zoom"
        | "whatsapp_call"
        | "phone_call"
        | "in_person"
        | "other"
      platform_role:
        | "super_admin"
        | "ops"
        | "trust_safety"
        | "partnerships"
        | "support"
      program_status: "draft" | "active" | "completed" | "archived"
      program_visibility: "private" | "unlisted" | "public"
      request_status: "open" | "booked" | "closed" | "archived"
      request_urgency: "low" | "medium" | "high"
      session_length: "30" | "60" | "90"
      skill_category:
        | "technology"
        | "data"
        | "design"
        | "business"
        | "exams"
        | "corporate"
        | "productivity"
        | "career"
        | "languages"
        | "other"
      skill_level: "beginner" | "intermediate" | "advanced"
      skill_type: "teach" | "learn"
      spoken_language:
        | "english"
        | "pidgin"
        | "yoruba"
        | "hausa"
        | "igbo"
        | "french"
        | "arabic"
        | "other"
      sponsorship_type:
        | "institution_sponsored"
        | "self_paid"
        | "donor_sponsored"
        | "scholarship"
      user_role: "learner" | "instructor" | "admin"
      user_status: "active" | "suspended" | "deactivated" | "soft_deleted"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      cohort_enrollment_mode: [
        "invite_only",
        "access_code",
        "approval_required",
        "public",
      ],
      cohort_invite_status: ["ACTIVE", "REVOKED", "EXPIRED", "EXHAUSTED"],
      cohort_invite_type: ["LINK", "QR", "EMAIL_CAMPAIGN", "BULK_CSV"],
      cohort_member_status: [
        "pending_approval",
        "invited",
        "active",
        "completed",
        "removed",
        "withdrawn",
      ],
      cohort_status: ["draft", "active", "closed", "archived"],
      course_status: ["draft", "published", "archived", "unpublished"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      difficulty_level: [
        "beginner",
        "intermediate",
        "advanced",
        "all-levels",
        "expert",
      ],
      institution_member_status: ["active", "invited", "suspended"],
      institution_role: [
        "institution_admin",
        "program_manager",
        "facilitator",
        "viewer",
        "instructor",
      ],
      institution_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "archived",
      ],
      institution_type: [
        "school",
        "ngo",
        "government",
        "training_center",
        "company",
        "other",
      ],
      instructor_status: ["pending", "approved", "limited", "suspended"],
      meeting_method: [
        "google_meet",
        "zoom",
        "whatsapp_call",
        "phone_call",
        "in_person",
        "other",
      ],
      platform_role: [
        "super_admin",
        "ops",
        "trust_safety",
        "partnerships",
        "support",
      ],
      program_status: ["draft", "active", "completed", "archived"],
      program_visibility: ["private", "unlisted", "public"],
      request_status: ["open", "booked", "closed", "archived"],
      request_urgency: ["low", "medium", "high"],
      session_length: ["30", "60", "90"],
      skill_category: [
        "technology",
        "data",
        "design",
        "business",
        "exams",
        "corporate",
        "productivity",
        "career",
        "languages",
        "other",
      ],
      skill_level: ["beginner", "intermediate", "advanced"],
      skill_type: ["teach", "learn"],
      spoken_language: [
        "english",
        "pidgin",
        "yoruba",
        "hausa",
        "igbo",
        "french",
        "arabic",
        "other",
      ],
      sponsorship_type: [
        "institution_sponsored",
        "self_paid",
        "donor_sponsored",
        "scholarship",
      ],
      user_role: ["learner", "instructor", "admin"],
      user_status: ["active", "suspended", "deactivated", "soft_deleted"],
    },
  },
} as const
