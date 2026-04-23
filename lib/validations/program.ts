// ============================================================================
// ITERATION 2.1: PROGRAM & COHORT VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod'

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const programVisibilitySchema = z.enum(['private', 'unlisted', 'public'])
export const programStatusSchema = z.enum(['draft', 'active', 'completed', 'archived'])
export const cohortEnrollmentModeSchema = z.enum(['invite_only', 'access_code', 'approval_required', 'public'])
export const cohortStatusSchema = z.enum(['draft', 'active', 'closed', 'archived'])
export const cohortMemberStatusSchema = z.enum(['pending_approval', 'invited', 'active', 'completed', 'removed', 'withdrawn'])
export const sponsorshipTypeSchema = z.enum(['institution_sponsored', 'self_paid', 'donor_sponsored', 'scholarship'])

// ============================================================================
// HELPER: FLEXIBLE DATE SCHEMA
// Accepts YYYY-MM-DD or ISO datetime strings
// ============================================================================

const flexibleDateSchema = z.string()
  .optional()
  .nullable()
  .transform(v => {
    if (!v || v === '') return undefined
    // If it's a simple date (YYYY-MM-DD), convert to ISO datetime
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return `${v}T00:00:00.000Z`
    }
    return v
  })

// ============================================================================
// COMPLETION RULES SCHEMA
// ============================================================================

export const completionRulesSchema = z.object({
  min_courses_pct: z.number().min(0).max(100).optional(),
  min_quiz_score: z.number().min(0).max(100).optional(),
  required_course_ids: z.array(z.string().uuid()).optional(),
  min_time_spent_hours: z.number().min(0).optional(),
}).optional().default({})

// ============================================================================
// UNLOCK RULES SCHEMA
// ============================================================================

export const unlockRulesSchema = z.object({
  after_course_id: z.string().uuid().optional(),
  after_days: z.number().int().min(0).optional(),
  after_date: z.string().datetime().optional(),
}).optional().default({})

// ============================================================================
// PROGRAM SCHEMAS
// ============================================================================

export const createProgramSchema = z.object({
  institution_id: z.string().uuid('Invalid institution ID'),
  name: z.string()
    .min(2, 'Program name must be at least 2 characters')
    .max(200, 'Program name must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional().nullable().transform(v => v || undefined),
  short_description: z.string().max(500, 'Short description must be less than 500 characters').optional().nullable().transform(v => v || undefined),
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional().nullable().or(z.literal('')).transform(v => v || undefined),
  banner_url: z.string().url('Invalid banner URL').optional().nullable().or(z.literal('')).transform(v => v || undefined),
  visibility: programVisibilitySchema.optional().default('private'),
  start_date: z.string().optional().nullable().transform(v => v || undefined),
  end_date: z.string().optional().nullable().transform(v => v || undefined),
  completion_rules: completionRulesSchema,
  issue_certificate: z.boolean().optional().default(true),
  allow_self_paced: z.boolean().optional().default(true),
})

export const updateProgramSchema = z.object({
  name: z.string()
    .min(2, 'Program name must be at least 2 characters')
    .max(200, 'Program name must be less than 200 characters')
    .optional(),
  description: z.string().max(5000).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  visibility: programVisibilitySchema.optional(),
  status: programStatusSchema.optional(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  completion_rules: completionRulesSchema.optional(),
  issue_certificate: z.boolean().optional(),
  allow_self_paced: z.boolean().optional(),
})

// ============================================================================
// PROGRAM COURSES SCHEMAS
// ============================================================================

export const addProgramCourseSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  position: z.number().int().min(0).optional().default(0),
  is_required: z.boolean().optional().default(true),
  unlock_rules: unlockRulesSchema,
})

export const updateProgramCourseSchema = z.object({
  position: z.number().int().min(0).optional(),
  is_required: z.boolean().optional(),
  unlock_rules: unlockRulesSchema.optional(),
})

export const reorderProgramCoursesSchema = z.object({
  course_ids: z.array(z.string().uuid()).min(1, 'At least one course ID required'),
})

// ============================================================================
// COHORT SCHEMAS
// ============================================================================

export const createCohortSchema = z.object({
  program_id: z.string().uuid('Invalid program ID'),
  name: z.string()
    .min(2, 'Cohort name must be at least 2 characters')
    .max(200, 'Cohort name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  enrollment_mode: cohortEnrollmentModeSchema.optional().default('invite_only'),
  seat_limit: z.number().int().min(1).optional().nullable(),
  start_date: flexibleDateSchema,
  end_date: flexibleDateSchema,
  enrollment_start_date: flexibleDateSchema,
  enrollment_end_date: flexibleDateSchema,
  default_sponsorship: sponsorshipTypeSchema.optional().default('institution_sponsored'),
  allow_late_enrollment: z.boolean().optional().default(false),
  send_welcome_email: z.boolean().optional().default(true),
  send_reminder_emails: z.boolean().optional().default(true),
})

export const updateCohortSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  enrollment_mode: cohortEnrollmentModeSchema.optional(),
  seat_limit: z.number().int().min(1).optional().nullable(),
  start_date: flexibleDateSchema,
  end_date: flexibleDateSchema,
  enrollment_start_date: flexibleDateSchema,
  enrollment_end_date: flexibleDateSchema,
  status: cohortStatusSchema.optional(),
  default_sponsorship: sponsorshipTypeSchema.optional(),
  allow_late_enrollment: z.boolean().optional(),
  send_welcome_email: z.boolean().optional(),
  send_reminder_emails: z.boolean().optional(),
})

export const generateAccessCodeSchema = z.object({
  expires_in_days: z.number().int().min(1).max(365).optional().default(30),
  max_uses: z.number().int().min(1).max(10000).optional(),
})

// ============================================================================
// COHORT MEMBER SCHEMAS
// ============================================================================

export const inviteCohortMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  sponsorship: sponsorshipTypeSchema.optional().default('institution_sponsored'),
  sponsor_reference: z.string().max(255).optional(),
})

export const bulkInviteCohortMembersSchema = z.object({
  emails: z.array(z.string().email('Invalid email address'))
    .min(1, 'At least one email required')
    .max(500, 'Maximum 500 emails per request'),
  sponsorship: sponsorshipTypeSchema.optional().default('institution_sponsored'),
  sponsor_reference: z.string().max(255).optional(),
})

export const joinCohortSchema = z.object({
  access_code: z.string().min(1).max(50).optional(),
  application_note: z.string().max(1000).optional(),
})

export const updateCohortMemberSchema = z.object({
  status: cohortMemberStatusSchema.optional(),
  sponsorship: sponsorshipTypeSchema.optional(),
  sponsor_reference: z.string().max(255).optional().nullable(),
  removal_reason: z.string().max(500).optional(),
})

export const approveCohortMemberSchema = z.object({
  member_ids: z.array(z.string().uuid()).min(1, 'At least one member ID required'),
})

export const removeCohortMemberSchema = z.object({
  reason: z.string().max(500).optional(),
})

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const programQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).optional().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).max(100).optional().default(20)
  ),
  status: programStatusSchema.optional().nullable().transform(v => v ?? undefined),
  visibility: programVisibilitySchema.optional().nullable().transform(v => v ?? undefined),
  search: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
  institution_id: z.string().uuid().optional().nullable().transform(v => v ?? undefined),
})

export const cohortQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).optional().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).max(100).optional().default(20)
  ),
  status: cohortStatusSchema.optional().nullable().transform(v => v ?? undefined),
  enrollment_mode: cohortEnrollmentModeSchema.optional().nullable().transform(v => v ?? undefined),
  search: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
  program_id: z.string().uuid().optional().nullable().transform(v => v ?? undefined),
})

export const cohortMemberQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).optional().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === '' || val === undefined) ? undefined : val,
    z.coerce.number().int().min(1).max(100).optional().default(20)
  ),
  status: cohortMemberStatusSchema.optional().nullable().transform(v => v ?? undefined),
  search: z.string().max(100).optional().nullable().transform(v => v ?? undefined),
})

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CreateProgramInput = z.infer<typeof createProgramSchema>
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>
export type AddProgramCourseInput = z.infer<typeof addProgramCourseSchema>
export type CreateCohortInput = z.infer<typeof createCohortSchema>
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>
export type InviteCohortMemberInput = z.infer<typeof inviteCohortMemberSchema>
export type BulkInviteCohortMembersInput = z.infer<typeof bulkInviteCohortMembersSchema>
export type JoinCohortInput = z.infer<typeof joinCohortSchema>
export type UpdateCohortMemberInput = z.infer<typeof updateCohortMemberSchema>
export type ProgramQueryInput = z.infer<typeof programQuerySchema>
export type CohortQueryInput = z.infer<typeof cohortQuerySchema>
export type CohortMemberQueryInput = z.infer<typeof cohortMemberQuerySchema>