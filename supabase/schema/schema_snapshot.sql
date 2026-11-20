-- =============================================================================
-- Sabitek database schema snapshot (public schema + storage.objects policies)
-- =============================================================================
-- GENERATED on 2026-11-20 (after the phase 1 migrations) from the live project by generate_snapshot.sql.
-- Do not edit by hand; re-run the generator after schema changes.
--
-- Why this exists: most of this schema was created by hand in the SQL editor
-- and never recorded as migrations (25 migration files cover about 23 of 98
-- tables). This file puts the real schema under version control so changes
-- can be reviewed and diffed.
--
-- It is a REFERENCE, grouped by object kind, not ordered by dependency. It is
-- not guaranteed to replay into an empty database; use `supabase db dump` for
-- that.
--
-- Sections: 1 enums, 2 tables, 3 constraints, 4 foreign keys, 5 indexes,
-- 6 functions, 7 views, 8 triggers, 9 RLS switches, 10 policies,
-- 11 table privileges, 12 column privileges, 13 function execute privileges.
-- =============================================================================

create type public.cohort_enrollment_mode as enum ('invite_only', 'access_code', 'approval_required', 'public');

create type public.cohort_invite_status as enum ('ACTIVE', 'REVOKED', 'EXPIRED', 'EXHAUSTED');

create type public.cohort_invite_type as enum ('LINK', 'QR', 'EMAIL_CAMPAIGN', 'BULK_CSV');

create type public.cohort_member_status as enum ('pending_approval', 'invited', 'active', 'completed', 'removed', 'withdrawn');

create type public.cohort_status as enum ('draft', 'active', 'closed', 'archived');

create type public.course_status as enum ('draft', 'published', 'archived', 'unpublished');

create type public.day_of_week as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced', 'all-levels', 'expert');

create type public.institution_member_status as enum ('active', 'invited', 'suspended');

create type public.institution_role as enum ('institution_admin', 'program_manager', 'facilitator', 'viewer', 'instructor');

create type public.institution_status as enum ('pending', 'approved', 'rejected', 'suspended', 'archived');

create type public.institution_type as enum ('school', 'ngo', 'government', 'training_center', 'company', 'other');

create type public.instructor_status as enum ('pending', 'approved', 'limited', 'suspended');

create type public.meeting_method as enum ('google_meet', 'zoom', 'whatsapp_call', 'phone_call', 'in_person', 'other');

create type public.platform_role as enum ('super_admin', 'ops', 'trust_safety', 'partnerships', 'support');

create type public.program_status as enum ('draft', 'active', 'completed', 'archived');

create type public.program_visibility as enum ('private', 'unlisted', 'public');

create type public.request_status as enum ('open', 'booked', 'closed', 'archived');

create type public.request_urgency as enum ('low', 'medium', 'high');

create type public.session_length as enum ('30', '60', '90');

create type public.skill_category as enum ('technology', 'data', 'design', 'business', 'exams', 'corporate', 'productivity', 'career', 'languages', 'other');

create type public.skill_level as enum ('beginner', 'intermediate', 'advanced');

create type public.skill_type as enum ('teach', 'learn');

create type public.spoken_language as enum ('english', 'pidgin', 'yoruba', 'hausa', 'igbo', 'french', 'arabic', 'other');

create type public.sponsorship_type as enum ('institution_sponsored', 'self_paid', 'donor_sponsored', 'scholarship');

create type public.user_role as enum ('learner', 'instructor', 'admin');

create type public.user_status as enum ('active', 'suspended', 'deactivated', 'soft_deleted');

create table public.advisor_ai_cache (
  id uuid not null default gen_random_uuid(),
  input_hash text not null,
  operation_type text not null,
  output_data jsonb not null,
  output_ref_id uuid,
  output_ref_table text,
  hit_count integer default 0,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

create table public.advisor_operations (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  operation_type text not null,
  module text not null,
  cost_kobo integer not null,
  output_id uuid,
  output_table text,
  wallet_ledger_id uuid,
  input_summary jsonb,
  status text default 'pending'::text,
  error_message text,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  duration_ms integer
);

create table public.advisor_pricing (
  id uuid not null default gen_random_uuid(),
  operation_type text not null,
  module text not null,
  base_cost_kobo integer not null,
  display_name text not null,
  description text,
  is_active boolean default true,
  requires_profile boolean default false,
  cacheable boolean default true,
  cache_ttl_hours integer default 24,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.ai_usage (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  feature text not null default 'sabibot'::text,
  model text not null,
  input_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table public.audit_logs (
  id uuid not null default uuid_generate_v4(),
  actor_user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone not null default now()
);

create table public.availability_slots (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  day_of_week day_of_week not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table public.blocks (
  id uuid not null default gen_random_uuid(),
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.career_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  full_name text,
  email text,
  phone text,
  location text,
  summary text,
  education jsonb default '[]'::jsonb,
  work_experience jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  links jsonb default '{}'::jsonb,
  target_roles jsonb default '[]'::jsonb,
  preferred_industries jsonb default '[]'::jsonb,
  profile_completeness integer default 0,
  last_import_source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.career_results (
  id uuid not null default uuid_generate_v4(),
  user_id uuid,
  survey_id uuid,
  top_tracks jsonb not null,
  confidence double precision,
  rationale text,
  plan_7d jsonb,
  plan_12w jsonb,
  cert_map jsonb,
  created_at timestamp with time zone default now(),
  next_steps jsonb,
  roadmap_6m jsonb,
  primary_tracks jsonb,
  alternative_tracks jsonb
);

create table public.career_surveys (
  id uuid not null default uuid_generate_v4(),
  user_id uuid,
  answers jsonb not null,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.categories (
  id uuid not null default uuid_generate_v4(),
  name character varying(100) not null,
  slug character varying(100) not null,
  description text,
  icon character varying(50),
  created_at timestamp with time zone default now()
);

create table public.certificates (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  course_id uuid,
  certificate_number character varying(50) not null,
  issued_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  revoke_reason text,
  completion_date timestamp with time zone not null,
  grade_percentage integer,
  certificate_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  kind text not null default 'course'::text,
  program_id uuid
);

create table public.chat_history (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  user_message text not null,
  assistant_message text not null,
  created_at timestamp with time zone default now()
);

create table public.cohort_invites (
  id uuid not null default gen_random_uuid(),
  cohort_id uuid not null,
  token character varying(64) not null,
  type cohort_invite_type not null default 'LINK'::cohort_invite_type,
  status cohort_invite_status not null default 'ACTIVE'::cohort_invite_status,
  expires_at timestamp with time zone,
  max_uses integer,
  use_count integer not null default 0,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  revoked_by uuid,
  revoke_reason text,
  metadata jsonb not null default '{}'::jsonb
);
comment on table public.cohort_invites is 'Reusable invite tokens for joining cohorts via shareable links or QR codes. Distinct from cohort_members.invitation_token which is a one-time email token for a specific user.';

create table public.cohort_members (
  id uuid not null default gen_random_uuid(),
  cohort_id uuid not null,
  user_id uuid not null,
  status cohort_member_status not null default 'invited'::cohort_member_status,
  sponsorship sponsorship_type not null default 'institution_sponsored'::sponsorship_type,
  sponsor_reference character varying(255),
  invited_by uuid,
  invited_at timestamp with time zone,
  invitation_token character varying(255),
  invitation_expires_at timestamp with time zone,
  applied_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  joined_at timestamp with time zone,
  completed_at timestamp with time zone,
  completion_certificate_id uuid,
  removed_at timestamp with time zone,
  removed_by uuid,
  removal_reason text,
  withdrawn_at timestamp with time zone,
  withdrawal_reason text,
  progress_pct numeric(5,2) default 0,
  courses_completed integer default 0,
  last_activity_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
comment on table public.cohort_members is 'Learners enrolled in a cohort';

create table public.cohorts (
  id uuid not null default gen_random_uuid(),
  program_id uuid not null,
  name character varying(200) not null,
  slug character varying(200) not null,
  description text,
  enrollment_mode cohort_enrollment_mode not null default 'invite_only'::cohort_enrollment_mode,
  seat_limit integer,
  access_code character varying(50),
  access_code_expires_at timestamp with time zone,
  access_code_max_uses integer,
  access_code_uses integer default 0,
  start_date date,
  end_date date,
  enrollment_start_date date,
  enrollment_end_date date,
  status cohort_status not null default 'draft'::cohort_status,
  default_sponsorship sponsorship_type default 'institution_sponsored'::sponsorship_type,
  allow_late_enrollment boolean default false,
  send_welcome_email boolean default true,
  send_reminder_emails boolean default true,
  created_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  code_expires_at timestamp with time zone,
  code_max_uses integer
);
comment on table public.cohorts is 'Time-bound groups of learners enrolled in a program';

create table public.community_offers (
  id uuid not null default gen_random_uuid(),
  request_id uuid not null,
  mentor_id uuid not null,
  message text,
  proposed_rate_ngn integer,
  status text not null default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.community_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  username character varying(50),
  display_name character varying(100),
  bio text,
  location character varying(100),
  timezone character varying(50) default 'Africa/Lagos'::character varying,
  languages spoken_language[] default ARRAY['english'::spoken_language],
  preferred_session_lengths session_length[] default ARRAY['60'::session_length],
  preferred_meeting_methods meeting_method[] default ARRAY['google_meet'::meeting_method],
  meeting_link text,
  completion_rate numeric(5,2) default 0,
  response_time_hours integer,
  is_verified boolean default false,
  is_public boolean default true,
  is_available_to_mentor boolean default false,
  is_looking_to_learn boolean default true,
  is_suspended boolean default false,
  suspended_reason text,
  suspended_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.conversation_insights (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  insight_type text not null,
  insight_content text not null,
  confidence_score integer,
  extracted_from_message_id text,
  extracted_at timestamp with time zone default now(),
  is_active boolean default true,
  verified boolean default false,
  created_at timestamp with time zone default now()
);
comment on table public.conversation_insights is 'Auto-extracted insights from chat conversations';

create table public.course_discussions (
  id uuid not null default gen_random_uuid(),
  course_id uuid not null,
  user_id uuid not null,
  parent_id uuid,
  content text not null,
  created_at timestamp with time zone not null default now()
);

create table public.course_enrollments (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  course_id uuid not null,
  enrolled_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  progress_percentage integer default 0
);

create table public.course_purchases (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null,
  amount integer not null,
  currency text not null default 'NGN'::text,
  provider text default 'flutterwave'::text,
  provider_tx_ref text,
  provider_transaction_id text,
  status text not null default 'pending'::text,
  purchased_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.courses (
  id uuid not null default uuid_generate_v4(),
  title character varying(255) not null,
  slug character varying(255) not null,
  description text,
  instructor_id uuid not null,
  category_id uuid,
  thumbnail_url text,
  trailer_video_url text,
  difficulty_level difficulty_level default 'beginner'::difficulty_level,
  estimated_duration_minutes integer,
  price_cents integer default 0,
  status course_status default 'draft'::course_status,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone,
  cover_image_url text,
  intro_video_url text,
  category character varying(100),
  tags text[],
  price numeric(10,2) default 0,
  is_free boolean default true,
  currency character varying(3) default 'NGN'::character varying,
  institution_id uuid
);

create table public.cover_letter_documents (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  target_role character varying(255) not null,
  company_name character varying(255),
  tone character varying(50) default 'professional'::character varying,
  length character varying(50) default 'standard'::character varying,
  letter_text text,
  sections jsonb default '{}'::jsonb,
  status character varying(50) default 'draft'::character varying,
  action character varying(50) default 'build'::character varying,
  insights jsonb default '{}'::jsonb,
  version integer default 1,
  is_current boolean default true,
  parent_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.cover_letters (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  profile_id uuid,
  cv_id uuid,
  company_name text,
  job_title text,
  tone text default 'professional'::text,
  length text default 'standard'::text,
  sections jsonb default '{}'::jsonb,
  full_text text,
  job_description_text text,
  company_research jsonb,
  facts_used jsonb default '[]'::jsonb,
  version integer default 1,
  parent_version_id uuid,
  is_current boolean default true,
  title text,
  status text default 'draft'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.cv_documents (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  profile_id uuid,
  target_role text not null,
  level text,
  region text default 'global'::text,
  format text default 'ats-1page'::text,
  sections jsonb default '{}'::jsonb,
  job_description_text text,
  job_description_keywords jsonb default '[]'::jsonb,
  company_name text,
  version integer default 1,
  parent_version_id uuid,
  is_current boolean default true,
  ats_score integer,
  ats_warnings jsonb default '[]'::jsonb,
  title text,
  status text default 'draft'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.enrollments (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  course_id uuid not null,
  enrolled_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  progress_percentage integer default 0,
  last_accessed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.entitlements (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  key text not null,
  value text default 'true'::text,
  source text not null default 'subscription'::text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.generation_runs (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  material_id uuid,
  model_used text,
  cost_usd numeric(10,6),
  questions_generated integer,
  questions_approved integer,
  stats jsonb,
  created_at timestamp with time zone default now()
);

create table public.institution_applications (
  id uuid not null default uuid_generate_v4(),
  full_name text not null,
  email text not null,
  organisation_name text not null,
  role_title text,
  country text,
  org_type text not null default 'other'::text,
  learner_count text,
  description text,
  status text not null default 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  rejection_reason text,
  institution_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
comment on table public.institution_applications is 'Institution and training provider workspace requests. Reviewed by platform admins.';

create table public.institution_invites (
  id uuid not null default gen_random_uuid(),
  institution_id uuid not null,
  role institution_role not null default 'viewer'::institution_role,
  email text,
  token character varying not null,
  status cohort_invite_status not null default 'ACTIVE'::cohort_invite_status,
  expires_at timestamp with time zone,
  max_uses integer,
  use_count integer not null default 0,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  revoked_by uuid,
  metadata jsonb not null default '{}'::jsonb
);

create table public.institution_members (
  id uuid not null default uuid_generate_v4(),
  institution_id uuid not null,
  user_id uuid not null,
  role institution_role not null default 'viewer'::institution_role,
  status institution_member_status not null default 'invited'::institution_member_status,
  invited_by uuid,
  invited_at timestamp with time zone default now(),
  accepted_at timestamp with time zone,
  suspended_at timestamp with time zone,
  suspended_by uuid,
  suspension_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
comment on table public.institution_members is 'User memberships and roles within institutions';

create table public.institutions (
  id uuid not null default uuid_generate_v4(),
  name text not null,
  slug text not null,
  type institution_type not null default 'other'::institution_type,
  description text,
  country text,
  state text,
  lga text,
  address text,
  website text,
  contact_email text,
  contact_phone text,
  email_domain_allowlist text[],
  logo_url text,
  accent_color text default '#dc2626'::text,
  banner_url text,
  status institution_status not null default 'pending'::institution_status,
  verified_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  rejection_reason text,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  terminology_pack jsonb default '{}'::jsonb,
  kpi_pack jsonb default '{}'::jsonb,
  onboarding_pack jsonb default '{}'::jsonb,
  reporting_pack jsonb default '{}'::jsonb,
  required_fields_pack jsonb default '{}'::jsonb,
  vertical_metadata jsonb default '{}'::jsonb
);
comment on table public.institutions is 'Organizations that run learning programs on Sabitek';

create table public.instructor_profiles (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  headline text,
  bio text,
  specializations text[],
  years_experience integer,
  institution_id uuid,
  status instructor_status not null default 'pending'::instructor_status,
  approved_at timestamp with time zone,
  approved_by uuid,
  rejection_reason text,
  can_publish_public boolean default false,
  can_monetize boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
comment on table public.instructor_profiles is 'Extended profile for users who create courses';

create table public.interview_answers (
  id uuid not null default gen_random_uuid(),
  session_id uuid,
  user_id uuid,
  question_id text not null,
  question_text text not null,
  user_answer text,
  score integer,
  feedback jsonb,
  improved_answer text,
  attempt_number integer default 1,
  created_at timestamp with time zone default now()
);

create table public.interview_kits (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  profile_id uuid,
  target_role text not null,
  company_name text,
  difficulty text default 'medium'::text,
  focus_areas jsonb default '[]'::jsonb,
  questions jsonb default '[]'::jsonb,
  scoring_rubric jsonb,
  prep_tips jsonb default '[]'::jsonb,
  input_hash text,
  title text,
  status text default 'draft'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.interview_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  kit_id uuid,
  mode text default 'practice'::text,
  questions_asked jsonb default '[]'::jsonb,
  current_question_index integer default 0,
  total_score integer,
  average_score numeric(5,2),
  completed_questions integer default 0,
  status text default 'in_progress'::text,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table public.learning_milestones (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  milestone_type text not null,
  milestone_name text not null,
  milestone_description text,
  achieved_at timestamp with time zone default now(),
  celebrated boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);
comment on table public.learning_milestones is 'Achievement tracking for celebrations';

create table public.lesson_ai_artifacts (
  lesson_id uuid not null,
  summary text,
  key_points jsonb,
  suggested_questions jsonb,
  model text,
  updated_at timestamp with time zone not null default now()
);

create table public.lesson_notes (
  id bigint not null,
  user_id uuid,
  lesson_id uuid,
  content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  notes text
);

create table public.lesson_progress (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  lesson_id uuid not null,
  course_id uuid not null,
  completed_at timestamp with time zone not null default now(),
  time_spent_seconds integer default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.lesson_questions (
  id uuid not null default gen_random_uuid(),
  lesson_id uuid not null,
  course_id uuid not null,
  user_id uuid not null,
  question text not null,
  answer text,
  answered_by uuid,
  answered_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table public.lessons (
  id uuid not null default uuid_generate_v4(),
  course_id uuid,
  title character varying(255) not null,
  slug character varying(255) not null,
  content text,
  video_url text,
  video_duration_seconds integer,
  lesson_order integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  instructor_id uuid default auth.uid(),
  content_type character varying(50) default 'text'::character varying,
  youtube_url text,
  pdf_url text,
  powerpoint_url text,
  duration_minutes integer,
  module_id uuid
);

create table public.material_chunks (
  id uuid not null default gen_random_uuid(),
  material_id uuid,
  chunk_index integer not null,
  text text not null,
  token_count integer,
  created_at timestamp with time zone default now()
);

create table public.mentor_profiles (
  id uuid not null,
  bio text,
  headline text,
  hourly_rate_ngn integer,
  availability jsonb,
  verified boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.messages (
  id uuid not null default gen_random_uuid(),
  thread_id uuid not null,
  sender_id uuid not null,
  content text not null,
  content_type text not null default 'text'::text,
  created_at timestamp with time zone default now(),
  edited_at timestamp with time zone,
  is_deleted boolean default false
);

create table public.mobile_entitlements (
  id uuid not null default gen_random_uuid(),
  device_id text not null,
  payment_provider text not null,
  transaction_id text,
  tool_type text not null,
  word_count integer not null default 0,
  price_kobo integer not null default 0,
  status text not null default 'paid'::text,
  expires_at timestamp with time zone,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.mobile_operations (
  id uuid not null default gen_random_uuid(),
  device_id text not null,
  entitlement_id uuid,
  tool_type text not null,
  action text,
  input_text text,
  input_chars integer default 0,
  input_tokens integer default 0,
  word_count integer default 0,
  output_text text,
  output_tokens integer default 0,
  model_provider text,
  model_name text,
  route_reason text,
  cost_kobo integer default 0,
  status text not null default 'pending'::text,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_ms integer,
  created_at timestamp with time zone default now()
);

create table public.mobile_wallet_ledger (
  id uuid not null default gen_random_uuid(),
  wallet_id uuid not null,
  device_id text not null,
  transaction_type text not null,
  amount_kobo integer not null,
  balance_before_kobo integer not null,
  balance_after_kobo integer not null,
  reference_type text,
  reference_id text,
  description text,
  created_at timestamp with time zone default now()
);

create table public.mobile_wallets (
  id uuid not null default gen_random_uuid(),
  device_id text not null,
  balance_kobo integer not null default 0,
  total_credited_kobo integer not null default 0,
  total_debited_kobo integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.modules (
  id uuid not null default gen_random_uuid(),
  course_id uuid not null,
  title text not null,
  description text,
  order_index integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  entity_id uuid,
  entity_type text,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

create table public.org_metrics_daily (
  id uuid not null default uuid_generate_v4(),
  date date not null,
  mau integer default 0,
  new_enrollments integer default 0,
  completion_rate numeric(5,2) default 0,
  avg_time_to_complete_minutes integer default 0,
  quiz_pass_rate numeric(5,2) default 0,
  total_active_users integer default 0,
  total_courses integer default 0,
  total_instructors integer default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.plans (
  id uuid not null default gen_random_uuid(),
  code text not null,
  name text not null,
  price integer not null default 0,
  currency text not null default 'NGN'::text,
  "interval" text not null default 'month'::text,
  status text not null default 'active'::text,
  features jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create table public.platform_settings (
  key text not null,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid
);
comment on table public.platform_settings is 'Platform-wide key/value settings & feature flags. Writable only by super admins.';

create table public.profile_skills (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  skill_id uuid not null,
  skill_type skill_type not null,
  level skill_level not null default 'beginner'::skill_level,
  years_experience integer,
  proof_links text[],
  description text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.program_courses (
  id uuid not null default gen_random_uuid(),
  program_id uuid not null,
  course_id uuid not null,
  "position" integer not null default 0,
  is_required boolean default true,
  unlock_rules jsonb default '{}'::jsonb,
  added_by uuid,
  added_at timestamp with time zone default now()
);
comment on table public.program_courses is 'Many-to-many relationship between programs and courses';

create table public.programs (
  id uuid not null default gen_random_uuid(),
  institution_id uuid not null,
  name character varying(200) not null,
  slug character varying(200) not null,
  description text,
  short_description character varying(500),
  thumbnail_url text,
  banner_url text,
  visibility program_visibility not null default 'private'::program_visibility,
  status program_status not null default 'draft'::program_status,
  start_date date,
  end_date date,
  completion_rules jsonb default '{}'::jsonb,
  certificate_template_id uuid,
  issue_certificate boolean default true,
  allow_self_paced boolean default true,
  created_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
comment on table public.programs is 'Learning programs created by institutions, containing multiple courses';

create table public.qa_cache (
  id uuid not null default gen_random_uuid(),
  lesson_id uuid,
  lang text not null default 'english'::text,
  question_hash text not null,
  question text not null,
  answer text not null,
  hits integer not null default 1,
  created_at timestamp with time zone not null default now()
);

create table public.quiz_attempts (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  lesson_id uuid not null,
  course_id uuid not null,
  score_percentage integer not null,
  passed boolean not null,
  answers jsonb,
  time_taken_seconds integer,
  attempt_number integer default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.quiz_questions (
  id bigint not null,
  quiz_id uuid,
  question_data jsonb not null,
  created_at timestamp with time zone not null default now()
);

create table public.quizzes (
  id uuid not null default gen_random_uuid(),
  lesson_id uuid,
  title character varying(255) not null,
  pass_percentage integer default 70,
  time_limit_minutes integer,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.reports (
  id uuid not null default gen_random_uuid(),
  reporter_id uuid not null,
  reported_user_id uuid not null,
  thread_id uuid,
  message_id uuid,
  reason text not null,
  details text,
  status text not null default 'open'::text,
  created_at timestamp with time zone default now()
);

create table public.requests (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title character varying(200) not null,
  description text not null,
  skill_id uuid,
  level skill_level default 'beginner'::skill_level,
  preferred_language spoken_language default 'english'::spoken_language,
  urgency request_urgency default 'medium'::request_urgency,
  session_length session_length default '60'::session_length,
  constraints text[],
  status request_status default 'open'::request_status,
  views_count integer default 0,
  offers_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  closed_at timestamp with time zone
);

create table public.reviews (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  reviewer_id uuid not null,
  reviewee_id uuid not null,
  rating integer not null,
  comment text,
  created_at timestamp with time zone default now()
);

create table public.sabiquiz_attempts (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category text,
  difficulty text default 'medium'::text,
  total_questions integer not null,
  correct_answers integer default 0,
  score numeric,
  time_taken_seconds integer,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  material_id uuid,
  status text default 'in_progress'::text,
  started_at timestamp with time zone,
  question_ids text[],
  mode text default 'normal'::text,
  time_limit_seconds integer
);

create table public.sabiquiz_draft_responses (
  id uuid not null default gen_random_uuid(),
  attempt_id uuid,
  question_id uuid,
  user_id uuid,
  selected_answer integer,
  bookmarked boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.sabiquiz_mastery (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  category text not null,
  topic text not null,
  total_attempts integer default 0,
  correct_attempts integer default 0,
  mastery_percentage numeric,
  last_practiced timestamp with time zone,
  updated_at timestamp with time zone default now()
);

create table public.sabiquiz_materials (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  filename text not null,
  file_path text not null,
  file_size integer,
  extracted_text text,
  category text,
  level text,
  status text default 'processing'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.sabiquiz_questions (
  id uuid not null default gen_random_uuid(),
  material_id uuid,
  category text not null,
  level text,
  topic text,
  question text not null,
  options jsonb not null,
  correct_answer integer not null,
  rationale text,
  difficulty text default 'medium'::text,
  quality_score numeric,
  status text default 'pending'::text,
  reuse_count integer default 0,
  created_by uuid,
  reviewed_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  question_type text default 'single_correct'::text,
  correct_answers integer[],
  source_chunk_ids uuid[],
  mode text
);

create table public.sabiquiz_responses (
  id uuid not null default gen_random_uuid(),
  attempt_id uuid not null,
  question_id uuid not null,
  user_id uuid not null,
  selected_answer integer,
  correct boolean,
  time_seconds integer,
  created_at timestamp with time zone default now(),
  bookmarked boolean default false
);

create table public.sabiwrite_files (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid,
  original_name text not null,
  file_type text not null,
  mime_type text,
  file_size_bytes integer not null,
  storage_path text,
  extracted_text text,
  extracted_chars integer,
  extracted_tokens integer,
  extraction_status text default 'pending'::text,
  extraction_error text,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.sabiwrite_messages (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  role text not null,
  content text not null,
  content_type text default 'text'::text,
  operation_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table public.sabiwrite_operations (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  tool_type text not null,
  action text,
  pricing_rule_id uuid,
  input_text text,
  input_chars integer,
  input_tokens integer,
  chunk_count integer default 1,
  file_id uuid,
  output_text text,
  output_tokens integer,
  model_provider text not null,
  model_name text not null,
  route_reason text,
  cost_kobo integer not null,
  estimated_cost_kobo integer,
  status text default 'pending'::text,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_ms integer,
  created_at timestamp with time zone default now()
);

create table public.sabiwrite_output_versions (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  operation_id uuid not null,
  user_id uuid not null,
  version_number integer not null,
  content text not null,
  tool_type text not null,
  action text,
  is_current boolean default false,
  created_at timestamp with time zone default now()
);

create table public.sabiwrite_pricing_rules (
  id uuid not null default gen_random_uuid(),
  tool_type text not null,
  plan_tier text not null default 'free'::text,
  base_cost_kobo integer not null,
  per_chunk_cost_kobo integer default 0,
  max_input_tokens integer default 15000,
  model_preference text default 'deepseek'::text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.sabiwrite_refunds (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  operation_id uuid not null,
  ledger_entry_id uuid,
  amount_kobo integer not null,
  reason text,
  status text default 'pending'::text,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.sabiwrite_sessions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text,
  status text default 'active'::text,
  last_tool_used text,
  total_cost_kobo integer default 0,
  message_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table public.sabiwrite_usage (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  date date not null default CURRENT_DATE,
  tool_type text not null,
  operation_count integer default 0,
  total_input_tokens integer default 0,
  total_output_tokens integer default 0,
  total_cost_kobo integer default 0,
  deepseek_count integer default 0,
  haiku_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.session_requests (
  id uuid not null default gen_random_uuid(),
  learner_id uuid not null,
  mentor_id uuid not null,
  message text,
  status text not null default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.sessions (
  id uuid not null default gen_random_uuid(),
  learner_id uuid not null,
  mentor_id uuid not null,
  session_request_id uuid,
  offer_id uuid,
  skill_id uuid,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  duration_minutes integer default 60,
  meeting_provider text,
  meeting_url text,
  status text not null default 'proposed'::text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table public.skills (
  id uuid not null default gen_random_uuid(),
  name character varying(100) not null,
  slug character varying(100) not null,
  category skill_category not null default 'other'::skill_category,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.study_streaks (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  total_study_days integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  freezes_available integer not null default 1,
  freeze_last_replenished date,
  last_freeze_used_on date
);
comment on table public.study_streaks is 'Gamification: track consecutive study days';

create table public.subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null,
  status text not null default 'inactive'::text,
  provider text default 'flutterwave'::text,
  provider_subscription_id text,
  provider_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.thread_participants (
  thread_id uuid not null,
  user_id uuid not null,
  role text not null,
  last_read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table public.threads (
  id uuid not null default gen_random_uuid(),
  session_id uuid,
  context text not null default 'session_request'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid,
  course_id uuid,
  amount integer not null,
  currency text not null default 'NGN'::text,
  provider text default 'flutterwave'::text,
  provider_tx_ref text,
  provider_transaction_id text,
  status text not null default 'pending'::text,
  transaction_type text not null default 'subscription'::text,
  raw_event jsonb,
  created_at timestamp with time zone default now()
);

create table public.user_badges (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  badge_id text not null,
  badge_name text not null,
  badge_description text,
  earned_at timestamp with time zone default now()
);

create table public.user_learning_context (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  learning_goals text[],
  weak_topics jsonb default '[]'::jsonb,
  strong_topics jsonb default '[]'::jsonb,
  learning_style text,
  current_occupation text,
  career_goals text[],
  transition_timeline text,
  preferred_study_times text[],
  study_hours_per_week integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
comment on table public.user_learning_context is 'Core learning profile and context for each user';

create table public.user_progress (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  lesson_id uuid not null,
  course_id uuid not null,
  completed_at timestamp with time zone,
  watch_time_seconds integer default 0,
  last_position_seconds integer default 0,
  created_at timestamp with time zone default now()
);

create table public.user_xp (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  total_xp integer default 0,
  current_level integer default 1,
  xp_this_week integer default 0,
  week_start_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.users (
  id uuid not null,
  email character varying(255) not null,
  full_name character varying(255) not null,
  role user_role not null default 'learner'::user_role,
  profile_image_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  phone text,
  location text,
  website text,
  avatar_url text,
  is_super_admin boolean not null default false,
  status user_status not null default 'active'::user_status,
  last_seen_at timestamp with time zone,
  preferred_language text default 'english'::text,
  plan_tier text default 'free'::text,
  platform_role platform_role
);

create table public.waitlist_signups (
  id uuid not null default uuid_generate_v4(),
  email text not null,
  full_name text,
  interest text,
  source text not null default 'website'::text,
  created_at timestamp with time zone not null default now()
);
comment on table public.waitlist_signups is 'Pre-launch interest capture. No account created. Cleaned up once public signup opens.';

create table public.wallet_accounts (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  balance_kobo integer not null default 0,
  currency text not null default 'NGN'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.wallet_ledger (
  id uuid not null default gen_random_uuid(),
  wallet_id uuid not null,
  user_id uuid not null,
  transaction_type text not null,
  amount_kobo integer not null,
  balance_before integer not null,
  balance_after integer not null,
  reference_type text,
  reference_id uuid,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  service text default 'sabiwrite'::text,
  service_ref_id uuid
);

create table public.wallet_transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type character varying(20) not null,
  amount_kobo integer not null,
  reference character varying(255),
  description text,
  status character varying(20) default 'pending'::character varying,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  service text default 'general'::text
);

create table public.xp_events (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  source text not null,
  points integer not null,
  ref_id text not null,
  created_at timestamp with time zone not null default now()
);

create table public.xp_history (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  amount integer not null,
  source text not null,
  reference_id uuid,
  created_at timestamp with time zone default now()
);

alter table public.advisor_ai_cache add constraint advisor_ai_cache_input_hash_operation_type_key UNIQUE (input_hash, operation_type);

alter table public.advisor_ai_cache add constraint advisor_ai_cache_pkey PRIMARY KEY (id);

alter table public.advisor_operations add constraint advisor_operations_module_check CHECK ((module = ANY (ARRAY['cv'::text, 'cover_letter'::text, 'interview'::text, 'roadmap'::text, 'sabiquiz'::text])));

alter table public.advisor_operations add constraint advisor_operations_pkey PRIMARY KEY (id);

alter table public.advisor_operations add constraint advisor_operations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text])));

alter table public.advisor_pricing add constraint advisor_pricing_module_check CHECK ((module = ANY (ARRAY['cv'::text, 'cover_letter'::text, 'interview'::text, 'roadmap'::text, 'sabiquiz'::text])));

alter table public.advisor_pricing add constraint advisor_pricing_operation_type_key UNIQUE (operation_type);

alter table public.advisor_pricing add constraint advisor_pricing_pkey PRIMARY KEY (id);

alter table public.ai_usage add constraint ai_usage_pkey PRIMARY KEY (id);

alter table public.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id);

alter table public.availability_slots add constraint availability_slots_pkey PRIMARY KEY (id);

alter table public.availability_slots add constraint unique_user_day_time UNIQUE (user_id, day_of_week, start_time);

alter table public.availability_slots add constraint valid_time_range CHECK ((end_time > start_time));

alter table public.blocks add constraint blocks_pkey PRIMARY KEY (id);

alter table public.blocks add constraint no_self_block CHECK ((blocker_id <> blocked_id));

alter table public.blocks add constraint unique_block UNIQUE (blocker_id, blocked_id);

alter table public.career_profiles add constraint career_profiles_pkey PRIMARY KEY (id);

alter table public.career_profiles add constraint career_profiles_user_id_key UNIQUE (user_id);

alter table public.career_results add constraint career_results_pkey PRIMARY KEY (id);

alter table public.career_surveys add constraint career_surveys_pkey PRIMARY KEY (id);

alter table public.categories add constraint categories_pkey PRIMARY KEY (id);

alter table public.categories add constraint categories_slug_key UNIQUE (slug);

alter table public.certificates add constraint certificates_certificate_number_key UNIQUE (certificate_number);

alter table public.certificates add constraint certificates_grade_percentage_check CHECK (((grade_percentage >= 0) AND (grade_percentage <= 100)));

alter table public.certificates add constraint certificates_kind_target CHECK ((((kind = 'course'::text) AND (course_id IS NOT NULL)) OR ((kind = 'program'::text) AND (program_id IS NOT NULL))));

alter table public.certificates add constraint certificates_pkey PRIMARY KEY (id);

alter table public.certificates add constraint certificates_user_id_course_id_key UNIQUE (user_id, course_id);

alter table public.chat_history add constraint chat_history_pkey PRIMARY KEY (id);

alter table public.cohort_invites add constraint cohort_invites_max_uses_positive CHECK (((max_uses IS NULL) OR (max_uses > 0)));

alter table public.cohort_invites add constraint cohort_invites_pkey PRIMARY KEY (id);

alter table public.cohort_invites add constraint cohort_invites_revoke_consistency CHECK ((((status = 'REVOKED'::cohort_invite_status) AND (revoked_at IS NOT NULL)) OR ((status <> 'REVOKED'::cohort_invite_status) AND (revoked_at IS NULL))));

alter table public.cohort_invites add constraint cohort_invites_token_key UNIQUE (token);

alter table public.cohort_invites add constraint cohort_invites_use_count_nonneg CHECK ((use_count >= 0));

alter table public.cohort_invites add constraint cohort_invites_use_count_not_over CHECK (((max_uses IS NULL) OR (use_count <= max_uses)));

alter table public.cohort_members add constraint cohort_members_cohort_id_user_id_key UNIQUE (cohort_id, user_id);

alter table public.cohort_members add constraint cohort_members_pkey PRIMARY KEY (id);

alter table public.cohorts add constraint cohorts_pkey PRIMARY KEY (id);

alter table public.cohorts add constraint cohorts_program_id_slug_key UNIQUE (program_id, slug);

alter table public.community_offers add constraint community_offers_pkey PRIMARY KEY (id);

alter table public.community_offers add constraint community_offers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'withdrawn'::text])));

alter table public.community_offers add constraint unique_offer_per_request UNIQUE (request_id, mentor_id);

alter table public.community_profiles add constraint community_profiles_pkey PRIMARY KEY (id);

alter table public.community_profiles add constraint community_profiles_username_key UNIQUE (username);

alter table public.community_profiles add constraint unique_user_community_profile UNIQUE (user_id);

alter table public.conversation_insights add constraint conversation_insights_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100)));

alter table public.conversation_insights add constraint conversation_insights_pkey PRIMARY KEY (id);

alter table public.course_discussions add constraint course_discussions_pkey PRIMARY KEY (id);

alter table public.course_enrollments add constraint course_enrollments_pkey PRIMARY KEY (id);

alter table public.course_enrollments add constraint course_enrollments_user_id_course_id_key UNIQUE (user_id, course_id);

alter table public.course_enrollments add constraint unique_user_course UNIQUE (user_id, course_id);

alter table public.course_purchases add constraint course_purchases_pkey PRIMARY KEY (id);

alter table public.course_purchases add constraint course_purchases_user_id_course_id_key UNIQUE (user_id, course_id);

alter table public.courses add constraint courses_pkey PRIMARY KEY (id);

alter table public.courses add constraint courses_slug_key UNIQUE (slug);

alter table public.cover_letter_documents add constraint cover_letter_documents_pkey PRIMARY KEY (id);

alter table public.cover_letters add constraint cover_letters_length_check CHECK ((length = ANY (ARRAY['short'::text, 'standard'::text, 'detailed'::text, 'email'::text])));

alter table public.cover_letters add constraint cover_letters_pkey PRIMARY KEY (id);

alter table public.cover_letters add constraint cover_letters_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'complete'::text, 'exported'::text])));

alter table public.cover_letters add constraint cover_letters_tone_check CHECK ((tone = ANY (ARRAY['professional'::text, 'confident'::text, 'executive'::text, 'friendly'::text])));

alter table public.cv_documents add constraint cv_documents_format_check CHECK ((format = ANY (ARRAY['ats-1page'::text, 'ats-2page'::text, 'tech'::text, 'creative'::text, 'ATS-1page'::text, 'ATS-2page'::text, 'REMOTE_OPTIMISED_ATS'::text])));

alter table public.cv_documents add constraint cv_documents_level_check CHECK ((level = ANY (ARRAY['entry'::text, 'mid'::text, 'senior'::text, 'executive'::text])));

alter table public.cv_documents add constraint cv_documents_pkey PRIMARY KEY (id);

alter table public.cv_documents add constraint cv_documents_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'complete'::text, 'exported'::text])));

alter table public.enrollments add constraint enrollments_pkey PRIMARY KEY (id);

alter table public.enrollments add constraint enrollments_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100)));

alter table public.enrollments add constraint enrollments_user_id_course_id_key UNIQUE (user_id, course_id);

alter table public.entitlements add constraint entitlements_pkey PRIMARY KEY (id);

alter table public.entitlements add constraint entitlements_user_id_key_key UNIQUE (user_id, key);

alter table public.generation_runs add constraint generation_runs_pkey PRIMARY KEY (id);

alter table public.institution_applications add constraint institution_applications_pkey PRIMARY KEY (id);

alter table public.institution_invites add constraint institution_invites_max_uses_positive CHECK (((max_uses IS NULL) OR (max_uses > 0)));

alter table public.institution_invites add constraint institution_invites_pkey PRIMARY KEY (id);

alter table public.institution_invites add constraint institution_invites_revoke_consistency CHECK ((((status = 'REVOKED'::cohort_invite_status) AND (revoked_at IS NOT NULL)) OR ((status <> 'REVOKED'::cohort_invite_status) AND (revoked_at IS NULL))));

alter table public.institution_invites add constraint institution_invites_token_key UNIQUE (token);

alter table public.institution_invites add constraint institution_invites_use_count_nonneg CHECK ((use_count >= 0));

alter table public.institution_invites add constraint institution_invites_use_count_not_over CHECK (((max_uses IS NULL) OR (use_count <= max_uses)));

alter table public.institution_members add constraint institution_members_institution_id_user_id_key UNIQUE (institution_id, user_id);

alter table public.institution_members add constraint institution_members_pkey PRIMARY KEY (id);

alter table public.institutions add constraint institutions_pkey PRIMARY KEY (id);

alter table public.institutions add constraint institutions_slug_key UNIQUE (slug);

alter table public.instructor_profiles add constraint instructor_profiles_pkey PRIMARY KEY (id);

alter table public.instructor_profiles add constraint instructor_profiles_user_id_key UNIQUE (user_id);

alter table public.interview_answers add constraint interview_answers_pkey PRIMARY KEY (id);

alter table public.interview_answers add constraint interview_answers_score_check CHECK (((score >= 0) AND (score <= 100)));

alter table public.interview_kits add constraint interview_kits_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])));

alter table public.interview_kits add constraint interview_kits_pkey PRIMARY KEY (id);

alter table public.interview_kits add constraint interview_kits_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'complete'::text])));

alter table public.interview_sessions add constraint interview_sessions_mode_check CHECK ((mode = ANY (ARRAY['quick'::text, 'deep'::text, 'mock'::text])));

alter table public.interview_sessions add constraint interview_sessions_pkey PRIMARY KEY (id);

alter table public.interview_sessions add constraint interview_sessions_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])));

alter table public.learning_milestones add constraint learning_milestones_pkey PRIMARY KEY (id);

alter table public.lesson_ai_artifacts add constraint lesson_ai_artifacts_pkey PRIMARY KEY (lesson_id);

alter table public.lesson_notes add constraint lesson_notes_pkey PRIMARY KEY (id);

alter table public.lesson_notes add constraint lesson_notes_user_id_lesson_id_key UNIQUE (user_id, lesson_id);

alter table public.lesson_progress add constraint lesson_progress_pkey PRIMARY KEY (id);

alter table public.lesson_progress add constraint lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);

alter table public.lesson_questions add constraint lesson_questions_pkey PRIMARY KEY (id);

alter table public.lessons add constraint lessons_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['text'::character varying, 'video'::character varying, 'pdf'::character varying, 'powerpoint'::character varying, 'youtube'::character varying])::text[])));

alter table public.lessons add constraint lessons_pkey PRIMARY KEY (id);

alter table public.material_chunks add constraint material_chunks_pkey PRIMARY KEY (id);

alter table public.mentor_profiles add constraint mentor_profiles_pkey PRIMARY KEY (id);

alter table public.messages add constraint messages_content_type_check CHECK ((content_type = ANY (ARRAY['text'::text, 'system'::text])));

alter table public.messages add constraint messages_pkey PRIMARY KEY (id);

alter table public.mobile_entitlements add constraint mobile_entitlements_payment_provider_check CHECK ((payment_provider = ANY (ARRAY['google_play'::text, 'apple_iap'::text, 'paystack'::text])));

alter table public.mobile_entitlements add constraint mobile_entitlements_pkey PRIMARY KEY (id);

alter table public.mobile_entitlements add constraint mobile_entitlements_status_check CHECK ((status = ANY (ARRAY['paid'::text, 'consumed'::text, 'expired'::text, 'refunded'::text])));

alter table public.mobile_entitlements add constraint mobile_entitlements_transaction_id_key UNIQUE (transaction_id);

alter table public.mobile_operations add constraint mobile_operations_pkey PRIMARY KEY (id);

alter table public.mobile_operations add constraint mobile_operations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));

alter table public.mobile_wallet_ledger add constraint mobile_wallet_ledger_pkey PRIMARY KEY (id);

alter table public.mobile_wallet_ledger add constraint mobile_wallet_ledger_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['credit'::text, 'debit'::text, 'refund'::text])));

alter table public.mobile_wallets add constraint mobile_wallets_device_id_key UNIQUE (device_id);

alter table public.mobile_wallets add constraint mobile_wallets_pkey PRIMARY KEY (id);

alter table public.modules add constraint modules_pkey PRIMARY KEY (id);

alter table public.modules add constraint positive_order_index CHECK ((order_index >= 1));

alter table public.modules add constraint unique_course_module_order UNIQUE (course_id, order_index);

alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);

alter table public.notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['session_request'::text, 'session_request_accepted'::text, 'session_request_declined'::text, 'offer'::text, 'offer_accepted'::text, 'offer_declined'::text, 'session_scheduled'::text, 'session_reminder'::text, 'message'::text, 'review_prompt'::text])));

alter table public.org_metrics_daily add constraint org_metrics_daily_date_key UNIQUE (date);

alter table public.org_metrics_daily add constraint org_metrics_daily_pkey PRIMARY KEY (id);

alter table public.plans add constraint plans_code_key UNIQUE (code);

alter table public.plans add constraint plans_pkey PRIMARY KEY (id);

alter table public.platform_settings add constraint platform_settings_pkey PRIMARY KEY (key);

alter table public.profile_skills add constraint profile_skills_pkey PRIMARY KEY (id);

alter table public.profile_skills add constraint unique_user_skill_type UNIQUE (user_id, skill_id, skill_type);

alter table public.program_courses add constraint program_courses_pkey PRIMARY KEY (id);

alter table public.program_courses add constraint program_courses_program_id_course_id_key UNIQUE (program_id, course_id);

alter table public.programs add constraint programs_institution_id_slug_key UNIQUE (institution_id, slug);

alter table public.programs add constraint programs_pkey PRIMARY KEY (id);

alter table public.qa_cache add constraint qa_cache_lesson_id_lang_question_hash_key UNIQUE (lesson_id, lang, question_hash);

alter table public.qa_cache add constraint qa_cache_pkey PRIMARY KEY (id);

alter table public.quiz_attempts add constraint quiz_attempts_pkey PRIMARY KEY (id);

alter table public.quiz_attempts add constraint quiz_attempts_score_percentage_check CHECK (((score_percentage >= 0) AND (score_percentage <= 100)));

alter table public.quiz_questions add constraint quiz_questions_pkey PRIMARY KEY (id);

alter table public.quizzes add constraint quizzes_pkey PRIMARY KEY (id);

alter table public.reports add constraint no_self_report CHECK ((reporter_id <> reported_user_id));

alter table public.reports add constraint reports_pkey PRIMARY KEY (id);

alter table public.reports add constraint reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text])));

alter table public.requests add constraint requests_pkey PRIMARY KEY (id);

alter table public.reviews add constraint no_self_review CHECK ((reviewer_id <> reviewee_id));

alter table public.reviews add constraint reviews_pkey PRIMARY KEY (id);

alter table public.reviews add constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

alter table public.reviews add constraint unique_review_per_session UNIQUE (session_id, reviewer_id);

alter table public.sabiquiz_attempts add constraint sabiquiz_attempts_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])));

alter table public.sabiquiz_attempts add constraint sabiquiz_attempts_pkey PRIMARY KEY (id);

alter table public.sabiquiz_attempts add constraint sabiquiz_attempts_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])));

alter table public.sabiquiz_draft_responses add constraint sabiquiz_draft_responses_attempt_id_question_id_key UNIQUE (attempt_id, question_id);

alter table public.sabiquiz_draft_responses add constraint sabiquiz_draft_responses_pkey PRIMARY KEY (id);

alter table public.sabiquiz_mastery add constraint sabiquiz_mastery_pkey PRIMARY KEY (id);

alter table public.sabiquiz_mastery add constraint sabiquiz_mastery_user_id_subject_topic_key UNIQUE (user_id, category, topic);

alter table public.sabiquiz_mastery add constraint sabiquiz_mastery_user_topic_unique UNIQUE (user_id, topic);

alter table public.sabiquiz_materials add constraint sabiquiz_materials_pkey PRIMARY KEY (id);

alter table public.sabiquiz_materials add constraint sabiquiz_materials_status_check CHECK ((status = ANY (ARRAY['processing'::text, 'ready'::text, 'failed'::text])));

alter table public.sabiquiz_questions add constraint sabiquiz_questions_correct_answer_check CHECK (((correct_answer >= 0) AND (correct_answer <= 3)));

alter table public.sabiquiz_questions add constraint sabiquiz_questions_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])));

alter table public.sabiquiz_questions add constraint sabiquiz_questions_pkey PRIMARY KEY (id);

alter table public.sabiquiz_questions add constraint sabiquiz_questions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

alter table public.sabiquiz_responses add constraint sabiquiz_responses_pkey PRIMARY KEY (id);

alter table public.sabiquiz_responses add constraint sabiquiz_responses_selected_answer_check CHECK (((selected_answer >= 0) AND (selected_answer <= 3)));

alter table public.sabiwrite_files add constraint sabiwrite_files_extraction_status_check CHECK ((extraction_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])));

alter table public.sabiwrite_files add constraint sabiwrite_files_pkey PRIMARY KEY (id);

alter table public.sabiwrite_messages add constraint sabiwrite_messages_content_type_check CHECK ((content_type = ANY (ARRAY['text'::text, 'file'::text, 'output'::text, 'receipt'::text])));

alter table public.sabiwrite_messages add constraint sabiwrite_messages_pkey PRIMARY KEY (id);

alter table public.sabiwrite_messages add constraint sabiwrite_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])));

alter table public.sabiwrite_operations add constraint sabiwrite_operations_pkey PRIMARY KEY (id);

alter table public.sabiwrite_operations add constraint sabiwrite_operations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'partial'::text])));

alter table public.sabiwrite_output_versions add constraint sabiwrite_output_versions_pkey PRIMARY KEY (id);

alter table public.sabiwrite_pricing_rules add constraint sabiwrite_pricing_rules_pkey PRIMARY KEY (id);

alter table public.sabiwrite_pricing_rules add constraint sabiwrite_pricing_rules_tool_type_plan_tier_key UNIQUE (tool_type, plan_tier);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_pkey PRIMARY KEY (id);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'processed'::text])));

alter table public.sabiwrite_sessions add constraint sabiwrite_sessions_pkey PRIMARY KEY (id);

alter table public.sabiwrite_sessions add constraint sabiwrite_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'deleted'::text])));

alter table public.sabiwrite_usage add constraint sabiwrite_usage_pkey PRIMARY KEY (id);

alter table public.sabiwrite_usage add constraint sabiwrite_usage_user_id_date_tool_type_key UNIQUE (user_id, date, tool_type);

alter table public.session_requests add constraint no_self_request CHECK ((learner_id <> mentor_id));

alter table public.session_requests add constraint session_requests_pkey PRIMARY KEY (id);

alter table public.session_requests add constraint session_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])));

alter table public.sessions add constraint sessions_meeting_provider_check CHECK ((meeting_provider = ANY (ARRAY['google_meet'::text, 'zoom'::text, 'whatsapp'::text, 'discord'::text, 'other'::text])));

alter table public.sessions add constraint sessions_pkey PRIMARY KEY (id);

alter table public.sessions add constraint sessions_status_check CHECK ((status = ANY (ARRAY['proposed'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])));

alter table public.skills add constraint skills_pkey PRIMARY KEY (id);

alter table public.skills add constraint skills_slug_key UNIQUE (slug);

alter table public.study_streaks add constraint study_streaks_pkey PRIMARY KEY (id);

alter table public.study_streaks add constraint study_streaks_user_id_key UNIQUE (user_id);

alter table public.study_streaks add constraint study_streaks_user_id_unique UNIQUE (user_id);

alter table public.subscriptions add constraint subscriptions_pkey PRIMARY KEY (id);

alter table public.subscriptions add constraint subscriptions_user_id_unique UNIQUE (user_id);

alter table public.thread_participants add constraint thread_participants_pkey PRIMARY KEY (thread_id, user_id);

alter table public.thread_participants add constraint thread_participants_role_check CHECK ((role = ANY (ARRAY['learner'::text, 'mentor'::text])));

alter table public.threads add constraint threads_context_check CHECK ((context = ANY (ARRAY['session_request'::text, 'offer'::text, 'general'::text])));

alter table public.threads add constraint threads_pkey PRIMARY KEY (id);

alter table public.transactions add constraint transactions_pkey PRIMARY KEY (id);

alter table public.transactions add constraint transactions_provider_tx_ref_key UNIQUE (provider_tx_ref);

alter table public.user_badges add constraint user_badges_pkey PRIMARY KEY (id);

alter table public.user_badges add constraint user_badges_unique UNIQUE (user_id, badge_id);

alter table public.user_learning_context add constraint user_learning_context_learning_style_check CHECK ((learning_style = ANY (ARRAY['visual'::text, 'auditory'::text, 'reading'::text, 'kinesthetic'::text, 'mixed'::text])));

alter table public.user_learning_context add constraint user_learning_context_pkey PRIMARY KEY (id);

alter table public.user_progress add constraint user_progress_pkey PRIMARY KEY (id);

alter table public.user_progress add constraint user_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);

alter table public.user_xp add constraint user_xp_pkey PRIMARY KEY (id);

alter table public.user_xp add constraint user_xp_user_id_unique UNIQUE (user_id);

alter table public.users add constraint users_email_key UNIQUE (email);

alter table public.users add constraint users_pkey PRIMARY KEY (id);

alter table public.users add constraint users_preferred_language_check CHECK ((preferred_language = ANY (ARRAY['english'::text, 'pidgin'::text, 'yoruba'::text, 'hausa'::text, 'igbo'::text])));

alter table public.waitlist_signups add constraint waitlist_signups_pkey PRIMARY KEY (id);

alter table public.wallet_accounts add constraint wallet_accounts_pkey PRIMARY KEY (id);

alter table public.wallet_accounts add constraint wallet_accounts_user_id_key UNIQUE (user_id);

alter table public.wallet_ledger add constraint wallet_ledger_pkey PRIMARY KEY (id);

alter table public.wallet_ledger add constraint wallet_ledger_service_check CHECK ((service = ANY (ARRAY['sabiwrite'::text, 'courses'::text, 'community'::text, 'advisor'::text, 'quiz'::text, 'general'::text, 'subscription'::text])));

alter table public.wallet_ledger add constraint wallet_ledger_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['credit'::text, 'debit'::text, 'refund'::text, 'bonus'::text])));

alter table public.wallet_transactions add constraint wallet_transactions_pkey PRIMARY KEY (id);

alter table public.wallet_transactions add constraint wallet_transactions_reference_key UNIQUE (reference);

alter table public.wallet_transactions add constraint wallet_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])));

alter table public.wallet_transactions add constraint wallet_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::text[])));

alter table public.xp_events add constraint xp_events_pkey PRIMARY KEY (id);

alter table public.xp_events add constraint xp_events_user_id_source_ref_id_key UNIQUE (user_id, source, ref_id);

alter table public.xp_history add constraint xp_history_pkey PRIMARY KEY (id);

alter table public.advisor_operations add constraint advisor_operations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.ai_usage add constraint ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

alter table public.audit_logs add constraint audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.availability_slots add constraint availability_slots_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.blocks add constraint blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.blocks add constraint blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.career_profiles add constraint career_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.career_results add constraint career_results_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES career_surveys(id);

alter table public.career_results add constraint career_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.career_surveys add constraint career_surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.certificates add constraint certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.certificates add constraint certificates_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

alter table public.certificates add constraint certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.chat_history add constraint chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.cohort_invites add constraint cohort_invites_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;

alter table public.cohort_invites add constraint cohort_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

alter table public.cohort_invites add constraint cohort_invites_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.cohort_members add constraint cohort_members_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.cohort_members add constraint cohort_members_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;

alter table public.cohort_members add constraint cohort_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.cohort_members add constraint cohort_members_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.cohort_members add constraint cohort_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.cohorts add constraint cohorts_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.cohorts add constraint cohorts_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

alter table public.community_offers add constraint community_offers_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.community_offers add constraint community_offers_request_id_fkey FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;

alter table public.community_profiles add constraint community_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.conversation_insights add constraint conversation_insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.course_discussions add constraint course_discussions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.course_discussions add constraint course_discussions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES course_discussions(id) ON DELETE CASCADE;

alter table public.course_discussions add constraint course_discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.course_enrollments add constraint course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.course_enrollments add constraint course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.course_purchases add constraint course_purchases_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.course_purchases add constraint course_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.courses add constraint courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id);

alter table public.courses add constraint courses_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

alter table public.courses add constraint courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES users(id);

alter table public.courses add constraint courses_instructor_id_fkey1 FOREIGN KEY (instructor_id) REFERENCES auth.users(id);

alter table public.cover_letter_documents add constraint cover_letter_documents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES cover_letter_documents(id);

alter table public.cover_letter_documents add constraint cover_letter_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.cover_letters add constraint cover_letters_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES cv_documents(id) ON DELETE SET NULL;

alter table public.cover_letters add constraint cover_letters_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES cover_letters(id) ON DELETE SET NULL;

alter table public.cover_letters add constraint cover_letters_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES career_profiles(id) ON DELETE SET NULL;

alter table public.cover_letters add constraint cover_letters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.cv_documents add constraint cv_documents_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES cv_documents(id) ON DELETE SET NULL;

alter table public.cv_documents add constraint cv_documents_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES career_profiles(id) ON DELETE SET NULL;

alter table public.cv_documents add constraint cv_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.enrollments add constraint enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.enrollments add constraint enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.entitlements add constraint entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.generation_runs add constraint generation_runs_material_id_fkey FOREIGN KEY (material_id) REFERENCES sabiquiz_materials(id) ON DELETE CASCADE;

alter table public.generation_runs add constraint generation_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.institution_applications add constraint institution_applications_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

alter table public.institution_applications add constraint institution_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.institution_invites add constraint institution_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

alter table public.institution_invites add constraint institution_invites_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

alter table public.institution_invites add constraint institution_invites_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.institution_members add constraint institution_members_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

alter table public.institution_members add constraint institution_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id);

alter table public.institution_members add constraint institution_members_suspended_by_fkey FOREIGN KEY (suspended_by) REFERENCES users(id);

alter table public.institution_members add constraint institution_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.institutions add constraint institutions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

alter table public.institutions add constraint institutions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id);

alter table public.instructor_profiles add constraint instructor_profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id);

alter table public.instructor_profiles add constraint instructor_profiles_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

alter table public.instructor_profiles add constraint instructor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.interview_answers add constraint interview_answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE;

alter table public.interview_answers add constraint interview_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.interview_kits add constraint interview_kits_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES career_profiles(id) ON DELETE SET NULL;

alter table public.interview_kits add constraint interview_kits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.interview_sessions add constraint interview_sessions_kit_id_fkey FOREIGN KEY (kit_id) REFERENCES interview_kits(id) ON DELETE CASCADE;

alter table public.interview_sessions add constraint interview_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.learning_milestones add constraint learning_milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.lesson_ai_artifacts add constraint lesson_ai_artifacts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.lesson_notes add constraint lesson_notes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.lesson_notes add constraint lesson_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.lesson_progress add constraint lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.lesson_progress add constraint lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.lesson_progress add constraint lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.lesson_questions add constraint lesson_questions_answered_by_fkey FOREIGN KEY (answered_by) REFERENCES users(id);

alter table public.lesson_questions add constraint lesson_questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.lesson_questions add constraint lesson_questions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.lesson_questions add constraint lesson_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.lessons add constraint lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.lessons add constraint lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL;

alter table public.material_chunks add constraint material_chunks_material_id_fkey FOREIGN KEY (material_id) REFERENCES sabiquiz_materials(id) ON DELETE CASCADE;

alter table public.mentor_profiles add constraint mentor_profiles_id_fkey FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.messages add constraint messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE;

alter table public.mobile_operations add constraint mobile_operations_entitlement_id_fkey FOREIGN KEY (entitlement_id) REFERENCES mobile_entitlements(id);

alter table public.mobile_wallet_ledger add constraint mobile_wallet_ledger_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES mobile_wallets(id);

alter table public.modules add constraint modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.platform_settings add constraint platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.profile_skills add constraint profile_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;

alter table public.profile_skills add constraint profile_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.program_courses add constraint program_courses_added_by_fkey FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.program_courses add constraint program_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.program_courses add constraint program_courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

alter table public.programs add constraint programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

alter table public.programs add constraint programs_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

alter table public.qa_cache add constraint qa_cache_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.quiz_attempts add constraint quiz_attempts_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

alter table public.quiz_attempts add constraint quiz_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.quiz_attempts add constraint quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.quizzes add constraint quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.reports add constraint reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL;

alter table public.reports add constraint reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.reports add constraint reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.reports add constraint reports_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE SET NULL;

alter table public.requests add constraint requests_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL;

alter table public.requests add constraint requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

alter table public.sabiquiz_attempts add constraint sabiquiz_attempts_material_id_fkey FOREIGN KEY (material_id) REFERENCES sabiquiz_materials(id) ON DELETE CASCADE;

alter table public.sabiquiz_attempts add constraint sabiquiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiquiz_draft_responses add constraint sabiquiz_draft_responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES sabiquiz_attempts(id) ON DELETE CASCADE;

alter table public.sabiquiz_draft_responses add constraint sabiquiz_draft_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES sabiquiz_questions(id) ON DELETE CASCADE;

alter table public.sabiquiz_draft_responses add constraint sabiquiz_draft_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.sabiquiz_mastery add constraint sabiquiz_mastery_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiquiz_materials add constraint sabiquiz_materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiquiz_questions add constraint sabiquiz_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

alter table public.sabiquiz_questions add constraint sabiquiz_questions_material_id_fkey FOREIGN KEY (material_id) REFERENCES sabiquiz_materials(id) ON DELETE SET NULL;

alter table public.sabiquiz_questions add constraint sabiquiz_questions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id);

alter table public.sabiquiz_responses add constraint sabiquiz_responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES sabiquiz_attempts(id) ON DELETE CASCADE;

alter table public.sabiquiz_responses add constraint sabiquiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES sabiquiz_questions(id) ON DELETE CASCADE;

alter table public.sabiquiz_responses add constraint sabiquiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiwrite_files add constraint sabiwrite_files_session_id_fkey FOREIGN KEY (session_id) REFERENCES sabiwrite_sessions(id) ON DELETE SET NULL;

alter table public.sabiwrite_files add constraint sabiwrite_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiwrite_messages add constraint sabiwrite_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES sabiwrite_sessions(id) ON DELETE CASCADE;

alter table public.sabiwrite_messages add constraint sabiwrite_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.sabiwrite_operations add constraint sabiwrite_operations_pricing_rule_id_fkey FOREIGN KEY (pricing_rule_id) REFERENCES sabiwrite_pricing_rules(id);

alter table public.sabiwrite_operations add constraint sabiwrite_operations_session_id_fkey FOREIGN KEY (session_id) REFERENCES sabiwrite_sessions(id) ON DELETE CASCADE;

alter table public.sabiwrite_operations add constraint sabiwrite_operations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.sabiwrite_output_versions add constraint sabiwrite_output_versions_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES sabiwrite_operations(id);

alter table public.sabiwrite_output_versions add constraint sabiwrite_output_versions_session_id_fkey FOREIGN KEY (session_id) REFERENCES sabiwrite_sessions(id) ON DELETE CASCADE;

alter table public.sabiwrite_output_versions add constraint sabiwrite_output_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES wallet_ledger(id);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES sabiwrite_operations(id);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES users(id);

alter table public.sabiwrite_refunds add constraint sabiwrite_refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.sabiwrite_sessions add constraint sabiwrite_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sabiwrite_usage add constraint sabiwrite_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.session_requests add constraint session_requests_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.session_requests add constraint session_requests_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sessions add constraint sessions_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sessions add constraint sessions_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.sessions add constraint sessions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES community_offers(id) ON DELETE SET NULL;

alter table public.sessions add constraint sessions_session_request_id_fkey FOREIGN KEY (session_request_id) REFERENCES session_requests(id) ON DELETE SET NULL;

alter table public.sessions add constraint sessions_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL;

alter table public.study_streaks add constraint study_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.subscriptions add constraint subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

alter table public.subscriptions add constraint subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.thread_participants add constraint thread_participants_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE;

alter table public.thread_participants add constraint thread_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.threads add constraint threads_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;

alter table public.transactions add constraint transactions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id);

alter table public.transactions add constraint transactions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

alter table public.transactions add constraint transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.user_badges add constraint user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_learning_context add constraint user_learning_context_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_progress add constraint user_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id);

alter table public.user_progress add constraint user_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.user_progress add constraint user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.user_xp add constraint user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.users add constraint users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

alter table public.wallet_accounts add constraint wallet_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.wallet_ledger add constraint wallet_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

alter table public.wallet_ledger add constraint wallet_ledger_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallet_accounts(id);

alter table public.wallet_transactions add constraint wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.xp_events add constraint xp_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table public.xp_history add constraint xp_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX ai_usage_user_day_idx ON public.ai_usage USING btree (user_id, created_at);

CREATE INDEX certificates_program_idx ON public.certificates USING btree (program_id) WHERE (program_id IS NOT NULL);

CREATE INDEX idx_advisor_ai_cache_hash ON public.advisor_ai_cache USING btree (input_hash, operation_type);

CREATE INDEX idx_advisor_operations_user ON public.advisor_operations USING btree (user_id);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_availability_active ON public.availability_slots USING btree (user_id, is_active) WHERE (is_active = true);

CREATE INDEX idx_availability_day ON public.availability_slots USING btree (day_of_week);

CREATE INDEX idx_availability_user ON public.availability_slots USING btree (user_id);

CREATE INDEX idx_blocks_blocked ON public.blocks USING btree (blocked_id);

CREATE INDEX idx_blocks_blocker ON public.blocks USING btree (blocker_id);

CREATE INDEX idx_career_profiles_user ON public.career_profiles USING btree (user_id);

CREATE INDEX idx_career_results_survey ON public.career_results USING btree (survey_id);

CREATE INDEX idx_career_results_user ON public.career_results USING btree (user_id);

CREATE INDEX idx_career_surveys_user ON public.career_surveys USING btree (user_id);

CREATE INDEX idx_certificates_course ON public.certificates USING btree (course_id);

CREATE INDEX idx_certificates_issued_at ON public.certificates USING btree (issued_at DESC);

CREATE INDEX idx_certificates_number ON public.certificates USING btree (certificate_number);

CREATE INDEX idx_certificates_user ON public.certificates USING btree (user_id);

CREATE INDEX idx_chat_history_user_id ON public.chat_history USING btree (user_id);

CREATE INDEX idx_cohort_invites_active ON public.cohort_invites USING btree (cohort_id, status) WHERE (status = 'ACTIVE'::cohort_invite_status);

CREATE INDEX idx_cohort_invites_cohort_id ON public.cohort_invites USING btree (cohort_id, created_at DESC);

CREATE UNIQUE INDEX idx_cohort_invites_token ON public.cohort_invites USING btree (token);

CREATE INDEX idx_cohort_members_cohort ON public.cohort_members USING btree (cohort_id);

CREATE INDEX idx_cohort_members_invitation_token ON public.cohort_members USING btree (invitation_token) WHERE (invitation_token IS NOT NULL);

CREATE INDEX idx_cohort_members_status ON public.cohort_members USING btree (status);

CREATE INDEX idx_cohort_members_user ON public.cohort_members USING btree (user_id);

CREATE INDEX idx_cohorts_access_code ON public.cohorts USING btree (access_code) WHERE (access_code IS NOT NULL);

CREATE INDEX idx_cohorts_program ON public.cohorts USING btree (program_id);

CREATE INDEX idx_cohorts_status ON public.cohorts USING btree (status);

CREATE INDEX idx_community_offers_mentor ON public.community_offers USING btree (mentor_id);

CREATE INDEX idx_community_offers_request ON public.community_offers USING btree (request_id);

CREATE INDEX idx_community_offers_status ON public.community_offers USING btree (status);

CREATE INDEX idx_community_profiles_available ON public.community_profiles USING btree (is_available_to_mentor) WHERE ((is_available_to_mentor = true) AND (is_public = true) AND (is_suspended = false));

CREATE INDEX idx_community_profiles_user ON public.community_profiles USING btree (user_id);

CREATE INDEX idx_community_profiles_username ON public.community_profiles USING btree (username);

CREATE INDEX idx_course_purchases_course_id ON public.course_purchases USING btree (course_id);

CREATE INDEX idx_course_purchases_user_id ON public.course_purchases USING btree (user_id);

CREATE INDEX idx_courses_institution_id ON public.courses USING btree (institution_id);

CREATE INDEX idx_courses_is_free ON public.courses USING btree (is_free);

CREATE INDEX idx_cover_letters_current ON public.cover_letters USING btree (user_id, is_current) WHERE (is_current = true);

CREATE INDEX idx_cover_letters_is_current ON public.cover_letter_documents USING btree (is_current);

CREATE INDEX idx_cover_letters_target_role ON public.cover_letter_documents USING btree (target_role);

CREATE INDEX idx_cover_letters_user ON public.cover_letters USING btree (user_id);

CREATE INDEX idx_cover_letters_user_id ON public.cover_letter_documents USING btree (user_id);

CREATE INDEX idx_cv_documents_current ON public.cv_documents USING btree (user_id, is_current) WHERE (is_current = true);

CREATE INDEX idx_cv_documents_user ON public.cv_documents USING btree (user_id);

CREATE INDEX idx_draft_responses_attempt ON public.sabiquiz_draft_responses USING btree (attempt_id);

CREATE INDEX idx_enrollments_completed_at ON public.enrollments USING btree (completed_at DESC);

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);

CREATE INDEX idx_enrollments_enrolled_at ON public.enrollments USING btree (enrolled_at DESC);

CREATE INDEX idx_enrollments_user ON public.enrollments USING btree (user_id);

CREATE INDEX idx_entitlements_key ON public.entitlements USING btree (key);

CREATE INDEX idx_entitlements_user_id ON public.entitlements USING btree (user_id);

CREATE INDEX idx_generation_runs_material_id ON public.generation_runs USING btree (material_id);

CREATE INDEX idx_generation_runs_user_id ON public.generation_runs USING btree (user_id);

CREATE INDEX idx_insights_active ON public.conversation_insights USING btree (user_id, is_active);

CREATE INDEX idx_insights_user ON public.conversation_insights USING btree (user_id);

CREATE INDEX idx_inst_apps_created ON public.institution_applications USING btree (created_at DESC);

CREATE INDEX idx_inst_apps_email ON public.institution_applications USING btree (lower(email));

CREATE UNIQUE INDEX idx_inst_apps_pending_email ON public.institution_applications USING btree (lower(email)) WHERE (status = 'pending'::text);

CREATE INDEX idx_inst_apps_status ON public.institution_applications USING btree (status);

CREATE INDEX idx_institution_invites_active ON public.institution_invites USING btree (institution_id, status) WHERE (status = 'ACTIVE'::cohort_invite_status);

CREATE INDEX idx_institution_invites_institution ON public.institution_invites USING btree (institution_id, created_at DESC);

CREATE INDEX idx_institution_members_institution ON public.institution_members USING btree (institution_id);

CREATE INDEX idx_institution_members_role ON public.institution_members USING btree (role);

CREATE INDEX idx_institution_members_status ON public.institution_members USING btree (status);

CREATE INDEX idx_institution_members_user ON public.institution_members USING btree (user_id);

CREATE INDEX idx_institutions_country ON public.institutions USING btree (country);

CREATE INDEX idx_institutions_created_by ON public.institutions USING btree (created_by);

CREATE INDEX idx_institutions_slug ON public.institutions USING btree (slug);

CREATE INDEX idx_institutions_status ON public.institutions USING btree (status);

CREATE INDEX idx_institutions_type ON public.institutions USING btree (type);

CREATE INDEX idx_instructor_profiles_institution ON public.instructor_profiles USING btree (institution_id);

CREATE INDEX idx_instructor_profiles_status ON public.instructor_profiles USING btree (status);

CREATE INDEX idx_instructor_profiles_user ON public.instructor_profiles USING btree (user_id);

CREATE INDEX idx_interview_answers_session ON public.interview_answers USING btree (session_id);

CREATE INDEX idx_interview_kits_user ON public.interview_kits USING btree (user_id);

CREATE INDEX idx_interview_sessions_user ON public.interview_sessions USING btree (user_id);

CREATE INDEX idx_learning_context_user ON public.user_learning_context USING btree (user_id);

CREATE INDEX idx_lesson_progress_course ON public.lesson_progress USING btree (course_id);

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);

CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);

CREATE INDEX idx_lessons_module_order ON public.lessons USING btree (module_id, lesson_order);

CREATE INDEX idx_material_chunks_material_id ON public.material_chunks USING btree (material_id);

CREATE INDEX idx_mentor_profiles_verified ON public.mentor_profiles USING btree (verified);

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

CREATE INDEX idx_messages_thread ON public.messages USING btree (thread_id);

CREATE INDEX idx_messages_thread_created ON public.messages USING btree (thread_id, created_at DESC);

CREATE INDEX idx_milestones_celebrated ON public.learning_milestones USING btree (user_id, celebrated);

CREATE INDEX idx_milestones_user ON public.learning_milestones USING btree (user_id);

CREATE INDEX idx_mobile_entitlements_device ON public.mobile_entitlements USING btree (device_id, status);

CREATE INDEX idx_mobile_entitlements_status ON public.mobile_entitlements USING btree (status, expires_at);

CREATE INDEX idx_mobile_entitlements_transaction ON public.mobile_entitlements USING btree (transaction_id);

CREATE INDEX idx_mobile_operations_device ON public.mobile_operations USING btree (device_id);

CREATE INDEX idx_mobile_operations_entitlement ON public.mobile_operations USING btree (entitlement_id);

CREATE INDEX idx_mobile_operations_status ON public.mobile_operations USING btree (status);

CREATE INDEX idx_mobile_wallet_ledger_device ON public.mobile_wallet_ledger USING btree (device_id);

CREATE INDEX idx_mobile_wallet_ledger_wallet ON public.mobile_wallet_ledger USING btree (wallet_id);

CREATE INDEX idx_mobile_wallets_device ON public.mobile_wallets USING btree (device_id);

CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);

CREATE INDEX idx_modules_order ON public.modules USING btree (course_id, order_index);

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (NOT is_read);

CREATE INDEX idx_org_metrics_date ON public.org_metrics_daily USING btree (date DESC);

CREATE INDEX idx_profile_skills_skill ON public.profile_skills USING btree (skill_id);

CREATE INDEX idx_profile_skills_teach ON public.profile_skills USING btree (skill_type, skill_id) WHERE (skill_type = 'teach'::skill_type);

CREATE INDEX idx_profile_skills_type ON public.profile_skills USING btree (skill_type);

CREATE INDEX idx_profile_skills_user ON public.profile_skills USING btree (user_id);

CREATE INDEX idx_program_courses_course ON public.program_courses USING btree (course_id);

CREATE INDEX idx_program_courses_program ON public.program_courses USING btree (program_id);

CREATE INDEX idx_programs_institution ON public.programs USING btree (institution_id);

CREATE INDEX idx_programs_status ON public.programs USING btree (status);

CREATE INDEX idx_programs_visibility ON public.programs USING btree (visibility);

CREATE INDEX idx_quiz_attempts_course ON public.quiz_attempts USING btree (course_id);

CREATE INDEX idx_quiz_attempts_lesson ON public.quiz_attempts USING btree (lesson_id);

CREATE INDEX idx_quiz_attempts_passed ON public.quiz_attempts USING btree (passed);

CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts USING btree (user_id);

CREATE INDEX idx_reports_reported ON public.reports USING btree (reported_user_id);

CREATE INDEX idx_reports_reporter ON public.reports USING btree (reporter_id);

CREATE INDEX idx_reports_status ON public.reports USING btree (status);

CREATE INDEX idx_requests_open ON public.requests USING btree (status, created_at DESC) WHERE (status = 'open'::request_status);

CREATE INDEX idx_requests_skill ON public.requests USING btree (skill_id);

CREATE INDEX idx_requests_status ON public.requests USING btree (status);

CREATE INDEX idx_requests_user ON public.requests USING btree (user_id);

CREATE INDEX idx_reviews_reviewee ON public.reviews USING btree (reviewee_id);

CREATE INDEX idx_reviews_reviewer ON public.reviews USING btree (reviewer_id);

CREATE INDEX idx_reviews_session ON public.reviews USING btree (session_id);

CREATE INDEX idx_sabiquiz_attempts_completed ON public.sabiquiz_attempts USING btree (completed_at);

CREATE INDEX idx_sabiquiz_attempts_material_id ON public.sabiquiz_attempts USING btree (material_id);

CREATE INDEX idx_sabiquiz_attempts_mode ON public.sabiquiz_attempts USING btree (mode);

CREATE INDEX idx_sabiquiz_attempts_subject ON public.sabiquiz_attempts USING btree (category);

CREATE INDEX idx_sabiquiz_attempts_user ON public.sabiquiz_attempts USING btree (user_id);

CREATE INDEX idx_sabiquiz_attempts_user_id ON public.sabiquiz_attempts USING btree (user_id);

CREATE INDEX idx_sabiquiz_mastery_subject ON public.sabiquiz_mastery USING btree (category);

CREATE INDEX idx_sabiquiz_mastery_topic ON public.sabiquiz_mastery USING btree (topic);

CREATE INDEX idx_sabiquiz_mastery_user ON public.sabiquiz_mastery USING btree (user_id);

CREATE INDEX idx_sabiquiz_mastery_user_id ON public.sabiquiz_mastery USING btree (user_id);

CREATE INDEX idx_sabiquiz_materials_status ON public.sabiquiz_materials USING btree (status);

CREATE INDEX idx_sabiquiz_materials_subject ON public.sabiquiz_materials USING btree (category);

CREATE INDEX idx_sabiquiz_materials_user ON public.sabiquiz_materials USING btree (user_id);

CREATE INDEX idx_sabiquiz_questions_difficulty ON public.sabiquiz_questions USING btree (difficulty);

CREATE INDEX idx_sabiquiz_questions_material ON public.sabiquiz_questions USING btree (material_id);

CREATE INDEX idx_sabiquiz_questions_status ON public.sabiquiz_questions USING btree (status);

CREATE INDEX idx_sabiquiz_questions_subject ON public.sabiquiz_questions USING btree (category);

CREATE INDEX idx_sabiquiz_questions_topic ON public.sabiquiz_questions USING btree (topic);

CREATE INDEX idx_sabiquiz_responses_attempt ON public.sabiquiz_responses USING btree (attempt_id);

CREATE INDEX idx_sabiquiz_responses_attempt_id ON public.sabiquiz_responses USING btree (attempt_id);

CREATE INDEX idx_sabiquiz_responses_bookmarked ON public.sabiquiz_responses USING btree (attempt_id, bookmarked) WHERE (bookmarked = true);

CREATE INDEX idx_sabiquiz_responses_question ON public.sabiquiz_responses USING btree (question_id);

CREATE INDEX idx_sabiquiz_responses_user ON public.sabiquiz_responses USING btree (user_id);

CREATE INDEX idx_sabiwrite_files_session ON public.sabiwrite_files USING btree (session_id);

CREATE INDEX idx_sabiwrite_files_user ON public.sabiwrite_files USING btree (user_id);

CREATE INDEX idx_sabiwrite_messages_session ON public.sabiwrite_messages USING btree (session_id);

CREATE INDEX idx_sabiwrite_messages_user ON public.sabiwrite_messages USING btree (user_id);

CREATE INDEX idx_sabiwrite_operations_created ON public.sabiwrite_operations USING btree (created_at DESC);

CREATE INDEX idx_sabiwrite_operations_session ON public.sabiwrite_operations USING btree (session_id);

CREATE INDEX idx_sabiwrite_operations_status ON public.sabiwrite_operations USING btree (status);

CREATE INDEX idx_sabiwrite_operations_user ON public.sabiwrite_operations USING btree (user_id);

CREATE INDEX idx_sabiwrite_output_versions_session ON public.sabiwrite_output_versions USING btree (session_id);

CREATE INDEX idx_sabiwrite_sessions_status ON public.sabiwrite_sessions USING btree (status);

CREATE INDEX idx_sabiwrite_sessions_updated ON public.sabiwrite_sessions USING btree (updated_at DESC);

CREATE INDEX idx_sabiwrite_sessions_user ON public.sabiwrite_sessions USING btree (user_id);

CREATE INDEX idx_sabiwrite_usage_user_date ON public.sabiwrite_usage USING btree (user_id, date);

CREATE INDEX idx_session_requests_learner ON public.session_requests USING btree (learner_id);

CREATE INDEX idx_session_requests_mentor ON public.session_requests USING btree (mentor_id);

CREATE INDEX idx_session_requests_status ON public.session_requests USING btree (status);

CREATE INDEX idx_sessions_learner ON public.sessions USING btree (learner_id);

CREATE INDEX idx_sessions_mentor ON public.sessions USING btree (mentor_id);

CREATE INDEX idx_sessions_scheduled ON public.sessions USING btree (scheduled_start);

CREATE INDEX idx_sessions_status ON public.sessions USING btree (status);

CREATE INDEX idx_skills_active ON public.skills USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_skills_category ON public.skills USING btree (category);

CREATE INDEX idx_study_streaks_user ON public.study_streaks USING btree (user_id);

CREATE INDEX idx_study_streaks_user_id ON public.study_streaks USING btree (user_id);

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE INDEX idx_thread_participants_user ON public.thread_participants USING btree (user_id);

CREATE INDEX idx_threads_session ON public.threads USING btree (session_id);

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE INDEX idx_user_badges_user_id ON public.user_badges USING btree (user_id);

CREATE INDEX idx_user_xp_user_id ON public.user_xp USING btree (user_id);

CREATE INDEX idx_users_is_super_admin ON public.users USING btree (is_super_admin);

CREATE INDEX idx_users_last_seen_at ON public.users USING btree (last_seen_at);

CREATE INDEX idx_users_platform_role ON public.users USING btree (platform_role);

CREATE INDEX idx_users_preferred_language ON public.users USING btree (preferred_language);

CREATE INDEX idx_users_status ON public.users USING btree (status);

CREATE INDEX idx_wallet_accounts_user ON public.wallet_accounts USING btree (user_id);

CREATE INDEX idx_wallet_ledger_created ON public.wallet_ledger USING btree (created_at DESC);

CREATE INDEX idx_wallet_ledger_service ON public.wallet_ledger USING btree (service);

CREATE INDEX idx_wallet_ledger_user ON public.wallet_ledger USING btree (user_id);

CREATE INDEX idx_wallet_ledger_user_service ON public.wallet_ledger USING btree (user_id, service);

CREATE INDEX idx_wallet_ledger_wallet ON public.wallet_ledger USING btree (wallet_id);

CREATE INDEX idx_wallet_transactions_reference ON public.wallet_transactions USING btree (reference);

CREATE INDEX idx_wallet_transactions_service ON public.wallet_transactions USING btree (service);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);

CREATE INDEX idx_xp_history_created_at ON public.xp_history USING btree (created_at DESC);

CREATE INDEX idx_xp_history_user_id ON public.xp_history USING btree (user_id);

CREATE INDEX lesson_questions_course_pending_idx ON public.lesson_questions USING btree (course_id) WHERE (answered_at IS NULL);

CREATE INDEX lesson_questions_lesson_idx ON public.lesson_questions USING btree (lesson_id, created_at DESC);

CREATE INDEX notifications_user_idx ON public.notifications USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX waitlist_signups_email_unique ON public.waitlist_signups USING btree (lower(email));

CREATE INDEX xp_events_user_week_idx ON public.xp_events USING btree (user_id, created_at);

CREATE INDEX xp_events_week_idx ON public.xp_events USING btree (created_at);

CREATE OR REPLACE FUNCTION public.add_milestone(p_user_id uuid, p_milestone_type text, p_milestone_name text, p_milestone_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_milestone_id UUID;
BEGIN
  INSERT INTO learning_milestones (
    user_id,
    milestone_type,
    milestone_name,
    milestone_description,
    metadata
  ) VALUES (
    p_user_id,
    p_milestone_type,
    p_milestone_name,
    p_milestone_description,
    p_metadata
  )
  RETURNING id INTO v_milestone_id;
  
  RETURN v_milestone_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_generate_certificate(p_user_id uuid, p_course_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_certificate_id UUID;
  v_certificate_number TEXT;
  v_average_grade INTEGER;
  v_completion_check RECORD;
BEGIN
  SELECT * INTO v_completion_check
  FROM check_course_completion(p_user_id, p_course_id);

  IF NOT v_completion_check.is_complete OR v_completion_check.certificate_exists THEN
    RETURN NULL;
  END IF;

  v_certificate_number := generate_certificate_number();
  v_average_grade := v_completion_check.average_grade;

  INSERT INTO certificates (
    user_id,
    course_id,
    certificate_number,
    completion_date,
    grade_percentage,
    issued_at
  ) VALUES (
    p_user_id,
    p_course_id,
    v_certificate_number,
    NOW(),
    v_average_grade,
    NOW()
  )
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_complete_lesson(p_lesson_id uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT public.is_lesson_unlocked(p_lesson_id, p_user)
  AND (
    EXISTS (
      SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = p_lesson_id AND c.instructor_id = p_user
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true)
    OR NOT EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.lesson_id = p_lesson_id
        AND jsonb_typeof(q.questions) = 'array'
        AND jsonb_array_length(q.questions) > 0
    )
    OR EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa.user_id = p_user AND qa.lesson_id = p_lesson_id AND qa.passed = true
    )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_cohort(p_user_id uuid, p_cohort_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    JOIN cohorts c ON c.program_id = p.id
    WHERE im.user_id = p_user_id
    AND c.id = p_cohort_id
    AND im.status = 'active'
    AND im.role IN ('institution_admin', 'program_manager', 'facilitator')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_lesson_quiz(p_lesson uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = p_lesson AND c.instructor_id = p_user
)
OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true);
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_program(p_user_id uuid, p_program_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    WHERE im.user_id = p_user_id
    AND p.id = p_program_id
    AND im.status = 'active'
    AND im.role IN ('institution_admin', 'program_manager')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_read_course(p_course uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM courses co
  WHERE co.id = p_course
    AND (
      (co.status = 'published' AND co.institution_id IS NULL)
      OR co.instructor_id = p_user
      OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true)
      OR (
        co.status = 'published'
        AND co.institution_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM institution_members im
            WHERE im.institution_id = co.institution_id
              AND im.user_id = p_user
              AND im.status = 'active'
          )
          OR EXISTS (
            SELECT 1
            FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            JOIN program_courses pc ON pc.program_id = c.program_id
            WHERE pc.course_id = co.id
              AND cm.user_id = p_user
              AND cm.status = 'active'
          )
        )
      )
    )
);
$function$
;

CREATE OR REPLACE FUNCTION public.can_self_enroll(p_course uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (
      select 1 from courses c
      where c.id = p_course
        and (coalesce(c.is_free, false) or coalesce(c.price, 0) = 0)
    )
    or exists (
      select 1 from course_purchases cp
      where cp.course_id = p_course
        and cp.user_id = (select auth.uid())
        and cp.status = 'successful'
    )
    or exists (
      select 1
      from cohort_members cm
      join cohorts co on co.id = cm.cohort_id
      join program_courses pc on pc.program_id = co.program_id
      where cm.user_id = (select auth.uid())
        and cm.status in ('active', 'completed')
        and co.status = 'active'
        and pc.course_id = p_course
    );
$function$
;

CREATE OR REPLACE FUNCTION public.check_course_completion(p_user_id uuid, p_course_id uuid)
 RETURNS TABLE(is_complete boolean, lessons_completed integer, lessons_total integer, quizzes_passed integer, quizzes_total integer, average_grade integer, certificate_exists boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_lessons_total INTEGER;
  v_lessons_completed INTEGER;
  v_quizzes_total INTEGER;
  v_quizzes_passed INTEGER;
  v_average_grade INTEGER;
  v_certificate_exists BOOLEAN;
  v_pass_percentage INTEGER := 70;
BEGIN
  SELECT COUNT(*) INTO v_lessons_total
  FROM lessons
  WHERE course_id = p_course_id;

  SELECT COUNT(DISTINCT lesson_id) INTO v_lessons_completed
  FROM lesson_progress
  WHERE user_id = p_user_id AND course_id = p_course_id;

  v_quizzes_total := v_lessons_total;

  SELECT COUNT(DISTINCT lesson_id) INTO v_quizzes_passed
  FROM (
    SELECT DISTINCT ON (lesson_id) 
      lesson_id, 
      passed, 
      score_percentage
    FROM quiz_attempts
    WHERE user_id = p_user_id AND course_id = p_course_id
    ORDER BY lesson_id, score_percentage DESC
  ) AS best_attempts
  WHERE passed = true;

  SELECT COALESCE(AVG(score_percentage)::INTEGER, 0) INTO v_average_grade
  FROM (
    SELECT DISTINCT ON (lesson_id) 
      score_percentage
    FROM quiz_attempts
    WHERE user_id = p_user_id AND course_id = p_course_id
    ORDER BY lesson_id, score_percentage DESC
  ) AS best_attempts;

  SELECT EXISTS(
    SELECT 1 FROM certificates 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_certificate_exists;

  RETURN QUERY SELECT
    (v_lessons_completed = v_lessons_total AND 
     v_quizzes_passed = v_quizzes_total AND
     v_average_grade >= v_pass_percentage) AS is_complete,
    v_lessons_completed,
    v_lessons_total,
    v_quizzes_passed,
    v_quizzes_total,
    v_average_grade,
    v_certificate_exists;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cohort_invites_auto_exhaust()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If max_uses is set and use_count hits it, mark EXHAUSTED
  IF NEW.max_uses IS NOT NULL AND NEW.use_count >= NEW.max_uses THEN
    NEW.status := 'EXHAUSTED';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_signup_gate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_public_open boolean;
  v_token text;
begin
  -- Created by the server with the service role.
  if new.raw_app_meta_data->>'provisioned_by' = 'server' then
    return new;
  end if;

  -- Public sign-up switched on by a platform admin.
  select (ps.value = 'true'::jsonb)
    into v_public_open
    from platform_settings ps
   where ps.key = 'public_signup_enabled';

  if coalesce(v_public_open, false) then
    return new;
  end if;

  -- A valid invite.
  v_token := nullif(new.raw_user_meta_data->>'invite_token', '');

  if v_token is not null and (
       exists (
         select 1
         from cohort_invites ci
         where ci.token = v_token
           and ci.status::text = 'ACTIVE'
           and (ci.expires_at is null or ci.expires_at > now())
           and (ci.max_uses is null or ci.use_count < ci.max_uses)
       )
       or exists (
         select 1
         from institution_invites ii
         where ii.token = v_token
           and ii.status::text = 'ACTIVE'
           and (ii.expires_at is null or ii.expires_at > now())
           and (ii.max_uses is null or ii.use_count < ii.max_uses)
       )
     ) then
    -- Checked; do not keep the token in the account's metadata.
    new.raw_user_meta_data := new.raw_user_meta_data - 'invite_token';
    return new;
  end if;

  raise exception 'Sign up is by invite only'
    using errcode = 'P0001',
          hint = 'Use a valid invite link, or ask a platform admin to enable public sign-up.';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  cert_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    cert_number := 'CERT-' || 
                   TO_CHAR(NOW(), 'YYYY') || '-' || 
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    SELECT EXISTS(SELECT 1 FROM certificates WHERE certificate_number = cert_number) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN cert_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_certificate_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_avg_quiz_score NUMERIC;
  v_course_title TEXT;
  v_course_abbrev TEXT;
  v_certificate_number TEXT;
  v_existing_cert_id UUID;
BEGIN
  -- Only proceed if this is a completion (not just a progress update)
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if certificate already exists for this user and course
  SELECT id INTO v_existing_cert_id
  FROM certificates
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id;
  
  IF v_existing_cert_id IS NOT NULL THEN
    -- Certificate already exists, skip
    RETURN NEW;
  END IF;

  -- Count total lessons in the course
  SELECT COUNT(*) INTO v_total_lessons
  FROM lessons
  WHERE course_id = NEW.course_id;

  -- Count completed lessons for this user
  SELECT COUNT(*) INTO v_completed_lessons
  FROM user_progress
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id
    AND completed_at IS NOT NULL;

  -- Check if all lessons are completed
  IF v_completed_lessons < v_total_lessons THEN
    -- Not all lessons completed yet
    RETURN NEW;
  END IF;

  -- Calculate average quiz score (only passed attempts)
  SELECT AVG(score_percentage) INTO v_avg_quiz_score
  FROM quiz_attempts
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id
    AND passed = true;

  -- Check if average score meets minimum threshold
  IF v_avg_quiz_score IS NULL OR v_avg_quiz_score < 70 THEN
    -- No quiz attempts or score below 70%
    RETURN NEW;
  END IF;

  -- Get course title for certificate number
  SELECT title INTO v_course_title
  FROM courses
  WHERE id = NEW.course_id;

  -- Generate course abbreviation (first letter of each word, max 5 chars)
  v_course_abbrev := UPPER(LEFT(
    regexp_replace(
      regexp_replace(v_course_title, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '', 'g'
    ), 5
  ));

  -- Generate certificate number
  v_certificate_number := 'SABITEK-' || v_course_abbrev || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  -- Insert certificate
  INSERT INTO certificates (
    user_id,
    course_id,
    certificate_number,
    grade_percentage,
    issued_at
  ) VALUES (
    NEW.user_id,
    NEW.course_id,
    v_certificate_number,
    ROUND(v_avg_quiz_score),
    NOW()
  );

  -- Update enrollment as completed
  UPDATE course_enrollments
  SET 
    progress_percentage = 100,
    completed_at = NOW()
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id;

  RAISE NOTICE 'Certificate % generated for user % in course %', v_certificate_number, NEW.user_id, NEW.course_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug(name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_profiles(p_ids uuid[])
 RETURNS TABLE(id uuid, full_name text, avatar_url text, profile_image_url text, bio text, role text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    u.id,
    u.full_name::text,
    u.avatar_url,
    u.profile_image_url,
    u.bio,
    u.role::text
  from users u
  where u.id = any (p_ids[1:200]);
$function$
;

CREATE OR REPLACE FUNCTION public.get_thread_unread_count(p_thread_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  count INTEGER;
  last_read TIMESTAMPTZ;
BEGIN
  SELECT last_read_at INTO last_read
  FROM thread_participants
  WHERE thread_id = p_thread_id AND user_id = p_user_id;
  
  IF last_read IS NULL THEN
    SELECT COUNT(*)::INTEGER INTO count
    FROM messages
    WHERE thread_id = p_thread_id AND sender_id != p_user_id;
  ELSE
    SELECT COUNT(*)::INTEGER INTO count
    FROM messages
    WHERE thread_id = p_thread_id 
      AND sender_id != p_user_id 
      AND created_at > last_read;
  END IF;
  
  RETURN count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM messages m
  JOIN thread_participants tp ON tp.thread_id = m.thread_id
  WHERE tp.user_id = p_user_id
    AND m.sender_id != p_user_id
    AND (tp.last_read_at IS NULL OR m.created_at > tp.last_read_at);
  RETURN count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    bio,
    profile_image_url,
    avatar_url,
    phone,
    is_super_admin,
    status,
    preferred_language,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' = 'instructor' then 'instructor'::public.user_role
      else 'learner'::public.user_role
    end,
    null,
    null,
    null,
    null,
    false,
    'active'::public.user_status,
    'english',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_institution_role(p_institution uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from institution_members m
    where m.institution_id = p_institution
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role::text = any (p_roles)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.inst_apps_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.instructor_can_view_user(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (
      select 1
      from course_enrollments ce
      join courses c on c.id = ce.course_id
      where ce.user_id = p_user
        and c.instructor_id = (select auth.uid())
    )
    or exists (
      select 1
      from quiz_attempts qa
      join courses c on c.id = qa.course_id
      where qa.user_id = p_user
        and c.instructor_id = (select auth.uid())
    );
$function$
;

CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks 
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_cohort_member(p_user_id uuid, p_cohort_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cohort_members
    WHERE user_id = p_user_id
    AND cohort_id = p_cohort_id
    AND status IN ('active', 'completed')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_institution_admin(p_institution_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members
    WHERE institution_id = p_institution_id
    AND user_id = p_user_id
    AND role = 'institution_admin'
    AND status = 'active'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_lesson_unlocked(p_lesson_id uuid, p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH target AS (
  SELECT l.id, l.course_id,
         COALESCE(m.order_index, 2147483647) AS m_ord,
         l.lesson_order
  FROM lessons l
  LEFT JOIN modules m ON m.id = l.module_id
  WHERE l.id = p_lesson_id
),
prior AS (
  SELECT l.id
  FROM lessons l
  LEFT JOIN modules m ON m.id = l.module_id
  CROSS JOIN target t
  WHERE l.course_id = t.course_id
    AND (COALESCE(m.order_index, 2147483647), l.lesson_order, l.id)
      < (t.m_ord, t.lesson_order, t.id)
)
SELECT
  EXISTS (
    SELECT 1 FROM courses c JOIN target t ON c.id = t.course_id
    WHERE c.instructor_id = p_user
  )
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true
  )
  OR NOT EXISTS (
    SELECT 1 FROM prior p
    WHERE
      NOT EXISTS (
        SELECT 1 FROM user_progress up
        WHERE up.user_id = p_user
          AND up.lesson_id = p.id
          AND up.completed_at IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.lesson_id = p.id
          AND jsonb_typeof(q.questions) = 'array'
          AND jsonb_array_length(q.questions) > 0
          AND NOT EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.user_id = p_user
              AND qa.lesson_id = p.id
              AND qa.passed = true
          )
      )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND (is_super_admin = true OR platform_role IS NOT NULL)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_program_member(p_user_id uuid, p_program_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institution_members im
    JOIN programs p ON p.institution_id = im.institution_id
    WHERE im.user_id = p_user_id
    AND p.id = p_program_id
    AND im.status = 'active'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.platform_settings_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_certificate_generation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_certificate_id UUID;
BEGIN
  IF NEW.passed = true THEN
    v_certificate_id := auto_generate_certificate(NEW.user_id, NEW.course_id);
    
    IF v_certificate_id IS NOT NULL THEN
      RAISE NOTICE 'Certificate generated: %', v_certificate_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_community_profile_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_study_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := CURRENT_DATE;
  v_row public.study_streaks%ROWTYPE;
  v_gap integer;
  v_new_streak integer;
BEGIN
  SELECT * INTO v_row FROM public.study_streaks WHERE user_id = p_user_id;

  -- First ever study action
  IF NOT FOUND THEN
    INSERT INTO public.study_streaks
      (user_id, current_streak, longest_streak, last_study_date, total_study_days, freezes_available)
    VALUES (p_user_id, 1, 1, v_today, 1, 1);
    RETURN;
  END IF;

  -- Weekly freeze replenish (max 1 banked)
  IF v_row.freezes_available = 0
     AND (v_row.freeze_last_replenished IS NULL
          OR v_row.freeze_last_replenished <= v_today - 7) THEN
    v_row.freezes_available := 1;
    v_row.freeze_last_replenished := v_today;
  END IF;

  -- Already counted today: persist any replenish and stop
  IF v_row.last_study_date = v_today THEN
    UPDATE public.study_streaks
    SET freezes_available = v_row.freezes_available,
        freeze_last_replenished = v_row.freeze_last_replenished,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  v_gap := v_today - COALESCE(v_row.last_study_date, v_today - 999);

  IF v_gap = 1 THEN
    -- Perfect continuation
    v_new_streak := v_row.current_streak + 1;
  ELSIF v_gap = 2 AND v_row.freezes_available > 0 AND v_row.current_streak >= 3 THEN
    -- Missed exactly one day with a real streak: consume the freeze
    v_new_streak := v_row.current_streak + 1;
    v_row.freezes_available := v_row.freezes_available - 1;
    v_row.last_freeze_used_on := v_today - 1;
  ELSE
    -- Streak broken (or brand-new cadence)
    v_new_streak := 1;
  END IF;

  UPDATE public.study_streaks
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_study_date = v_today,
      total_study_days = total_study_days + 1,
      freezes_available = v_row.freezes_available,
      freeze_last_replenished = v_row.freeze_last_replenished,
      last_freeze_used_on = v_row.last_freeze_used_on,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view public.wallet_summary as
 SELECT user_id,
    service,
    sum(
        CASE
            WHEN (transaction_type = 'debit'::text) THEN amount_kobo
            ELSE 0
        END) AS total_spent_kobo,
    sum(
        CASE
            WHEN (transaction_type = ANY (ARRAY['credit'::text, 'bonus'::text, 'refund'::text])) THEN amount_kobo
            ELSE 0
        END) AS total_credited_kobo,
    count(*) AS transaction_count
   FROM wallet_ledger
  GROUP BY user_id, service;

CREATE TRIGGER cohort_invites_exhaust_check BEFORE UPDATE OF use_count ON public.cohort_invites FOR EACH ROW WHEN ((new.status = 'ACTIVE'::cohort_invite_status)) EXECUTE FUNCTION cohort_invites_auto_exhaust();

CREATE TRIGGER update_cohort_members_updated_at BEFORE UPDATE ON public.cohort_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_community_offers_updated_at BEFORE UPDATE ON public.community_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER community_profiles_updated_at BEFORE UPDATE ON public.community_profiles FOR EACH ROW EXECUTE FUNCTION update_community_profile_timestamp();

CREATE TRIGGER trg_inst_apps_updated_at BEFORE UPDATE ON public.institution_applications FOR EACH ROW EXECUTE FUNCTION inst_apps_touch_updated_at();

CREATE TRIGGER update_institution_members_updated_at BEFORE UPDATE ON public.institution_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_profiles_updated_at BEFORE UPDATE ON public.instructor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_mentor_profiles_updated_at BEFORE UPDATE ON public.mentor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_thread_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION update_thread_on_message();

CREATE TRIGGER set_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION platform_settings_touch_updated_at();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION update_community_profile_timestamp();

CREATE TRIGGER trigger_session_requests_updated_at BEFORE UPDATE ON public.session_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_signup_gate BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION enforce_signup_gate();

alter table public.advisor_ai_cache enable row level security;

alter table public.advisor_operations enable row level security;

alter table public.advisor_pricing enable row level security;

alter table public.ai_usage enable row level security;

alter table public.audit_logs enable row level security;

alter table public.availability_slots enable row level security;

alter table public.blocks enable row level security;

alter table public.career_profiles enable row level security;

alter table public.career_results enable row level security;

alter table public.career_surveys enable row level security;

alter table public.categories enable row level security;

alter table public.certificates enable row level security;

alter table public.chat_history enable row level security;

alter table public.cohort_invites enable row level security;

alter table public.cohort_members enable row level security;

alter table public.cohorts enable row level security;

alter table public.community_offers enable row level security;

alter table public.community_profiles enable row level security;

alter table public.conversation_insights enable row level security;

alter table public.course_discussions enable row level security;

alter table public.course_enrollments enable row level security;

alter table public.course_purchases enable row level security;

alter table public.courses enable row level security;

alter table public.cover_letter_documents enable row level security;

alter table public.cover_letters enable row level security;

alter table public.cv_documents enable row level security;

alter table public.enrollments enable row level security;

alter table public.entitlements enable row level security;

alter table public.generation_runs enable row level security;

alter table public.institution_applications enable row level security;

alter table public.institution_invites enable row level security;

alter table public.institution_members enable row level security;

alter table public.institutions enable row level security;

alter table public.instructor_profiles enable row level security;

alter table public.interview_answers enable row level security;

alter table public.interview_kits enable row level security;

alter table public.interview_sessions enable row level security;

alter table public.learning_milestones enable row level security;

alter table public.lesson_ai_artifacts enable row level security;

alter table public.lesson_notes enable row level security;

alter table public.lesson_progress enable row level security;

alter table public.lesson_questions enable row level security;

alter table public.lessons enable row level security;

alter table public.material_chunks enable row level security;

alter table public.mentor_profiles enable row level security;

alter table public.messages enable row level security;

alter table public.mobile_entitlements enable row level security;

alter table public.mobile_operations enable row level security;

alter table public.mobile_wallet_ledger enable row level security;

alter table public.mobile_wallets enable row level security;

alter table public.modules enable row level security;

alter table public.notifications enable row level security;

alter table public.org_metrics_daily enable row level security;

alter table public.plans enable row level security;

alter table public.platform_settings enable row level security;

alter table public.profile_skills enable row level security;

alter table public.program_courses enable row level security;

alter table public.programs enable row level security;

alter table public.qa_cache enable row level security;

alter table public.quiz_attempts enable row level security;

alter table public.quiz_questions enable row level security;

alter table public.quizzes enable row level security;

alter table public.reports enable row level security;

alter table public.requests enable row level security;

alter table public.reviews enable row level security;

alter table public.sabiquiz_attempts enable row level security;

alter table public.sabiquiz_draft_responses enable row level security;

alter table public.sabiquiz_mastery enable row level security;

alter table public.sabiquiz_materials enable row level security;

alter table public.sabiquiz_questions enable row level security;

alter table public.sabiquiz_responses enable row level security;

alter table public.sabiwrite_files enable row level security;

alter table public.sabiwrite_messages enable row level security;

alter table public.sabiwrite_operations enable row level security;

alter table public.sabiwrite_output_versions enable row level security;

alter table public.sabiwrite_pricing_rules enable row level security;

alter table public.sabiwrite_refunds enable row level security;

alter table public.sabiwrite_sessions enable row level security;

alter table public.sabiwrite_usage enable row level security;

alter table public.session_requests enable row level security;

alter table public.sessions enable row level security;

alter table public.skills enable row level security;

alter table public.study_streaks enable row level security;

alter table public.subscriptions enable row level security;

alter table public.thread_participants enable row level security;

alter table public.threads enable row level security;

alter table public.transactions enable row level security;

alter table public.user_badges enable row level security;

alter table public.user_learning_context enable row level security;

alter table public.user_progress enable row level security;

alter table public.user_xp enable row level security;

alter table public.users enable row level security;

alter table public.waitlist_signups enable row level security;

alter table public.wallet_accounts enable row level security;

alter table public.wallet_ledger enable row level security;

alter table public.wallet_transactions enable row level security;

alter table public.xp_events enable row level security;

alter table public.xp_history enable row level security;

create policy "Service role full access advisor_ai_cache" on public.advisor_ai_cache as permissive for all to service_role
  using (true)
  with check (true);

create policy "Service role full access advisor_operations" on public.advisor_operations as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users view own advisor_operations" on public.advisor_operations as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy "Anyone can view pricing" on public.advisor_pricing as permissive for select to public
  using (true);

create policy "Service role manages pricing" on public.advisor_pricing as permissive for all to service_role
  using (true)
  with check (true);

create policy "Super admins can read audit logs" on public.audit_logs as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Availability is viewable by authenticated users" on public.availability_slots as permissive for select to authenticated
  using (((is_active = true) OR (user_id = auth.uid())));

create policy "Users can delete own availability" on public.availability_slots as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy "Users can insert own availability" on public.availability_slots as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy "Users can update own availability" on public.availability_slots as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Users can create blocks" on public.blocks as permissive for insert to public
  with check ((auth.uid() = blocker_id));

create policy "Users can delete own blocks" on public.blocks as permissive for delete to public
  using ((auth.uid() = blocker_id));

create policy "Users can view own blocks" on public.blocks as permissive for select to public
  using ((auth.uid() = blocker_id));

create policy "Service role full access career_profiles" on public.career_profiles as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own career_profiles" on public.career_profiles as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Users can create own results" on public.career_results as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can view own results" on public.career_results as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users can create own surveys" on public.career_surveys as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can view own surveys" on public.career_surveys as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Enable read access for all users" on public.categories as permissive for select to public
  using (true);

create policy "Instructors can view certificates for their courses" on public.certificates as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = certificates.course_id) AND (courses.instructor_id = auth.uid())))));

create policy "Super admins can manage all certificates" on public.certificates as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Users can read own certificates" on public.certificates as permissive for select to public
  using ((user_id = auth.uid()));

create policy "Users can insert own chat history" on public.chat_history as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can view own chat history" on public.chat_history as permissive for select to public
  using ((auth.uid() = user_id));

create policy cohort_invites_all_platform_admin on public.cohort_invites as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND ((u.is_super_admin = true) OR (u.platform_role IS NOT NULL))))))
  with check ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND ((u.is_super_admin = true) OR (u.platform_role IS NOT NULL))))));

create policy cohort_invites_insert_staff on public.cohort_invites as permissive for insert to public
  with check (((created_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM ((cohorts c
     JOIN programs p ON ((p.id = c.program_id)))
     JOIN institution_members im ON ((im.institution_id = p.institution_id)))
  WHERE ((c.id = cohort_invites.cohort_id) AND (im.user_id = auth.uid()) AND (im.status = 'active'::institution_member_status) AND (im.role = ANY (ARRAY['institution_admin'::institution_role, 'program_manager'::institution_role])))))));

create policy cohort_invites_select_platform_admin on public.cohort_invites as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND ((u.is_super_admin = true) OR (u.platform_role IS NOT NULL))))));

create policy cohort_invites_select_staff on public.cohort_invites as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM ((cohorts c
     JOIN programs p ON ((p.id = c.program_id)))
     JOIN institution_members im ON ((im.institution_id = p.institution_id)))
  WHERE ((c.id = cohort_invites.cohort_id) AND (im.user_id = auth.uid()) AND (im.status = 'active'::institution_member_status) AND (im.role = ANY (ARRAY['institution_admin'::institution_role, 'program_manager'::institution_role, 'facilitator'::institution_role]))))));

create policy cohort_invites_update_staff on public.cohort_invites as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM ((cohorts c
     JOIN programs p ON ((p.id = c.program_id)))
     JOIN institution_members im ON ((im.institution_id = p.institution_id)))
  WHERE ((c.id = cohort_invites.cohort_id) AND (im.user_id = auth.uid()) AND (im.status = 'active'::institution_member_status) AND (im.role = ANY (ARRAY['institution_admin'::institution_role, 'program_manager'::institution_role]))))));

create policy "Cohort managers can add members" on public.cohort_members as permissive for insert to authenticated
  with check (can_manage_cohort(auth.uid(), cohort_id));

create policy "Cohort managers can remove members" on public.cohort_members as permissive for delete to authenticated
  using (can_manage_cohort(auth.uid(), cohort_id));

create policy "Cohort managers can update members" on public.cohort_members as permissive for update to authenticated
  using (can_manage_cohort(auth.uid(), cohort_id));

create policy "Cohort managers can view members" on public.cohort_members as permissive for select to authenticated
  using (can_manage_cohort(auth.uid(), cohort_id));

create policy "Platform admins full access to cohort_members" on public.cohort_members as permissive for all to authenticated
  using (is_platform_admin(auth.uid()));

create policy "Users can update own membership (limited)" on public.cohort_members as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Users can view own membership" on public.cohort_members as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy "Cohort managers can update cohorts" on public.cohorts as permissive for update to authenticated
  using (can_manage_cohort(auth.uid(), id));

create policy "Platform admins full access to cohorts" on public.cohorts as permissive for all to authenticated
  using (is_platform_admin(auth.uid()));

create policy "Program managers can create cohorts" on public.cohorts as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM programs p
  WHERE ((p.id = cohorts.program_id) AND can_manage_program(auth.uid(), p.id)))));

create policy "Program managers can delete cohorts" on public.cohorts as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM programs p
  WHERE ((p.id = cohorts.program_id) AND can_manage_program(auth.uid(), p.id)))));

create policy "Program members can view cohorts" on public.cohorts as permissive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM programs p
  WHERE ((p.id = cohorts.program_id) AND is_program_member(auth.uid(), p.id)))) OR is_cohort_member(auth.uid(), id)));

create policy "Mentors can create offers" on public.community_offers as permissive for insert to public
  with check (((auth.uid() = mentor_id) AND (EXISTS ( SELECT 1
   FROM requests r
  WHERE ((r.id = community_offers.request_id) AND (r.status = 'open'::request_status) AND (r.user_id <> auth.uid()))))));

create policy "Mentors can view own offers" on public.community_offers as permissive for select to public
  using ((auth.uid() = mentor_id));

create policy "Mentors can withdraw own offers" on public.community_offers as permissive for update to public
  using (((auth.uid() = mentor_id) AND (status = 'pending'::text)));

create policy "Request owners can update offer status" on public.community_offers as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM requests r
  WHERE ((r.id = community_offers.request_id) AND (r.user_id = auth.uid())))));

create policy "Request owners can view offers" on public.community_offers as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM requests r
  WHERE ((r.id = community_offers.request_id) AND (r.user_id = auth.uid())))));

create policy "Public profiles are viewable by authenticated users" on public.community_profiles as permissive for select to authenticated
  using ((((is_public = true) AND (is_suspended = false)) OR (user_id = auth.uid())));

create policy "Users can create own profile" on public.community_profiles as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy "Users can delete own profile" on public.community_profiles as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy "Users can update own profile" on public.community_profiles as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Users can insert own insights" on public.conversation_insights as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own insights" on public.conversation_insights as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own insights" on public.conversation_insights as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Enrolled learners can create posts" on public.course_discussions as permissive for insert to public
  with check (((( SELECT count(*) AS count
   FROM course_enrollments
  WHERE ((course_enrollments.course_id = course_discussions.course_id) AND (course_enrollments.user_id = auth.uid()))) > 0) AND (auth.uid() = user_id)));

create policy "Enrolled learners can view discussions" on public.course_discussions as permissive for select to public
  using ((( SELECT count(*) AS count
   FROM course_enrollments
  WHERE ((course_enrollments.course_id = course_discussions.course_id) AND (course_enrollments.user_id = auth.uid()))) > 0));

create policy "Users can delete their own posts" on public.course_discussions as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users can update their own posts" on public.course_discussions as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Enable delete for users own enrollments" on public.course_enrollments as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Enable read for users own enrollments" on public.course_enrollments as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Enable update for users own enrollments" on public.course_enrollments as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Instructors can view enrollments for their courses" on public.course_enrollments as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_enrollments.course_id) AND (c.instructor_id = auth.uid())))));

create policy "Users can update their own enrollments" on public.course_enrollments as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can view their own enrollments" on public.course_enrollments as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy course_enrollments_insert_own_entitled on public.course_enrollments as permissive for insert to authenticated
  with check (((( SELECT auth.uid() AS uid) = user_id) AND can_self_enroll(course_id)));

create policy "Service role can manage course purchases" on public.course_purchases as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy "Users can read own course purchases" on public.course_purchases as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Instructors can insert their own courses" on public.courses as permissive for insert to public
  with check ((auth.uid() = instructor_id));

create policy "Instructors can manage own courses" on public.courses as permissive for all to public
  using ((auth.uid() = instructor_id));

create policy courses_select_public_published on public.courses as permissive for select to anon
  using (((status = 'published'::course_status) AND (institution_id IS NULL)));

create policy courses_select_tenancy on public.courses as permissive for select to authenticated
  using (can_read_course(id, auth.uid()));

create policy "Users can delete own cover letters" on public.cover_letter_documents as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users can insert own cover letters" on public.cover_letter_documents as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own cover letters" on public.cover_letter_documents as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own cover letters" on public.cover_letter_documents as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Service role full access cover_letters" on public.cover_letters as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own cover_letters" on public.cover_letters as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Service role full access cv_documents" on public.cv_documents as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own cv_documents" on public.cv_documents as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Instructors can view enrollments in their courses" on public.enrollments as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = enrollments.course_id) AND (courses.instructor_id = auth.uid())))));

create policy "Super admins can manage all enrollments" on public.enrollments as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Users can enroll in courses" on public.enrollments as permissive for insert to public
  with check ((user_id = auth.uid()));

create policy "Users can read own enrollments" on public.enrollments as permissive for select to public
  using ((user_id = auth.uid()));

create policy "Users can update own enrollments" on public.enrollments as permissive for update to public
  using ((user_id = auth.uid()));

create policy "Service role can manage entitlements" on public.entitlements as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy "Users can read own entitlements" on public.entitlements as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users can insert their generation runs" on public.generation_runs as permissive for insert to public
  with check ((user_id = auth.uid()));

create policy "Users can view their generation runs" on public.generation_runs as permissive for select to public
  using ((user_id = auth.uid()));

create policy inst_apps_admin_select on public.institution_applications as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy inst_apps_admin_update on public.institution_applications as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy institution_invites_admin_all on public.institution_invites as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM institution_members im
  WHERE ((im.institution_id = institution_invites.institution_id) AND (im.user_id = auth.uid()) AND (im.status = 'active'::institution_member_status) AND (im.role = 'institution_admin'::institution_role)))))
  with check (((created_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM institution_members im
  WHERE ((im.institution_id = institution_invites.institution_id) AND (im.user_id = auth.uid()) AND (im.status = 'active'::institution_member_status) AND (im.role = 'institution_admin'::institution_role))))));

create policy institution_invites_platform_admin on public.institution_invites as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND ((u.is_super_admin = true) OR (u.platform_role IS NOT NULL))))))
  with check ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND ((u.is_super_admin = true) OR (u.platform_role IS NOT NULL))))));

create policy "Platform admins can view all memberships" on public.institution_members as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy "Users can accept own invitations" on public.institution_members as permissive for update to public
  using (((user_id = auth.uid()) AND (status = 'invited'::institution_member_status)));

create policy "Users can view own memberships" on public.institution_members as permissive for select to public
  using ((user_id = auth.uid()));

create policy institution_members_admin_manage on public.institution_members as permissive for all to authenticated
  using (has_institution_role(institution_id, ARRAY['institution_admin'::text]))
  with check (has_institution_role(institution_id, ARRAY['institution_admin'::text]));

create policy institution_members_staff_select on public.institution_members as permissive for select to authenticated
  using (has_institution_role(institution_id, ARRAY['institution_admin'::text, 'program_manager'::text]));

create policy "Anyone can view approved institutions" on public.institutions as permissive for select to public
  using ((status = 'approved'::institution_status));

create policy "Authenticated users can create institution applications" on public.institutions as permissive for insert to public
  with check ((auth.uid() = created_by));

create policy "Creators can view own pending institution" on public.institutions as permissive for select to public
  using ((created_by = auth.uid()));

create policy "Institution admins can update their institution" on public.institutions as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM institution_members
  WHERE ((institution_members.institution_id = institutions.id) AND (institution_members.user_id = auth.uid()) AND (institution_members.role = 'institution_admin'::institution_role) AND (institution_members.status = 'active'::institution_member_status)))));

create policy "Members can view their institution" on public.institutions as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM institution_members
  WHERE ((institution_members.institution_id = institutions.id) AND (institution_members.user_id = auth.uid()) AND (institution_members.status = 'active'::institution_member_status)))));

create policy "Platform admins can update any institution" on public.institutions as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy "Platform admins can view all institutions" on public.institutions as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy "Anyone can view approved instructor profiles" on public.instructor_profiles as permissive for select to public
  using ((status = 'approved'::instructor_status));

create policy "Platform admins can manage instructor profiles" on public.instructor_profiles as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy "Users can create own instructor profile" on public.instructor_profiles as permissive for insert to public
  with check ((user_id = auth.uid()));

create policy "Users can update own instructor profile" on public.instructor_profiles as permissive for update to public
  using ((user_id = auth.uid()));

create policy "Users can view own instructor profile" on public.instructor_profiles as permissive for select to public
  using ((user_id = auth.uid()));

create policy "Service role full access interview_answers" on public.interview_answers as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own interview_answers" on public.interview_answers as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Service role full access interview_kits" on public.interview_kits as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own interview_kits" on public.interview_kits as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Service role full access interview_sessions" on public.interview_sessions as permissive for all to service_role
  using (true)
  with check (true);

create policy "Users manage own interview_sessions" on public.interview_sessions as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Users can insert own milestones" on public.learning_milestones as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own milestones" on public.learning_milestones as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own milestones" on public.learning_milestones as permissive for select to public
  using ((auth.uid() = user_id));

create policy lesson_artifacts_read on public.lesson_ai_artifacts as permissive for select to authenticated
  using (true);

create policy "Users can create their own notes" on public.lesson_notes as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can delete their own notes" on public.lesson_notes as permissive for delete to authenticated
  using ((auth.uid() = user_id));

create policy "Users can insert their own notes" on public.lesson_notes as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy "Users can update their own notes" on public.lesson_notes as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can view their own notes" on public.lesson_notes as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy "Admins can view all progress" on public.lesson_progress as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Users can insert own progress" on public.lesson_progress as permissive for insert to public
  with check ((user_id = auth.uid()));

create policy "Users can update own progress" on public.lesson_progress as permissive for update to public
  using ((user_id = auth.uid()));

create policy "Users can view own progress" on public.lesson_progress as permissive for select to public
  using ((user_id = auth.uid()));

create policy lesson_questions_ask on public.lesson_questions as permissive for insert to authenticated
  with check (((user_id = auth.uid()) AND ((char_length(question) >= 5) AND (char_length(question) <= 1000)) AND (answer IS NULL)));

create policy lesson_questions_select on public.lesson_questions as permissive for select to authenticated
  using (((user_id = auth.uid()) OR (answered_at IS NOT NULL)));

create policy "Instructors can manage lessons in their modules" on public.lessons as permissive for all to public
  using (((module_id IS NULL) OR (EXISTS ( SELECT 1
   FROM (modules m
     JOIN courses c ON ((c.id = m.course_id)))
  WHERE ((m.id = lessons.module_id) AND (c.instructor_id = auth.uid()))))));

create policy "Instructors can manage own lessons" on public.lessons as permissive for all to public
  using ((auth.uid() = instructor_id))
  with check ((auth.uid() = instructor_id));

create policy lessons_select_tenancy on public.lessons as permissive for select to authenticated
  using (can_read_course(course_id, auth.uid()));

create policy "Users can delete chunks of their materials" on public.material_chunks as permissive for delete to public
  using ((material_id IN ( SELECT sabiquiz_materials.id
   FROM sabiquiz_materials
  WHERE (sabiquiz_materials.user_id = auth.uid()))));

create policy "Users can insert chunks for their materials" on public.material_chunks as permissive for insert to public
  with check ((material_id IN ( SELECT sabiquiz_materials.id
   FROM sabiquiz_materials
  WHERE (sabiquiz_materials.user_id = auth.uid()))));

create policy "Users can view chunks of their materials" on public.material_chunks as permissive for select to public
  using ((material_id IN ( SELECT sabiquiz_materials.id
   FROM sabiquiz_materials
  WHERE (sabiquiz_materials.user_id = auth.uid()))));

create policy "Anyone can view mentor profiles" on public.mentor_profiles as permissive for select to public
  using (true);

create policy "Users can create own mentor profile" on public.mentor_profiles as permissive for insert to public
  with check ((auth.uid() = id));

create policy "Users can update own mentor profile" on public.mentor_profiles as permissive for update to public
  using ((auth.uid() = id));

create policy "Participants can send messages" on public.messages as permissive for insert to public
  with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM thread_participants tp
  WHERE ((tp.thread_id = messages.thread_id) AND (tp.user_id = auth.uid()))))));

create policy "Participants can view messages" on public.messages as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM thread_participants tp
  WHERE ((tp.thread_id = messages.thread_id) AND (tp.user_id = auth.uid())))));

create policy "Senders can edit own messages" on public.messages as permissive for update to public
  using (((auth.uid() = sender_id) AND (NOT is_deleted)));

create policy service_role_entitlements on public.mobile_entitlements as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy service_role_operations on public.mobile_operations as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy service_role_mobile_wallet_ledger on public.mobile_wallet_ledger as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy service_role_mobile_wallets on public.mobile_wallets as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy delete_own_course_modules on public.modules as permissive for delete to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.instructor_id = auth.uid())))));

create policy insert_own_course_modules on public.modules as permissive for insert to public
  with check ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.instructor_id = auth.uid())))));

create policy select_own_course_modules on public.modules as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.instructor_id = auth.uid())))));

create policy select_published_course_modules on public.modules as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.status = 'published'::course_status)))));

create policy update_own_course_modules on public.modules as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.instructor_id = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.instructor_id = auth.uid())))));

create policy "Users can update own notifications" on public.notifications as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own notifications" on public.notifications as permissive for select to public
  using ((auth.uid() = user_id));

create policy notifications_mark_read_own on public.notifications as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy notifications_select_own on public.notifications as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy "Super admins can read org metrics" on public.org_metrics_daily as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Anyone can read active plans" on public.plans as permissive for select to public
  using ((status = 'active'::text));

create policy platform_settings_super_admin_select on public.platform_settings as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy platform_settings_super_admin_write on public.platform_settings as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))))
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Profile skills are viewable by authenticated users" on public.profile_skills as permissive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM community_profiles cp
  WHERE ((cp.user_id = profile_skills.user_id) AND ((cp.is_public = true) OR (cp.user_id = auth.uid())) AND (cp.is_suspended = false)))) OR (user_id = auth.uid())));

create policy "Users can delete own skills" on public.profile_skills as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy "Users can insert own skills" on public.profile_skills as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy "Users can update own skills" on public.profile_skills as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Platform admins full access to program_courses" on public.program_courses as permissive for all to authenticated
  using (is_platform_admin(auth.uid()));

create policy "Program managers can delete program_courses" on public.program_courses as permissive for delete to authenticated
  using (can_manage_program(auth.uid(), program_id));

create policy "Program managers can manage program_courses" on public.program_courses as permissive for insert to authenticated
  with check (can_manage_program(auth.uid(), program_id));

create policy "Program managers can update program_courses" on public.program_courses as permissive for update to authenticated
  using (can_manage_program(auth.uid(), program_id));

create policy "Program members can view program_courses" on public.program_courses as permissive for select to authenticated
  using (is_program_member(auth.uid(), program_id));

create policy "Institution admins can create programs" on public.programs as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM institution_members
  WHERE ((institution_members.user_id = auth.uid()) AND (institution_members.institution_id = programs.institution_id) AND (institution_members.status = 'active'::institution_member_status) AND (institution_members.role = ANY (ARRAY['institution_admin'::institution_role, 'program_manager'::institution_role]))))));

create policy "Institution admins can delete programs" on public.programs as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM (institution_members im
     JOIN programs p ON ((p.institution_id = im.institution_id)))
  WHERE ((im.user_id = auth.uid()) AND (p.id = programs.id) AND (im.status = 'active'::institution_member_status) AND (im.role = 'institution_admin'::institution_role)))));

create policy "Institution admins can update programs" on public.programs as permissive for update to authenticated
  using (can_manage_program(auth.uid(), id));

create policy "Institution members can view programs" on public.programs as permissive for select to authenticated
  using ((is_program_member(auth.uid(), id) OR (visibility = 'public'::program_visibility)));

create policy "Platform admins full access to programs" on public.programs as permissive for all to authenticated
  using (is_platform_admin(auth.uid()));

create policy "Admins can view all attempts" on public.quiz_attempts as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Instructors can view quiz attempts for their courses" on public.quiz_attempts as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = quiz_attempts.course_id) AND (c.instructor_id = auth.uid())))));

create policy "Users can view own attempts" on public.quiz_attempts as permissive for select to public
  using ((user_id = auth.uid()));

create policy "Users can view their own quiz attempts" on public.quiz_attempts as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy instructors_view_own_course_quiz_attempts on public.quiz_attempts as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = quiz_attempts.course_id) AND (courses.instructor_id = auth.uid())))));

create policy "Instructors can delete quizzes" on public.quizzes as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN courses c ON ((c.id = l.course_id)))
  WHERE ((l.id = quizzes.lesson_id) AND (c.instructor_id = auth.uid())))));

create policy "Instructors can insert quizzes" on public.quizzes as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN courses c ON ((c.id = l.course_id)))
  WHERE ((l.id = quizzes.lesson_id) AND (c.instructor_id = auth.uid())))));

create policy "Instructors can update quizzes" on public.quizzes as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN courses c ON ((c.id = l.course_id)))
  WHERE ((l.id = quizzes.lesson_id) AND (c.instructor_id = auth.uid())))));

create policy quizzes_select_instructor_or_admin on public.quizzes as permissive for select to authenticated
  using (can_manage_lesson_quiz(lesson_id, auth.uid()));

create policy "Users can create reports" on public.reports as permissive for insert to public
  with check ((auth.uid() = reporter_id));

create policy "Users can view own reports" on public.reports as permissive for select to public
  using ((auth.uid() = reporter_id));

create policy "Open requests are viewable by authenticated users" on public.requests as permissive for select to authenticated
  using (((status = 'open'::request_status) OR (user_id = auth.uid())));

create policy "Users can create own requests" on public.requests as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy "Users can delete own requests" on public.requests as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy "Users can update own requests" on public.requests as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "Anyone can view reviews" on public.reviews as permissive for select to public
  using (true);

create policy "Participants can create reviews" on public.reviews as permissive for insert to public
  with check (((auth.uid() = reviewer_id) AND (EXISTS ( SELECT 1
   FROM sessions s
  WHERE ((s.id = reviews.session_id) AND (s.status = 'completed'::text) AND ((auth.uid() = s.learner_id) OR (auth.uid() = s.mentor_id)) AND ((reviews.reviewee_id = s.learner_id) OR (reviews.reviewee_id = s.mentor_id)) AND (reviews.reviewee_id <> auth.uid()))))));

create policy "Users can manage their own attempts" on public.sabiquiz_attempts as permissive for all to authenticated
  using ((user_id = auth.uid()));

create policy attempts_delete_policy on public.sabiquiz_attempts as permissive for delete to authenticated
  using ((auth.uid() = user_id));

create policy attempts_insert_policy on public.sabiquiz_attempts as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy attempts_select_policy on public.sabiquiz_attempts as permissive for select to authenticated
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'instructor'::user_role))))));

create policy attempts_update_policy on public.sabiquiz_attempts as permissive for update to authenticated
  using ((auth.uid() = user_id));

create policy users_own_attempts_insert on public.sabiquiz_attempts as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy users_own_attempts_select on public.sabiquiz_attempts as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy users_own_attempts_update on public.sabiquiz_attempts as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Users can delete own draft responses" on public.sabiquiz_draft_responses as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users can insert own draft responses" on public.sabiquiz_draft_responses as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own draft responses" on public.sabiquiz_draft_responses as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own draft responses" on public.sabiquiz_draft_responses as permissive for select to public
  using ((auth.uid() = user_id));

create policy draft_responses_delete_policy on public.sabiquiz_draft_responses as permissive for delete to authenticated
  using ((auth.uid() = user_id));

create policy draft_responses_insert_policy on public.sabiquiz_draft_responses as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy draft_responses_select_policy on public.sabiquiz_draft_responses as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy draft_responses_update_policy on public.sabiquiz_draft_responses as permissive for update to authenticated
  using ((auth.uid() = user_id));

create policy users_own_mastery_insert on public.sabiquiz_mastery as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy users_own_mastery_select on public.sabiquiz_mastery as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy users_own_mastery_update on public.sabiquiz_mastery as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy materials_delete_policy on public.sabiquiz_materials as permissive for delete to authenticated
  using ((auth.uid() = user_id));

create policy materials_insert_policy on public.sabiquiz_materials as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy materials_select_policy on public.sabiquiz_materials as permissive for select to authenticated
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'instructor'::user_role))))));

create policy materials_update_policy on public.sabiquiz_materials as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Authenticated users can create questions" on public.sabiquiz_questions as permissive for insert to authenticated
  with check (true);

create policy "Users can delete their questions" on public.sabiquiz_questions as permissive for delete to authenticated
  using ((created_by = auth.uid()));

create policy "Users can update their questions" on public.sabiquiz_questions as permissive for update to authenticated
  using ((created_by = auth.uid()));

create policy "Users can view questions" on public.sabiquiz_questions as permissive for select to authenticated
  using (((status = 'approved'::text) OR (created_by = auth.uid())));

create policy questions_delete_policy on public.sabiquiz_questions as permissive for delete to authenticated
  using (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'instructor'::user_role))))));

create policy questions_insert_policy on public.sabiquiz_questions as permissive for insert to authenticated
  with check ((auth.uid() = created_by));

create policy questions_select_policy on public.sabiquiz_questions as permissive for select to authenticated
  using (true);

create policy questions_update_policy on public.sabiquiz_questions as permissive for update to authenticated
  using (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'instructor'::user_role))))));

create policy view_approved_questions on public.sabiquiz_questions as permissive for select to authenticated
  using (((status = 'approved'::text) OR (status IS NULL)));

create policy "Users can manage their own responses" on public.sabiquiz_responses as permissive for all to authenticated
  using ((user_id = auth.uid()));

create policy responses_delete_policy on public.sabiquiz_responses as permissive for delete to authenticated
  using ((auth.uid() = user_id));

create policy responses_insert_policy on public.sabiquiz_responses as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy responses_select_policy on public.sabiquiz_responses as permissive for select to authenticated
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'instructor'::user_role))))));

create policy responses_update_policy on public.sabiquiz_responses as permissive for update to authenticated
  using ((auth.uid() = user_id));

create policy users_own_responses_insert on public.sabiquiz_responses as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy users_own_responses_select on public.sabiquiz_responses as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy "Users can manage own files" on public.sabiwrite_files as permissive for all to public
  using ((auth.uid() = user_id));

create policy "Users delete own files" on public.sabiwrite_files as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users insert own files" on public.sabiwrite_files as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users select own files" on public.sabiwrite_files as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users update own files" on public.sabiwrite_files as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can manage own messages" on public.sabiwrite_messages as permissive for all to public
  using ((auth.uid() = user_id));

create policy "Users delete own messages" on public.sabiwrite_messages as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users insert own messages" on public.sabiwrite_messages as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users select own messages" on public.sabiwrite_messages as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users update own messages" on public.sabiwrite_messages as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can manage own operations" on public.sabiwrite_operations as permissive for all to public
  using ((auth.uid() = user_id));

create policy "Users view own operations" on public.sabiwrite_operations as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users insert own versions" on public.sabiwrite_output_versions as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users select own versions" on public.sabiwrite_output_versions as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users update own versions" on public.sabiwrite_output_versions as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Anyone can read pricing" on public.sabiwrite_pricing_rules as permissive for select to public
  using (true);

create policy "Authenticated users view pricing" on public.sabiwrite_pricing_rules as permissive for select to public
  using ((auth.role() = 'authenticated'::text));

create policy "Users insert own refunds" on public.sabiwrite_refunds as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users view own refunds" on public.sabiwrite_refunds as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users can manage own sessions" on public.sabiwrite_sessions as permissive for all to public
  using ((auth.uid() = user_id));

create policy "Users delete own sessions" on public.sabiwrite_sessions as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Users insert own sessions" on public.sabiwrite_sessions as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users select own sessions" on public.sabiwrite_sessions as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users update own sessions" on public.sabiwrite_sessions as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users view own usage" on public.sabiwrite_usage as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Learners can cancel own requests" on public.session_requests as permissive for update to public
  using (((auth.uid() = learner_id) AND (status = 'pending'::text)));

create policy "Learners can create requests" on public.session_requests as permissive for insert to public
  with check ((auth.uid() = learner_id));

create policy "Learners can view own requests" on public.session_requests as permissive for select to public
  using ((auth.uid() = learner_id));

create policy "Mentors can update request status" on public.session_requests as permissive for update to public
  using ((auth.uid() = mentor_id));

create policy "Mentors can view requests to them" on public.session_requests as permissive for select to public
  using ((auth.uid() = mentor_id));

create policy "Learners can create sessions" on public.sessions as permissive for insert to public
  with check ((auth.uid() = learner_id));

create policy "Participants can update sessions" on public.sessions as permissive for update to public
  using (((auth.uid() = learner_id) OR (auth.uid() = mentor_id)));

create policy "Participants can view own sessions" on public.sessions as permissive for select to public
  using (((auth.uid() = learner_id) OR (auth.uid() = mentor_id)));

create policy "Only admins can modify skills" on public.skills as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_super_admin = true)))));

create policy "Skills are viewable by everyone" on public.skills as permissive for select to public
  using ((is_active = true));

create policy "Users can insert own study streaks" on public.study_streaks as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own study streaks" on public.study_streaks as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own study streaks" on public.study_streaks as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Service role can manage subscriptions" on public.subscriptions as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy "Users can read own subscriptions" on public.subscriptions as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users can update own last_read" on public.thread_participants as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own participation" on public.thread_participants as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Participants can view threads" on public.threads as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM thread_participants tp
  WHERE ((tp.thread_id = threads.id) AND (tp.user_id = auth.uid())))));

create policy "Service role can manage transactions" on public.transactions as permissive for all to public
  using ((auth.role() = 'service_role'::text));

create policy "Users can read own transactions" on public.transactions as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Users can read own badges" on public.user_badges as permissive for select to public
  using ((auth.uid() = user_id));

create policy user_badges_write_own on public.user_badges as permissive for all to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Users can insert own learning context" on public.user_learning_context as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Users can update own learning context" on public.user_learning_context as permissive for update to public
  using ((auth.uid() = user_id));

create policy "Users can view own learning context" on public.user_learning_context as permissive for select to public
  using ((auth.uid() = user_id));

create policy "Instructors can view progress for their courses" on public.user_progress as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = user_progress.course_id) AND (c.instructor_id = auth.uid())))));

create policy "Users can view their own progress" on public.user_progress as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy user_progress_delete_own on public.user_progress as permissive for delete to public
  using ((auth.uid() = user_id));

create policy user_progress_insert_own_unlocked on public.user_progress as permissive for insert to public
  with check (((auth.uid() = user_id) AND can_complete_lesson(lesson_id, auth.uid())));

create policy user_progress_update_own_unlocked on public.user_progress as permissive for update to public
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND can_complete_lesson(lesson_id, auth.uid())));

create policy "Users can read own xp" on public.user_xp as permissive for select to public
  using ((auth.uid() = user_id));

create policy user_xp_write_own on public.user_xp as permissive for all to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy users_select_visible on public.users as permissive for select to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR is_platform_admin(( SELECT auth.uid() AS uid)) OR instructor_can_view_user(id)));

create policy users_update_own_profile on public.users as permissive for update to authenticated
  using ((( SELECT auth.uid() AS uid) = id))
  with check ((( SELECT auth.uid() AS uid) = id));

create policy waitlist_super_admin_select on public.waitlist_signups as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.is_super_admin = true) OR (users.platform_role IS NOT NULL))))));

create policy wallet_accounts_select_own on public.wallet_accounts as permissive for select to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy "Service role full access on wallet_ledger" on public.wallet_ledger as permissive for all to service_role
  using (true)
  with check (true);

create policy wallet_ledger_select_own on public.wallet_ledger as permissive for select to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy wallet_transactions_select_own on public.wallet_transactions as permissive for select to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));

create policy "Users can read own xp history" on public.xp_history as permissive for select to public
  using ((auth.uid() = user_id));

create policy xp_history_write_own on public.xp_history as permissive for all to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Allow authenticated users to upload thumbnails 16wdpfd_0" on storage.objects as permissive for insert to public
  with check (((bucket_id = 'course-thumbnails'::text) AND (auth.role() = 'authenticated'::text)));

create policy "Anyone can view course materials" on storage.objects as permissive for select to public
  using ((bucket_id = 'course-materials'::text));

create policy "Instructors can delete their materials" on storage.objects as permissive for delete to public
  using (((bucket_id = 'course-materials'::text) AND (auth.uid() = owner)));

create policy "Instructors can update their materials" on storage.objects as permissive for update to public
  using (((bucket_id = 'course-materials'::text) AND (auth.uid() = owner)));

create policy "Instructors can upload course materials" on storage.objects as permissive for insert to public
  with check (((bucket_id = 'course-materials'::text) AND (auth.role() = 'authenticated'::text)));

create policy "Public avatar access" on storage.objects as permissive for select to public
  using ((bucket_id = 'avatars'::text));

create policy "Users can delete their own materials" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'sabiquiz-materials'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can read their own materials" on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'sabiquiz-materials'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can upload their own materials" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'sabiquiz-materials'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy avatars_delete_own on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'avatars'::text) AND (owner = ( SELECT auth.uid() AS uid))));

create policy avatars_insert_signed_in on storage.objects as permissive for insert to authenticated
  with check ((bucket_id = 'avatars'::text));

create policy avatars_update_own on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'avatars'::text) AND (owner = ( SELECT auth.uid() AS uid))))
  with check (((bucket_id = 'avatars'::text) AND (owner = ( SELECT auth.uid() AS uid))));

-- anon on public.advisor_ai_cache: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.advisor_ai_cache: delete, insert, references, select, trigger, truncate, update

-- anon on public.advisor_operations: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.advisor_operations: delete, insert, references, select, trigger, truncate, update

-- anon on public.advisor_pricing: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.advisor_pricing: delete, insert, references, select, trigger, truncate, update

-- anon on public.audit_logs: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.audit_logs: delete, insert, references, select, trigger, truncate, update

-- anon on public.availability_slots: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.availability_slots: delete, insert, references, select, trigger, truncate, update

-- anon on public.blocks: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.blocks: delete, insert, references, select, trigger, truncate, update

-- anon on public.career_profiles: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.career_profiles: delete, insert, references, select, trigger, truncate, update

-- anon on public.career_results: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.career_results: delete, insert, references, select, trigger, truncate, update

-- anon on public.career_surveys: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.career_surveys: delete, insert, references, select, trigger, truncate, update

-- anon on public.categories: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.categories: delete, insert, references, select, trigger, truncate, update

-- anon on public.certificates: select

-- authenticated on public.certificates: delete, select, update

-- anon on public.chat_history: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.chat_history: delete, insert, references, select, trigger, truncate, update

-- anon on public.cohort_invites: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cohort_invites: delete, insert, references, select, trigger, truncate, update

-- anon on public.cohort_members: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cohort_members: delete, insert, references, select, trigger, truncate, update

-- anon on public.cohorts: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cohorts: delete, insert, references, select, trigger, truncate, update

-- anon on public.community_offers: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.community_offers: delete, insert, references, select, trigger, truncate, update

-- anon on public.community_profiles: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.community_profiles: delete, insert, references, select, trigger, truncate, update

-- anon on public.conversation_insights: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.conversation_insights: delete, insert, references, select, trigger, truncate, update

-- anon on public.course_discussions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.course_discussions: delete, insert, references, select, trigger, truncate, update

-- anon on public.course_enrollments: select

-- authenticated on public.course_enrollments: delete, insert, select, update

-- anon on public.course_purchases: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.course_purchases: delete, insert, references, select, trigger, truncate, update

-- anon on public.courses: select

-- authenticated on public.courses: delete, insert, select, update

-- anon on public.cover_letter_documents: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cover_letter_documents: delete, insert, references, select, trigger, truncate, update

-- anon on public.cover_letters: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cover_letters: delete, insert, references, select, trigger, truncate, update

-- anon on public.cv_documents: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.cv_documents: delete, insert, references, select, trigger, truncate, update

-- anon on public.enrollments: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.enrollments: delete, insert, references, select, trigger, truncate, update

-- anon on public.entitlements: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.entitlements: delete, insert, references, select, trigger, truncate, update

-- anon on public.generation_runs: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.generation_runs: delete, insert, references, select, trigger, truncate, update

-- anon on public.institution_applications: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.institution_applications: delete, insert, references, select, trigger, truncate, update

-- anon on public.institution_invites: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.institution_invites: delete, insert, references, select, trigger, truncate, update

-- anon on public.institution_members: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.institution_members: delete, insert, references, select, trigger, truncate, update

-- anon on public.institutions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.institutions: delete, insert, references, select, trigger, truncate, update

-- anon on public.instructor_profiles: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.instructor_profiles: delete, insert, references, select, trigger, truncate, update

-- anon on public.interview_answers: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.interview_answers: delete, insert, references, select, trigger, truncate, update

-- anon on public.interview_kits: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.interview_kits: delete, insert, references, select, trigger, truncate, update

-- anon on public.interview_sessions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.interview_sessions: delete, insert, references, select, trigger, truncate, update

-- anon on public.learning_milestones: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.learning_milestones: delete, insert, references, select, trigger, truncate, update

-- anon on public.lesson_ai_artifacts: references, select, trigger, truncate

-- authenticated on public.lesson_ai_artifacts: references, select, trigger, truncate

-- anon on public.lesson_notes: select

-- authenticated on public.lesson_notes: delete, insert, select, update

-- anon on public.lesson_progress: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.lesson_progress: delete, insert, references, select, trigger, truncate, update

-- anon on public.lesson_questions: insert, references, select, trigger, truncate

-- authenticated on public.lesson_questions: insert, references, select, trigger, truncate

-- anon on public.lessons: select

-- authenticated on public.lessons: delete, insert, select, update

-- anon on public.material_chunks: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.material_chunks: delete, insert, references, select, trigger, truncate, update

-- anon on public.mentor_profiles: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.mentor_profiles: delete, insert, references, select, trigger, truncate, update

-- anon on public.messages: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.messages: delete, insert, references, select, trigger, truncate, update

-- anon on public.mobile_entitlements: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.mobile_entitlements: delete, insert, references, select, trigger, truncate, update

-- anon on public.mobile_operations: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.mobile_operations: delete, insert, references, select, trigger, truncate, update

-- anon on public.mobile_wallet_ledger: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.mobile_wallet_ledger: delete, insert, references, select, trigger, truncate, update

-- anon on public.mobile_wallets: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.mobile_wallets: delete, insert, references, select, trigger, truncate, update

-- anon on public.modules: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.modules: delete, insert, references, select, trigger, truncate, update

-- anon on public.notifications: references, select, trigger, truncate, update

-- authenticated on public.notifications: references, select, trigger, truncate, update

-- anon on public.org_metrics_daily: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.org_metrics_daily: delete, insert, references, select, trigger, truncate, update

-- anon on public.plans: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.plans: delete, insert, references, select, trigger, truncate, update

-- anon on public.platform_settings: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.platform_settings: delete, insert, references, select, trigger, truncate, update

-- anon on public.profile_skills: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.profile_skills: delete, insert, references, select, trigger, truncate, update

-- anon on public.program_courses: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.program_courses: delete, insert, references, select, trigger, truncate, update

-- anon on public.programs: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.programs: delete, insert, references, select, trigger, truncate, update

-- anon on public.quiz_attempts: select

-- authenticated on public.quiz_attempts: select

-- anon on public.quiz_questions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.quiz_questions: delete, insert, references, select, trigger, truncate, update

-- anon on public.quizzes: select

-- authenticated on public.quizzes: delete, insert, select, update

-- anon on public.reports: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.reports: delete, insert, references, select, trigger, truncate, update

-- anon on public.requests: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.requests: delete, insert, references, select, trigger, truncate, update

-- anon on public.reviews: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.reviews: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_attempts: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_attempts: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_draft_responses: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_draft_responses: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_mastery: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_mastery: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_materials: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_materials: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_questions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_questions: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiquiz_responses: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiquiz_responses: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_files: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_files: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_messages: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_messages: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_operations: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_operations: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_output_versions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_output_versions: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_pricing_rules: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_pricing_rules: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_refunds: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_refunds: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_sessions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_sessions: delete, insert, references, select, trigger, truncate, update

-- anon on public.sabiwrite_usage: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sabiwrite_usage: delete, insert, references, select, trigger, truncate, update

-- anon on public.session_requests: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.session_requests: delete, insert, references, select, trigger, truncate, update

-- anon on public.sessions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.sessions: delete, insert, references, select, trigger, truncate, update

-- anon on public.skills: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.skills: delete, insert, references, select, trigger, truncate, update

-- anon on public.study_streaks: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.study_streaks: delete, insert, references, select, trigger, truncate, update

-- anon on public.subscriptions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.subscriptions: delete, insert, references, select, trigger, truncate, update

-- anon on public.thread_participants: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.thread_participants: delete, insert, references, select, trigger, truncate, update

-- anon on public.threads: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.threads: delete, insert, references, select, trigger, truncate, update

-- anon on public.transactions: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.transactions: delete, insert, references, select, trigger, truncate, update

-- anon on public.user_badges: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.user_badges: delete, insert, references, select, trigger, truncate, update

-- anon on public.user_learning_context: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.user_learning_context: delete, insert, references, select, trigger, truncate, update

-- anon on public.user_progress: select

-- authenticated on public.user_progress: delete, insert, select, update

-- anon on public.user_xp: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.user_xp: delete, insert, references, select, trigger, truncate, update

-- anon on public.users: references, select, trigger

-- authenticated on public.users: references, select, trigger

-- anon on public.waitlist_signups: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.waitlist_signups: delete, insert, references, select, trigger, truncate, update

-- anon on public.wallet_accounts: references, trigger

-- authenticated on public.wallet_accounts: references, select, trigger

-- anon on public.wallet_ledger: references, trigger

-- authenticated on public.wallet_ledger: references, select, trigger

-- anon on public.wallet_summary: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.wallet_summary: delete, insert, references, select, trigger, truncate, update

-- anon on public.wallet_transactions: references, trigger

-- authenticated on public.wallet_transactions: references, select, trigger

-- anon on public.xp_history: delete, insert, references, select, trigger, truncate, update

-- authenticated on public.xp_history: delete, insert, references, select, trigger, truncate, update

-- authenticated may update only these columns of public.users: avatar_url, bio, full_name, location, phone, preferred_language, profile_image_url, updated_at, website

-- security definer add_milestone(p_user_id uuid, p_milestone_type text, p_milestone_name text, p_milestone_description text, p_metadata jsonb) executable by: service_role

-- security definer auto_generate_certificate(p_user_id uuid, p_course_id uuid) executable by: service_role

-- security definer can_complete_lesson(p_lesson_id uuid, p_user uuid) executable by: anon, authenticated, service_role

-- security definer can_manage_cohort(p_user_id uuid, p_cohort_id uuid) executable by: anon, authenticated, service_role

-- security definer can_manage_lesson_quiz(p_lesson uuid, p_user uuid) executable by: anon, authenticated, service_role

-- security definer can_manage_program(p_user_id uuid, p_program_id uuid) executable by: anon, authenticated, service_role

-- security definer can_read_course(p_course uuid, p_user uuid) executable by: anon, authenticated, service_role

-- security definer can_self_enroll(p_course uuid) executable by: authenticated, service_role

-- security definer check_course_completion(p_user_id uuid, p_course_id uuid) executable by: service_role

-- security definer enforce_signup_gate() executable by: service_role

-- security definer get_public_profiles(p_ids uuid[]) executable by: authenticated, service_role

-- security definer get_thread_unread_count(p_thread_id uuid, p_user_id uuid) executable by: anon, authenticated, service_role

-- security definer get_unread_count(p_user_id uuid) executable by: anon, authenticated, service_role

-- security definer handle_new_user() executable by: service_role

-- security definer has_institution_role(p_institution uuid, p_roles text[]) executable by: authenticated, service_role

-- security definer instructor_can_view_user(p_user uuid) executable by: authenticated, service_role

-- security definer is_blocked(user_a uuid, user_b uuid) executable by: anon, authenticated, service_role

-- security definer is_cohort_member(p_user_id uuid, p_cohort_id uuid) executable by: anon, authenticated, service_role

-- security definer is_institution_admin(p_institution_id uuid, p_user_id uuid) executable by: anon, authenticated, service_role

-- security definer is_lesson_unlocked(p_lesson_id uuid, p_user uuid) executable by: anon, authenticated, service_role

-- security definer is_platform_admin(p_user_id uuid) executable by: anon, authenticated, service_role

-- security definer is_program_member(p_user_id uuid, p_program_id uuid) executable by: anon, authenticated, service_role

-- security definer update_study_streak(p_user_id uuid) executable by: service_role
