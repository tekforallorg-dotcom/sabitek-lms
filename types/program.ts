// ============================================================================
// ITERATION 2.1: PROGRAM & COHORT TYPES
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum ProgramVisibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public',
}

export enum ProgramStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CohortEnrollmentMode {
  INVITE_ONLY = 'invite_only',
  ACCESS_CODE = 'access_code',
  APPROVAL_REQUIRED = 'approval_required',
  PUBLIC = 'public',
}

export enum CohortStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum CohortMemberStatus {
  PENDING_APPROVAL = 'pending_approval',
  INVITED = 'invited',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REMOVED = 'removed',
  WITHDRAWN = 'withdrawn',
}

export enum SponsorshipType {
  INSTITUTION_SPONSORED = 'institution_sponsored',
  SELF_PAID = 'self_paid',
  DONOR_SPONSORED = 'donor_sponsored',
  SCHOLARSHIP = 'scholarship',
}

// ============================================================================
// COMPLETION RULES
// ============================================================================

export interface CompletionRules {
  min_courses_pct?: number        // Minimum % of courses to complete (0-100)
  min_quiz_score?: number         // Minimum average quiz score (0-100)
  required_course_ids?: string[]  // Specific courses that must be completed
  min_time_spent_hours?: number   // Minimum time spent in program
}

// ============================================================================
// UNLOCK RULES (for program_courses)
// ============================================================================

export interface UnlockRules {
  after_course_id?: string   // Must complete this course first
  after_days?: number        // Available X days after enrollment
  after_date?: string        // Available after specific date
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Program {
  id: string
  institution_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  thumbnail_url: string | null
  banner_url: string | null
  visibility: ProgramVisibility
  status: ProgramStatus
  start_date: string | null
  end_date: string | null
  completion_rules: CompletionRules
  certificate_template_id: string | null
  issue_certificate: boolean
  allow_self_paced: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProgramCourse {
  id: string
  program_id: string
  course_id: string
  position: number
  is_required: boolean
  unlock_rules: UnlockRules
  added_by: string | null
  added_at: string
}

export interface Cohort {
  id: string
  program_id: string
  name: string
  slug: string
  description: string | null
  enrollment_mode: CohortEnrollmentMode
  seat_limit: number | null
  access_code: string | null
  access_code_expires_at: string | null
  access_code_max_uses: number | null
  access_code_uses: number
  start_date: string | null
  end_date: string | null
  enrollment_start_date: string | null
  enrollment_end_date: string | null
  status: CohortStatus
  default_sponsorship: SponsorshipType
  allow_late_enrollment: boolean
  send_welcome_email: boolean
  send_reminder_emails: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CohortMember {
  id: string
  cohort_id: string
  user_id: string
  status: CohortMemberStatus
  sponsorship: SponsorshipType
  sponsor_reference: string | null
  invited_by: string | null
  invited_at: string | null
  invitation_token: string | null
  invitation_expires_at: string | null
  applied_at: string | null
  approved_by: string | null
  approved_at: string | null
  joined_at: string | null
  completed_at: string | null
  completion_certificate_id: string | null
  removed_at: string | null
  removed_by: string | null
  removal_reason: string | null
  withdrawn_at: string | null
  withdrawal_reason: string | null
  progress_pct: number
  courses_completed: number
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// EXTENDED TYPES (with relations)
// ============================================================================

export interface ProgramWithInstitution extends Program {
  institution: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

export interface ProgramWithCourses extends Program {
  program_courses: (ProgramCourse & {
    course: {
      id: string
      title: string
      slug: string
      thumbnail: string | null
      lessons_count?: number
    }
  })[]
}

export interface ProgramWithStats extends Program {
  cohort_count: number
  total_learners: number
  active_learners: number
  completion_rate: number
}

export interface CohortWithProgram extends Cohort {
  program: {
    id: string
    name: string
    slug: string
    institution_id: string
  }
}

export interface CohortWithMembers extends Cohort {
  members: CohortMemberWithUser[]
  member_count: number
}

export interface CohortWithStats extends Cohort {
  member_count: number
  active_count: number
  completed_count: number
  pending_count: number
  average_progress: number
}

export interface CohortMemberWithUser extends CohortMember {
  user: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface CohortMemberWithCohort extends CohortMember {
  cohort: CohortWithProgram
}

// ============================================================================
// API INPUT TYPES
// ============================================================================

export interface CreateProgramInput {
  institution_id: string
  name: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  banner_url?: string
  visibility?: ProgramVisibility
  start_date?: string
  end_date?: string
  completion_rules?: CompletionRules
  issue_certificate?: boolean
  allow_self_paced?: boolean
}

export interface UpdateProgramInput {
  name?: string
  description?: string
  short_description?: string
  thumbnail_url?: string
  banner_url?: string
  visibility?: ProgramVisibility
  status?: ProgramStatus
  start_date?: string | null
  end_date?: string | null
  completion_rules?: CompletionRules
  issue_certificate?: boolean
  allow_self_paced?: boolean
}

export interface AddProgramCourseInput {
  course_id: string
  position?: number
  is_required?: boolean
  unlock_rules?: UnlockRules
}

export interface CreateCohortInput {
  program_id: string
  name: string
  description?: string
  enrollment_mode?: CohortEnrollmentMode
  seat_limit?: number
  start_date?: string
  end_date?: string
  enrollment_start_date?: string
  enrollment_end_date?: string
  default_sponsorship?: SponsorshipType
  allow_late_enrollment?: boolean
  send_welcome_email?: boolean
  send_reminder_emails?: boolean
}

export interface UpdateCohortInput {
  name?: string
  description?: string
  enrollment_mode?: CohortEnrollmentMode
  seat_limit?: number | null
  start_date?: string | null
  end_date?: string | null
  enrollment_start_date?: string | null
  enrollment_end_date?: string | null
  status?: CohortStatus
  default_sponsorship?: SponsorshipType
  allow_late_enrollment?: boolean
  send_welcome_email?: boolean
  send_reminder_emails?: boolean
}

export interface InviteCohortMemberInput {
  email: string
  sponsorship?: SponsorshipType
  sponsor_reference?: string
}

export interface BulkInviteCohortMembersInput {
  emails: string[]
  sponsorship?: SponsorshipType
  sponsor_reference?: string
}

export interface JoinCohortInput {
  access_code?: string  // For access_code mode
  application_note?: string  // For approval_required mode
}

export interface UpdateCohortMemberInput {
  status?: CohortMemberStatus
  sponsorship?: SponsorshipType
  sponsor_reference?: string
  removal_reason?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProgramListResponse {
  programs: ProgramWithStats[]
  total: number
  page: number
  limit: number
}

export interface CohortListResponse {
  cohorts: CohortWithStats[]
  total: number
  page: number
  limit: number
}

export interface CohortMemberListResponse {
  members: CohortMemberWithUser[]
  total: number
  page: number
  limit: number
}