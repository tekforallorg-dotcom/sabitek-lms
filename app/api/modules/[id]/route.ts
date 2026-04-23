import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { updateModuleSchema } from '@/lib/validations/module'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function canManageCourse(userId: string, courseId: string): Promise<boolean> {
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) return false
  if (course.instructor_id === userId) return true

  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()

  return !!(userProfile?.is_super_admin || userProfile?.platform_role)
}

/**
 * PATCH /api/modules/[id]
 * Update module title, description, or order_index.
 */
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

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return ApiErrors.notFound('Module not found')

    const allowed = await canManageCourse(user.id, existing.course_id)
    if (!allowed) return ApiErrors.forbidden('Only the course owner can update this module')

    const body = await request.json()
    const validation = validateBody(updateModuleSchema, body)
    if (!validation.success) return validation.error

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (validation.data.title !== undefined) updatePayload.title = validation.data.title
    if (validation.data.description !== undefined) {
      updatePayload.description = validation.data.description || null
    }
    if (validation.data.order_index !== undefined) {
      updatePayload.order_index = validation.data.order_index
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('modules')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating module:', updateError)
      return ApiErrors.internal('Failed to update module')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'module.updated',
      entity_type: 'module',
      entity_id: id,
      before: existing,
      after: updated,
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Module PATCH error:', error)
    return ApiErrors.internal()
  }
}

/**
 * DELETE /api/modules/[id]
 * Delete module. Refuses if module has lessons attached.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return ApiErrors.notFound('Module not found')

    const allowed = await canManageCourse(user.id, existing.course_id)
    if (!allowed) return ApiErrors.forbidden('Only the course owner can delete this module')

    // Refuse if module has lessons — caller must move/delete them first
    const { count: lessonCount } = await supabaseAdmin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', id)

    if (lessonCount && lessonCount > 0) {
      return ApiErrors.badRequest(
        `Cannot delete module with ${lessonCount} lesson(s). Move or delete the lessons first.`
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting module:', deleteError)
      return ApiErrors.internal('Failed to delete module')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'module.deleted',
      entity_type: 'module',
      entity_id: id,
      before: existing,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error('Module DELETE error:', error)
    return ApiErrors.internal()
  }
}