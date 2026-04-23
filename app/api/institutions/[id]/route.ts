import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { updateInstitutionSchema } from '@/lib/validations/institution'
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
    const { id } = await params
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let query = supabaseAdmin
      .from('institutions')
      .select('*, creator:users!created_by(id, full_name, email)')

    if (isUuid) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }

    const { data: institution, error } = await query.single()

    if (error || !institution) return ApiErrors.notFound('Institution not found')

    const token = extractBearerToken(request.headers.get('authorization'))
    
    if (institution.status !== 'approved') {
      if (!token) return ApiErrors.notFound('Institution not found')

      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) return ApiErrors.notFound('Institution not found')

      if (institution.created_by === user.id) return apiSuccess(institution)

      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('is_super_admin, platform_role')
        .eq('id', user.id)
        .single()

      if (!userProfile?.is_super_admin && !userProfile?.platform_role) {
        return ApiErrors.notFound('Institution not found')
      }
    }

    return apiSuccess(institution)
  } catch (error) {
    console.error('Institution GET error:', error)
    return ApiErrors.internal()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    const { data: institution, error: fetchError } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !institution) return ApiErrors.notFound('Institution not found')

    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role, status')
      .eq('institution_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('is_super_admin, platform_role')
      .eq('id', user.id)
      .single()

    const isInstitutionAdmin = membership?.role === 'institution_admin'
    const isPlatformAdmin = userProfile?.is_super_admin || !!userProfile?.platform_role

    if (!isInstitutionAdmin && !isPlatformAdmin) {
      return ApiErrors.forbidden('Only institution admins can update this institution')
    }

    const body = await request.json()
    const validation = validateBody(updateInstitutionSchema, body)
    if (!validation.success) return validation.error

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('institutions')
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating institution:', updateError)
      return ApiErrors.internal('Failed to update institution')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution.updated',
      entity_type: 'institution',
      entity_id: id,
      before: institution,
      after: updated,
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Institution PATCH error:', error)
    return ApiErrors.internal()
  }
}