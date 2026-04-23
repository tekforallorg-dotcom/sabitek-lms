import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { inviteMemberSchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return ApiErrors.unauthorized()

    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role, status')
      .eq('institution_id', institutionId)
      .eq('user_id', user.id)
      .single()

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('is_super_admin, platform_role')
      .eq('id', user.id)
      .single()

    const isPlatformAdmin = userProfile?.is_super_admin || !!userProfile?.platform_role
    const isMember = membership?.status === 'active'

    if (!isMember && !isPlatformAdmin) {
      return ApiErrors.forbidden('Not a member of this institution')
    }

    const { data: members, error, count } = await supabaseAdmin
      .from('institution_members')
      .select('*, user:users!user_id(id, full_name, email, avatar_url)', { count: 'exact' })
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return ApiErrors.internal('Failed to fetch members')
    }

    return apiSuccess({ members: members || [], total: count || 0 })
  } catch (error) {
    console.error('Members GET error:', error)
    return ApiErrors.internal()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params

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
      return ApiErrors.forbidden('Only institution admins can invite members')
    }

    const body = await request.json()
    const validation = validateBody(inviteMemberSchema, body)
    if (!validation.success) return validation.error

    const { email, role } = validation.data

    const { data: invitedUser } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single()

    if (!invitedUser) {
      return ApiErrors.notFound('User not found. They must register first.')
    }

    const { data: existingMember } = await supabaseAdmin
      .from('institution_members')
      .select('id, status')
      .eq('institution_id', institutionId)
      .eq('user_id', invitedUser.id)
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') return ApiErrors.conflict('User is already a member')
      if (existingMember.status === 'invited') return ApiErrors.conflict('User has already been invited')
    }

    const { data: member, error: insertError } = await supabaseAdmin
      .from('institution_members')
      .insert({
        institution_id: institutionId,
        user_id: invitedUser.id,
        role,
        status: 'invited',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select('*, user:users!user_id(id, full_name, email)')
      .single()

    if (insertError) {
      console.error('Error inviting member:', insertError)
      return ApiErrors.internal('Failed to invite member')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution_member.invited',
      entity_type: 'institution_member',
      entity_id: member.id,
      after: { ...member, invited_email: email },
    })

    return apiSuccess(member, 201)
  } catch (error) {
    console.error('Members POST error:', error)
    return ApiErrors.internal()
  }
}