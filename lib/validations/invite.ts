// ============================================================================
// ITERATION 4.5 / SLICE 4.5.2 — INVITE VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const inviteTypeSchema = z.enum(['LINK', 'QR', 'EMAIL_CAMPAIGN', 'BULK_CSV'])
export const inviteStatusSchema = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED', 'EXHAUSTED'])

// ============================================================================
// CREATE INVITE
// ============================================================================

export const createInviteSchema = z.object({
  type: inviteTypeSchema.optional().default('LINK'),

  /** ISO datetime string. Null/undefined = never expires. */
  expires_at: z
    .string()
    .datetime({ message: 'expires_at must be an ISO datetime string' })
    .optional()
    .nullable()
    .transform((v) => v || undefined),

  /** Null/undefined = unlimited uses. Must be ≥ 1 if provided. */
  max_uses: z
    .number()
    .int()
    .min(1, 'max_uses must be at least 1')
    .max(100000, 'max_uses cannot exceed 100,000')
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),

  /** Free-form metadata: campaign_name, csv_batch_id, source_channel, etc. */
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

// ============================================================================
// LIST INVITES (query params)
// ============================================================================

export const listInvitesQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v === null || v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).optional().default(1)
  ),
  limit: z.preprocess(
    (v) => (v === null || v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).max(100).optional().default(20)
  ),
  status: inviteStatusSchema.optional().nullable().transform((v) => v ?? undefined),
  type: inviteTypeSchema.optional().nullable().transform((v) => v ?? undefined),
})

// ============================================================================
// REVOKE INVITE
// ============================================================================

export const revokeInviteSchema = z.object({
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type ListInvitesQuery = z.infer<typeof listInvitesQuerySchema>
export type RevokeInviteInput = z.infer<typeof revokeInviteSchema>
export type InviteType = z.infer<typeof inviteTypeSchema>
export type InviteStatus = z.infer<typeof inviteStatusSchema>