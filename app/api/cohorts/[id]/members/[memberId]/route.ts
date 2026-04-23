import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ── Zod schemas ── */

const approveSchema = z.object({
  action: z.literal('approve'),
  sponsorship: z.enum(['institution_sponsored', 'self_paid', 'donor_sponsored', 'scholarship']).optional(),
})

const rejectSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().max(500).optional(),
})

const removeSchema = z.object({
  action: z.literal('remove'),
  reason: z.string().max(500).optional(),
})

const memberActionSchema = z.discriminatedUnion('action', [
  approveSchema,
  rejectSchema,
  removeSchema,
])

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>
}

/**
 * GET /api/cohorts/[id]/members/[memberId]
 * Get a single cohort member's details.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cohortId, memberId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify access via institution membership
    const hasAccess = await verifyInstitutionAccess(cohortId, user.id)
    if (!hasAccess) {
      return ApiErrors.forbidden('Not authorized to view cohort members')
    }

    const { data: member, error } = await supabaseAdmin
      .from('cohort_members')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url)
      `)
      .eq('id', memberId)
      .eq('cohort_id', cohortId)
      .single()

    if (error || !member) {
      return ApiErrors.notFound('Member not found')
    }

    return apiSuccess(member)
  } catch (err: unknown) {
    console.error('Cohort member GET error:', err)
    return ApiErrors.internal()
  }
}

/**
 * PATCH /api/cohorts/[id]/members/[memberId]
 * Approve, reject, or remove a cohort member.
 *
 * Body:
 *   { action: 'approve', sponsorship?: SponsorshipType }
 *   { action: 'reject', reason?: string }
 *   { action: 'remove', reason?: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cohortId, memberId } = await params

    /* ── Auth ── */
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    /* ── Authorization: must be institution staff ── */
    const staffRole = await getInstitutionRole(cohortId, user.id)
    if (!staffRole || !['institution_admin', 'program_manager', 'facilitator'].includes(staffRole)) {
      return ApiErrors.forbidden('Not authorized to manage cohort members')
    }

    /* ── Parse body ── */
    const body = await request.json()
    const parsed = memberActionSchema.safeParse(body)
    if (!parsed.success) {
      return ApiErrors.badRequest(parsed.error.errors[0]?.message || 'Invalid input')
    }
    const input = parsed.data

    /* ── Fetch member ── */
    const { data: member, error: memberError } = await supabaseAdmin
      .from('cohort_members')
      .select('id, user_id, status, cohort_id')
      .eq('id', memberId)
      .eq('cohort_id', cohortId)
      .single()

    if (memberError || !member) {
      return ApiErrors.notFound('Member not found in this cohort')
    }

    /* ── Prevent self-action ── */
    if (member.user_id === user.id) {
      return ApiErrors.badRequest('You cannot perform this action on yourself')
    }

    const now = new Date().toISOString()

    switch (input.action) {
      /* ─── APPROVE ─── */
      case 'approve': {
        if (member.status !== 'pending_approval') {
          return ApiErrors.badRequest(
            `Cannot approve a member with status "${member.status}". Only pending members can be approved.`
          )
        }

        const updateData: Record<string, unknown> = {
          status: 'active',
          approved_by: user.id,
          approved_at: now,
          joined_at: now,
          updated_at: now,
        }

        // Optionally set sponsorship on approval
        if (input.sponsorship) {
          updateData.sponsorship = input.sponsorship
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('cohort_members')
          .update(updateData)
          .eq('id', memberId)
          .select(`
            *,
            user:users(id, full_name, email, avatar_url)
          `)
          .single()

        if (updateError) {
          console.error('Error approving member:', updateError)
          return ApiErrors.internal('Failed to approve member')
        }

        await writeAuditLog(user.id, 'cohort.member_approved', 'cohort_member', memberId, {
          cohort_id: cohortId,
          target_user_id: member.user_id,
          sponsorship: input.sponsorship || null,
        })

        // TODO: Send approval notification email via Resend

        return apiSuccess({
          message: 'Member approved successfully',
          member: updated,
        })
      }

      /* ─── REJECT ─── */
      case 'reject': {
        if (member.status !== 'pending_approval') {
          return ApiErrors.badRequest(
            `Cannot reject a member with status "${member.status}". Only pending members can be rejected.`
          )
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('cohort_members')
          .update({
            status: 'removed',
            removed_by: user.id,
            removed_at: now,
            removal_reason: input.reason || 'Application rejected',
            updated_at: now,
          })
          .eq('id', memberId)
          .select(`
            *,
            user:users(id, full_name, email, avatar_url)
          `)
          .single()

        if (updateError) {
          console.error('Error rejecting member:', updateError)
          return ApiErrors.internal('Failed to reject member')
        }

        await writeAuditLog(user.id, 'cohort.member_rejected', 'cohort_member', memberId, {
          cohort_id: cohortId,
          target_user_id: member.user_id,
          reason: input.reason || null,
        })

        return apiSuccess({
          message: 'Application rejected',
          member: updated,
        })
      }

      /* ─── REMOVE ─── */
      case 'remove': {
        if (!['active', 'invited', 'pending_approval'].includes(member.status)) {
          return ApiErrors.badRequest(
            `Cannot remove a member with status "${member.status}".`
          )
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('cohort_members')
          .update({
            status: 'removed',
            removed_by: user.id,
            removed_at: now,
            removal_reason: input.reason || 'Removed by administrator',
            updated_at: now,
          })
          .eq('id', memberId)
          .select(`
            *,
            user:users(id, full_name, email, avatar_url)
          `)
          .single()

        if (updateError) {
          console.error('Error removing member:', updateError)
          return ApiErrors.internal('Failed to remove member')
        }

        await writeAuditLog(user.id, 'cohort.member_removed', 'cohort_member', memberId, {
          cohort_id: cohortId,
          target_user_id: member.user_id,
          reason: input.reason || null,
        })

        return apiSuccess({
          message: 'Member removed from cohort',
          member: updated,
        })
      }

      default:
        return ApiErrors.badRequest('Unsupported action')
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(error.errors[0]?.message || 'Invalid input')
    }
    console.error('Cohort member PATCH error:', error)
    return ApiErrors.internal()
  }
}

/* ── Helpers ── */

async function verifyInstitutionAccess(cohortId: string, userId: string): Promise<boolean> {
  const { data: cohort } = await supabaseAdmin
    .from('cohorts')
    .select('program:programs(institution_id)')
    .eq('id', cohortId)
    .single()

  if (!cohort) return false

  const programData = cohort.program as unknown as { institution_id: string }

  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role')
    .eq('institution_id', programData.institution_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !!membership
}

async function getInstitutionRole(cohortId: string, userId: string): Promise<string | null> {
  const { data: cohort } = await supabaseAdmin
    .from('cohorts')
    .select('program:programs(institution_id)')
    .eq('id', cohortId)
    .single()

  if (!cohort) return null

  const programData = cohort.program as unknown as { institution_id: string }

  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role')
    .eq('institution_id', programData.institution_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return membership?.role || null
}

async function writeAuditLog(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  newState: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      new_state: newState,
    })
  } catch (err: unknown) {
    console.error('Failed to write audit log:', err)
  }
}