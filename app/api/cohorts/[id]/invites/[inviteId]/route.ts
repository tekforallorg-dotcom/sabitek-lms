import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { revokeInviteSchema } from '@/lib/validations/invite'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Authorization: user must be institution_admin or program_manager
 * at the institution that owns the cohort this invite belongs to.
 */
async function canRevokeInvite(
  userId: string,
  inviteId: string,
  cohortIdFromUrl: string
): Promise<{ allowed: boolean; reason?: string; invite?: any }> {
  // Fetch invite + resolve cohort → program → institution
  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('cohort_invites')
    .select('*, cohort:cohorts!inner(id, program_id, programs!inner(institution_id))')
    .eq('id', inviteId)
    .single()

  if (inviteErr || !invite) {
    return { allowed: false, reason: 'not_found' }
  }

  // Verify URL consistency — prevents users from guessing invite IDs
  // that belong to cohorts they do have access to.
  if (invite.cohort_id !== cohortIdFromUrl) {
    return { allowed: false, reason: 'not_found' }
  }

  const institutionId = (invite.cohort as any).programs.institution_id

  // Platform admin bypass
  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()

  if (userProfile?.is_super_admin || userProfile?.platform_role) {
    return { allowed: true, invite }
  }

  // Institution role check
  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role, status')
    .eq('institution_id', institutionId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return { allowed: false, reason: 'not_member' }
  }

  if (!['institution_admin', 'program_manager'].includes(membership.role)) {
    return { allowed: false, reason: 'insufficient_role' }
  }

  return { allowed: true, invite }
}

/**
 * DELETE /api/cohorts/[id]/invites/[inviteId]
 * Revoke an invite (soft — sets status=REVOKED). Idempotent.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: cohortId, inviteId } = await params

    // Auth
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Rate limit
    const rl = rateLimit(`invites_revoke:${user.id}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests — slow down')
        : ApiErrors.badRequest('Too many requests')
    }

    // Authz + existence
    const access = await canRevokeInvite(user.id, inviteId, cohortId)
    if (!access.allowed) {
      if (access.reason === 'not_found') return ApiErrors.notFound('Invite not found')
      return ApiErrors.forbidden('Only institution admins and program managers can revoke invites')
    }

    const existing = access.invite

    // Idempotent: if already revoked, return current state (not an error)
    if (existing.status === 'REVOKED') {
      return apiSuccess({
        revoked: true,
        already_revoked: true,
        revoked_at: existing.revoked_at,
        revoked_by: existing.revoked_by,
        reason: existing.revoke_reason,
      })
    }

    // Parse body (reason is optional)
    let reason: string | undefined
    try {
      const body = await request.json().catch(() => ({}))
      const validation = validateBody(revokeInviteSchema, body)
      if (!validation.success) return validation.error
      reason = validation.data.reason
    } catch {
      // No body provided — fine, reason stays undefined
    }

    // Perform revoke — single atomic update
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('cohort_invites')
      .update({
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: reason || null,
      })
      .eq('id', inviteId)
      .select()
      .single()

    if (updateError) {
      console.error('Error revoking invite:', updateError)
      return ApiErrors.internal('Failed to revoke invite')
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'cohort_invite.revoked',
      entity_type: 'cohort_invite',
      entity_id: inviteId,
      before: { status: existing.status },
      after: {
        status: 'REVOKED',
        reason: reason || null,
      },
    })

    return apiSuccess({
      revoked: true,
      already_revoked: false,
      revoked_at: updated.revoked_at,
      revoked_by: updated.revoked_by,
      reason: updated.revoke_reason,
    })
  } catch (error) {
    console.error('Invite DELETE error:', error)
    return ApiErrors.internal()
  }
}