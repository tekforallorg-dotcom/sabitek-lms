import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { reorderModulesSchema } from '@/lib/validations/module'
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
 * POST /api/modules/reorder
 * Bulk reorder modules within a course.
 * Payload: { course_id: uuid, module_ids: uuid[] (in desired order) }
 * Module at position 0 in array becomes order_index=1, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    const body = await request.json()
    const validation = validateBody(reorderModulesSchema, body)
    if (!validation.success) return validation.error

    const { course_id, module_ids } = validation.data

    const allowed = await canManageCourse(user.id, course_id)
    if (!allowed) return ApiErrors.forbidden('Only the course owner can reorder modules')

    // Verify all module_ids belong to this course
    const { data: existingModules, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('id, course_id')
      .in('id', module_ids)

    if (fetchError) {
      return ApiErrors.internal('Failed to validate modules')
    }

    if (!existingModules || existingModules.length !== module_ids.length) {
      return ApiErrors.badRequest('Some module IDs are invalid')
    }

    const allBelongToCourse = existingModules.every(m => m.course_id === course_id)
    if (!allBelongToCourse) {
      return ApiErrors.badRequest('All modules must belong to the same course')
    }

    // Two-phase update to avoid any unique-constraint conflict on (course_id, order_index).
    // Phase 1: park everything at large positive indices (still satisfies `positive_order_index >= 1`).
    const phase1Updates = module_ids.map((id, idx) =>
      supabaseAdmin
        .from('modules')
        .update({ order_index: 10000 + idx, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
    const phase1Results = await Promise.all(phase1Updates)
    const phase1Failed = phase1Results.find(r => r.error)
    if (phase1Failed?.error) {
      console.error('Error reordering modules (phase 1):', phase1Failed.error)
      return ApiErrors.internal('Failed to reorder modules')
    }

    // Phase 2: assign final positions (1-indexed).
    const phase2Updates = module_ids.map((id, idx) =>
      supabaseAdmin
        .from('modules')
        .update({ order_index: idx + 1, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
    const phase2Results = await Promise.all(phase2Updates)
    const phase2Failed = phase2Results.find(r => r.error)
    if (phase2Failed?.error) {
      console.error('Error reordering modules (phase 2):', phase2Failed.error)
      return ApiErrors.internal('Failed to reorder modules')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'module.reordered',
      entity_type: 'course',
      entity_id: course_id,
      after: { module_ids },
    })

    return apiSuccess({ reordered: true, count: module_ids.length })
  } catch (error) {
    console.error('Modules reorder error:', error)
    return ApiErrors.internal()
  }
}