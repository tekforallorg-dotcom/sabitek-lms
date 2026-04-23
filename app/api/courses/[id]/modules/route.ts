import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { createModuleSchema } from '@/lib/validations/module'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Authorization helper:
 * Returns true if the user owns the course or is a platform/institution admin.
 */
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
 * GET /api/courses/[id]/modules
 * List all modules in a course, ordered by order_index.
 * Public for published courses; auth required for drafts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // Verify course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, status, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) return ApiErrors.notFound('Course not found')

    // Auth check for non-published courses
    if (course.status !== 'published') {
      const token = extractBearerToken(request.headers.get('authorization'))
      if (!token) return ApiErrors.notFound('Course not found')

      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (!user) return ApiErrors.notFound('Course not found')

      const allowed = await canManageCourse(user.id, courseId)
      if (!allowed) return ApiErrors.notFound('Course not found')
    }

    // Fetch modules with lesson count
    const { data: modules, error } = await supabaseAdmin
      .from('modules')
      .select(`
        id,
        course_id,
        title,
        description,
        order_index,
        created_at,
        updated_at,
        lessons:lessons(count)
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
      return ApiErrors.internal('Failed to fetch modules')
    }

    // Flatten lesson count
    const enriched = (modules || []).map((m: any) => ({
      ...m,
      lesson_count: m.lessons?.[0]?.count || 0,
      lessons: undefined,
    }))

    return apiSuccess({ modules: enriched })
  } catch (error) {
    console.error('Modules GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/courses/[id]/modules
 * Create a new module. Auto-assigns next order_index.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    const allowed = await canManageCourse(user.id, courseId)
    if (!allowed) return ApiErrors.forbidden('Only the course owner can add modules')

    const body = await request.json()
    const validation = validateBody(createModuleSchema, body)
    if (!validation.success) return validation.error

    const input = validation.data

    // Compute next order_index (max + 1, default to 1)
    const { data: existing } = await supabaseAdmin
      .from('modules')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.order_index ?? 0) + 1

    const { data: module, error: insertError } = await supabaseAdmin
      .from('modules')
      .insert({
        course_id: courseId,
        title: input.title,
        description: input.description || null,
        order_index: nextOrder,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating module:', insertError)
      return ApiErrors.internal('Failed to create module')
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'module.created',
      entity_type: 'module',
      entity_id: module.id,
      after: module,
    })

    return apiSuccess(module, 201)
  } catch (error) {
    console.error('Modules POST error:', error)
    return ApiErrors.internal()
  }
}