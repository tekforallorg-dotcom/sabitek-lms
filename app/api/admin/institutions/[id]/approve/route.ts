import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { approveInstitutionSchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()
  
  return data?.is_super_admin || !!data?.platform_role
}

/**
 * POST /api/admin/institutions/[id]/approve
 * Approve or reject an institution (platform admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authenticate
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // 2. Check platform admin
    if (!(await isPlatformAdmin(user.id))) {
      return ApiErrors.forbidden('Platform admin access required')
    }

    // 3. Validate request body
    const body = await request.json()
    const validation = validateBody(approveInstitutionSchema, body)
    if (!validation.success) return validation.error

    const { status, review_notes, rejection_reason } = validation.data

    // 4. Fetch current institution
    const { data: institution, error: fetchError } = await supabaseAdmin
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !institution) {
      return ApiErrors.notFound('Institution not found')
    }

    // 5. Check if already processed
    if (institution.status !== 'pending') {
      return ApiErrors.conflict(`Institution already ${institution.status}`)
    }

    // 6. Build update object
    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      review_notes: review_notes || null,
      updated_at: new Date().toISOString(),
    }

    if (status === 'approved') {
      updateData.verified_at = new Date().toISOString()
      updateData.rejection_reason = null
    } else if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason || null
      updateData.verified_at = null
    }

    // 7. Update institution
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('institutions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        creator:users!created_by(id, full_name, email),
        reviewer:users!reviewed_by(id, full_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Error updating institution:', updateError)
      return ApiErrors.internal('Failed to update institution')
    }

    // 8. Log audit
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: status === 'approved' ? 'institution.approved' : 'institution.rejected',
      entity_type: 'institution',
      entity_id: id,
      before: { status: institution.status },
      after: { status, review_notes, rejection_reason },
      reason: review_notes || rejection_reason || null,
    })

    // TODO: Send email notification to institution creator

    return apiSuccess({
      ...updated,
      message: `Institution ${status} successfully`,
    })

  } catch (error) {
    console.error('Admin institution approve error:', error)
    return ApiErrors.internal()
  }
}