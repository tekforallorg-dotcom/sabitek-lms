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

const joinByInvitationSchema = z.object({
  mode: z.literal('invite_only'),
  invitation_token: z.string().min(1, 'Invitation token is required'),
})

const joinByAccessCodeSchema = z.object({
  mode: z.literal('access_code'),
  access_code: z.string().min(1, 'Access code is required'),
})

const joinByApprovalSchema = z.object({
  mode: z.literal('approval_required'),
  message: z.string().max(500).optional(),
})

const joinPublicSchema = z.object({
  mode: z.literal('public'),
})

const joinCohortSchema = z.discriminatedUnion('mode', [
  joinByInvitationSchema,
  joinByAccessCodeSchema,
  joinByApprovalSchema,
  joinPublicSchema,
])

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/cohorts/[id]/join
 * Learner-facing endpoint to join a cohort via any enrollment mode.
 *
 * Body:
 *   { mode: 'invite_only', invitation_token: string }
 *   { mode: 'access_code', access_code: string }
 *   { mode: 'approval_required', message?: string }
 *   { mode: 'public' }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cohortId } = await params

    /* ── Auth ── */
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    /* ── Parse body ── */
    const body = await request.json()
    const parsed = joinCohortSchema.safeParse(body)
    if (!parsed.success) {
      return ApiErrors.badRequest(parsed.error.errors[0]?.message || 'Invalid input')
    }
    const input = parsed.data

    /* ── Fetch cohort ── */
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        id, name, status, enrollment_mode, access_code,
        code_expires_at, code_max_uses, seat_limit,
        program:programs(id, institution_id, name)
      `)
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      return ApiErrors.notFound('Cohort not found')
    }

    /* ── Cohort must be active ── */
    if (cohort.status !== 'active') {
      return ApiErrors.badRequest('This cohort is not currently accepting enrollments')
    }

    /* ── Check mode matches cohort config ── */
    if (input.mode !== cohort.enrollment_mode) {
      // Exception: invite_only cohorts allow token-based joins regardless
      if (!(cohort.enrollment_mode === 'invite_only' && input.mode === 'invite_only')) {
        return ApiErrors.badRequest(
          `This cohort uses "${cohort.enrollment_mode}" enrollment. ` +
          `You cannot join via "${input.mode}".`
        )
      }
    }

    /* ── Check duplicate membership ── */
    const { data: existingMember } = await supabaseAdmin
      .from('cohort_members')
      .select('id, status')
      .eq('cohort_id', cohortId)
      .eq('user_id', user.id)
      .single()

    // Allow re-join if previously withdrawn or removed
    if (existingMember) {
      if (['active', 'completed'].includes(existingMember.status)) {
        return ApiErrors.badRequest('You are already a member of this cohort')
      }
      if (existingMember.status === 'pending_approval') {
        return ApiErrors.badRequest('Your application is already pending review')
      }
      if (existingMember.status === 'invited') {
        // If they're invited and trying to join via invite_only, handle below
        // Otherwise they already have a pending invite
        if (input.mode !== 'invite_only') {
          return ApiErrors.badRequest('You have a pending invitation for this cohort')
        }
      }
    }

    /* ── Seat limit check (shared across all modes) ── */
    if (cohort.seat_limit) {
      const { count } = await supabaseAdmin
        .from('cohort_members')
        .select('*', { count: 'exact', head: true })
        .eq('cohort_id', cohortId)
        .in('status', ['active', 'invited', 'pending_approval'])

      if (count !== null && count >= cohort.seat_limit) {
        return ApiErrors.badRequest('This cohort has reached its seat limit')
      }
    }

    /* ── Mode-specific logic ── */
    const now = new Date().toISOString()
    const programData = cohort.program as unknown as { id: string; institution_id: string; name: string }

    switch (input.mode) {
      /* ─── INVITE_ONLY: validate token, activate existing row ─── */
      case 'invite_only': {
        if (!existingMember || existingMember.status !== 'invited') {
          return ApiErrors.badRequest('No pending invitation found. Please request an invite.')
        }

        // Fetch the full member row to check the token
        const { data: memberRow } = await supabaseAdmin
          .from('cohort_members')
          .select('id, invitation_token, invitation_expires_at')
          .eq('id', existingMember.id)
          .single()

        if (!memberRow) {
          return ApiErrors.internal('Failed to verify invitation')
        }

        // Validate token
        if (memberRow.invitation_token !== input.invitation_token) {
          return ApiErrors.badRequest('Invalid invitation token')
        }

        // Check expiry
        if (memberRow.invitation_expires_at && new Date(memberRow.invitation_expires_at) < new Date()) {
          return ApiErrors.badRequest('This invitation has expired. Please request a new one.')
        }

        // Activate membership
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('cohort_members')
          .update({
            status: 'active',
            joined_at: now,
            invitation_token: null, // Clear token after use
            updated_at: now,
          })
          .eq('id', existingMember.id)
          .select('id, status, joined_at')
          .single()

        if (updateError) {
          console.error('Error accepting invitation:', updateError)
          return ApiErrors.internal('Failed to accept invitation')
        }

        await writeAuditLog(user.id, 'cohort.member_joined', 'cohort', cohortId, {
          method: 'invitation',
          member_id: existingMember.id,
        })

        return apiSuccess({
          message: 'Invitation accepted. Welcome to the cohort!',
          member: updated,
        })
      }

      /* ─── ACCESS_CODE: validate code, create active row ─── */
      case 'access_code': {
        if (!cohort.access_code) {
          return ApiErrors.badRequest('This cohort does not have an access code configured')
        }

        // Validate code (case-insensitive comparison)
        if (cohort.access_code.toLowerCase() !== input.access_code.toLowerCase()) {
          return ApiErrors.badRequest('Invalid access code')
        }

        // Check code expiry
        if (cohort.code_expires_at && new Date(cohort.code_expires_at) < new Date()) {
          return ApiErrors.badRequest('This access code has expired')
        }

        // Check max uses
        if (cohort.code_max_uses) {
          const { count } = await supabaseAdmin
            .from('cohort_members')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', cohortId)
            .in('status', ['active', 'completed'])

          if (count !== null && count >= cohort.code_max_uses) {
            return ApiErrors.badRequest('This access code has reached its maximum number of uses')
          }
        }

        // Handle re-join for withdrawn/removed members
        let member
        if (existingMember && ['withdrawn', 'removed'].includes(existingMember.status)) {
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .update({
              status: 'active',
              joined_at: now,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
              withdrawn_at: null,
              withdrawal_reason: null,
              updated_at: now,
            })
            .eq('id', existingMember.id)
            .select('id, status, joined_at')
            .single()

          if (error) {
            console.error('Error re-joining cohort:', error)
            return ApiErrors.internal('Failed to join cohort')
          }
          member = data
        } else {
          // Create new membership
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .insert({
              cohort_id: cohortId,
              user_id: user.id,
              status: 'active',
              sponsorship: 'self_paid',
              joined_at: now,
            })
            .select('id, status, joined_at')
            .single()

          if (error) {
            console.error('Error joining cohort:', error)
            return ApiErrors.internal('Failed to join cohort')
          }
          member = data
        }

        await writeAuditLog(user.id, 'cohort.member_joined', 'cohort', cohortId, {
          method: 'access_code',
          member_id: member?.id,
        })

        return apiSuccess({
          message: 'Successfully joined the cohort!',
          member,
        })
      }

      /* ─── APPROVAL_REQUIRED: create pending_approval row ─── */
      case 'approval_required': {
        // Handle re-application for withdrawn/removed members
        let member
        if (existingMember && ['withdrawn', 'removed'].includes(existingMember.status)) {
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .update({
              status: 'pending_approval',
              applied_at: now,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
              withdrawn_at: null,
              withdrawal_reason: null,
              updated_at: now,
            })
            .eq('id', existingMember.id)
            .select('id, status, applied_at')
            .single()

          if (error) {
            console.error('Error re-applying to cohort:', error)
            return ApiErrors.internal('Failed to submit application')
          }
          member = data
        } else {
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .insert({
              cohort_id: cohortId,
              user_id: user.id,
              status: 'pending_approval',
              sponsorship: 'self_paid',
              applied_at: now,
            })
            .select('id, status, applied_at')
            .single()

          if (error) {
            console.error('Error applying to cohort:', error)
            return ApiErrors.internal('Failed to submit application')
          }
          member = data
        }

        await writeAuditLog(user.id, 'cohort.member_applied', 'cohort', cohortId, {
          method: 'approval_required',
          member_id: member?.id,
          message: input.message || null,
        })

        return apiSuccess({
          message: 'Application submitted. You will be notified once reviewed.',
          member,
        })
      }

      /* ─── PUBLIC: create active row directly ─── */
      case 'public': {
        let member
        if (existingMember && ['withdrawn', 'removed'].includes(existingMember.status)) {
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .update({
              status: 'active',
              joined_at: now,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
              withdrawn_at: null,
              withdrawal_reason: null,
              updated_at: now,
            })
            .eq('id', existingMember.id)
            .select('id, status, joined_at')
            .single()

          if (error) {
            console.error('Error re-joining cohort:', error)
            return ApiErrors.internal('Failed to join cohort')
          }
          member = data
        } else {
          const { data, error } = await supabaseAdmin
            .from('cohort_members')
            .insert({
              cohort_id: cohortId,
              user_id: user.id,
              status: 'active',
              sponsorship: 'self_paid',
              joined_at: now,
            })
            .select('id, status, joined_at')
            .single()

          if (error) {
            console.error('Error joining cohort:', error)
            return ApiErrors.internal('Failed to join cohort')
          }
          member = data
        }

        await writeAuditLog(user.id, 'cohort.member_joined', 'cohort', cohortId, {
          method: 'public',
          member_id: member?.id,
        })

        return apiSuccess({
          message: 'Successfully joined the cohort!',
          member,
        })
      }

      default:
        return ApiErrors.badRequest('Unsupported enrollment mode')
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(error.errors[0]?.message || 'Invalid input')
    }
    console.error('Cohort join error:', error)
    return ApiErrors.internal()
  }
}

/* ── Helpers ── */

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
    // Non-blocking: log but don't fail the request
    console.error('Failed to write audit log:', err)
  }
}