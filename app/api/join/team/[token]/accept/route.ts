import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Accept an institution team invite (authenticated).
 * Creates/activates the institution_members row with the invite's role.
 * Instructor invites also upgrade users.role so the instructor
 * dashboard and course builder unlock.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: inviteToken } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return ApiErrors.unauthorized()

    const { data: invite } = await supabaseAdmin
      .from('institution_invites')
      .select('*, institution:institutions(name)')
      .eq('token', inviteToken)
      .single()

    if (!invite) return ApiErrors.notFound('Invite not found')
    if (invite.status !== 'ACTIVE') return ApiErrors.conflict('This invite is no longer active')
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return ApiErrors.conflict('This invite has expired')
    }
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return ApiErrors.conflict('This invite has been fully used')
    }

    // Existing membership: activate/upgrade instead of duplicating.
    const { data: existing } = await supabaseAdmin
      .from('institution_members')
      .select('id, status, role')
      .eq('institution_id', invite.institution_id)
      .eq('user_id', user.id)
      .single()

    let memberId: string

    if (existing) {
      if (existing.status === 'active' && existing.role === invite.role) {
        return apiSuccess({ joined: true, already_member: true, role: existing.role })
      }
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('institution_members')
        .update({ status: 'active', role: invite.role, accepted_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (updateError || !updated) {
        console.error('Member update error:', updateError)
        return ApiErrors.internal('Failed to join')
      }
      memberId = updated.id
    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('institution_members')
        .insert({
          institution_id: invite.institution_id,
          user_id: user.id,
          role: invite.role,
          status: 'active',
          invited_by: invite.created_by,
          invited_at: invite.created_at,
          accepted_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (insertError || !inserted) {
        console.error('Member insert error:', insertError)
        return ApiErrors.internal('Failed to join')
      }
      memberId = inserted.id
    }

    // Instructor invites unlock the platform instructor experience.
    if (invite.role === 'instructor') {
      await supabaseAdmin
        .from('users')
        .update({ role: 'instructor' })
        .eq('id', user.id)
        .eq('role', 'learner') // never downgrade admins etc.
    }

    // Count the use; exhaust when the cap is reached.
    const newUseCount = (invite.use_count || 0) + 1
    await supabaseAdmin
      .from('institution_invites')
      .update({
        use_count: newUseCount,
        ...(invite.max_uses !== null && newUseCount >= invite.max_uses
          ? { status: 'EXHAUSTED' }
          : {}),
      })
      .eq('id', invite.id)

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution_invite.accepted',
      entity_type: 'institution_member',
      entity_id: memberId,
      after: { institution_id: invite.institution_id, role: invite.role },
    })

    const institution = Array.isArray(invite.institution) ? invite.institution[0] : invite.institution

    return apiSuccess({
      joined: true,
      role: invite.role,
      institution_name: institution?.name || 'Institution',
      next_route:
        invite.role === 'instructor'
          ? '/instructor'
          : invite.role === 'viewer'
          ? '/institution/reports'
          : '/institution/dashboard',
    })
  } catch (error) {
    console.error('Team invite accept error:', error)
    return ApiErrors.internal()
  }
}
