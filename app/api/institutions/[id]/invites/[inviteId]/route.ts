import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Revoke an institution invite. Admin-only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: institutionId, inviteId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return ApiErrors.unauthorized()

    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role, status')
      .eq('institution_id', institutionId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membership?.role !== 'institution_admin') {
      return ApiErrors.forbidden('Only institution admins can revoke invites')
    }

    const { data: invite, error } = await supabaseAdmin
      .from('institution_invites')
      .update({
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', inviteId)
      .eq('institution_id', institutionId)
      .eq('status', 'ACTIVE')
      .select()
      .single()

    if (error || !invite) {
      return ApiErrors.notFound('Active invite not found')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution_invite.revoked',
      entity_type: 'institution_invite',
      entity_id: invite.id,
    })

    return apiSuccess({ revoked: true })
  } catch (error) {
    console.error('Invite DELETE error:', error)
    return ApiErrors.internal()
  }
}
