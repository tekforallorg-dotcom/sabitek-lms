import { z } from 'zod'
import { uuidSchema } from './index'

// ============================================
// INSTITUTION ENUMS AS ZOD
// ============================================

export const institutionTypeSchema = z.enum([
  'school',
  'ngo',
  'government',
  'training_center',
  'company',
  'other',
])

export const institutionStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'suspended',
  'archived',
])

export const institutionRoleSchema = z.enum([
  'institution_admin',
  'program_manager',
  'facilitator',
  'instructor',
  'viewer',
])

// Token-based team invite (works for people with no account yet).
export const createInstitutionInviteSchema = z.object({
  role: institutionRoleSchema,
  email: z.string().email('Please enter a valid email').optional(),
  expires_in_days: z.number().int().min(1).max(90).optional(),
  max_uses: z.number().int().min(1).max(500).optional(),
})

// ============================================
// CREATE INSTITUTION SCHEMA
// ============================================

export const createInstitutionSchema = z.object({
  name: z
    .string()
    .min(2, 'Institution name must be at least 2 characters')
    .max(100, 'Institution name must be under 100 characters'),
  type: institutionTypeSchema,
  description: z.string().max(1000).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  lga: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().max(20).optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional(),
  vertical_metadata: z.record(z.string(), z.string()).optional(),
})

// ============================================
// UPDATE INSTITUTION SCHEMA
// ============================================

export const updateInstitutionSchema = createInstitutionSchema.partial().extend({
  email_domain_allowlist: z.array(z.string()).optional(),
  banner_url: z.string().url().optional().or(z.literal('')),
  terminology_pack: z.record(z.string(), z.string()).optional(),
})

// ============================================
// MEMBER MANAGEMENT SCHEMAS
// ============================================

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: institutionRoleSchema,
})

export const updateMemberRoleSchema = z.object({
  role: institutionRoleSchema,
})

// ============================================
// ADMIN APPROVAL SCHEMA
// ============================================

export const approveInstitutionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_notes: z.string().max(1000).optional(),
  rejection_reason: z.string().max(500).optional(),
})

// ============================================
// QUERY SCHEMAS
// ============================================

export const institutionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: institutionStatusSchema.optional(),
  type: institutionTypeSchema.optional(),
  search: z.string().optional(),
})

// ============================================
// TYPES
// ============================================

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type ApproveInstitutionInput = z.infer<typeof approveInstitutionSchema>
export type InstitutionQueryParams = z.infer<typeof institutionQuerySchema>