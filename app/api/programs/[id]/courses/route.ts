import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

const addCourseSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  is_required: z.boolean().default(true),
  position: z.number().int().min(0).optional(),
})

const removeCourseSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
})

/**
 * GET /api/programs/[id]/courses
 * Get all courses in a program with full course details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: programId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify program exists and user has access
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, institution_id, visibility')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return ApiErrors.notFound('Program not found')
    }

    // Check access
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership && program.visibility !== 'public') {
      return ApiErrors.forbidden('Not authorized to view this program')
    }

    // Fetch program courses with course details
    const { data: programCourses, error: coursesError } = await supabaseAdmin
      .from('program_courses')
      .select(`
        id,
        course_id,
        position,
        is_required
      `)
      .eq('program_id', programId)
      .order('position', { ascending: true })

    if (coursesError) {
      console.error('Error fetching program courses:', coursesError)
      return ApiErrors.internal('Failed to fetch program courses')
    }

    // Fetch course details separately
    const courseIds = (programCourses || []).map(pc => pc.course_id)
    
    let coursesMap: Record<string, any> = {}
    if (courseIds.length > 0) {
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id, title, slug, cover_image_url, status, is_free, price')
        .in('id', courseIds)

      if (courses) {
        coursesMap = Object.fromEntries(courses.map(c => [c.id, c]))
      }
    }

    // Merge course details into program_courses
    const enrichedCourses = (programCourses || []).map(pc => ({
      ...pc,
      course: coursesMap[pc.course_id] || null,
    }))

    return apiSuccess({ courses: enrichedCourses })

  } catch (error) {
    console.error('Program courses GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/programs/[id]/courses
 * Add a course to a program
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: programId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify program exists
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, institution_id')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return ApiErrors.notFound('Program not found')
    }

    // Check user has permission to manage program
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to manage this program')
    }

    const body = await request.json()
    const { course_id, is_required, position } = addCourseSchema.parse(body)

    // Verify course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status')
      .eq('id', course_id)
      .single()

    if (courseError || !course) {
      return ApiErrors.badRequest('Course not found')
    }

    // Check if course is already in program
    const { data: existing } = await supabaseAdmin
      .from('program_courses')
      .select('id')
      .eq('program_id', programId)
      .eq('course_id', course_id)
      .single()

    if (existing) {
      return ApiErrors.badRequest('Course is already in this program')
    }

    // Get next position if not provided
    let finalPosition = position
    if (finalPosition === undefined) {
      const { data: lastCourse } = await supabaseAdmin
        .from('program_courses')
        .select('position')
        .eq('program_id', programId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      finalPosition = (lastCourse?.position || 0) + 1
    }

    // Insert program_course
    const { data: programCourse, error: insertError } = await supabaseAdmin
      .from('program_courses')
      .insert({
        program_id: programId,
        course_id,
        is_required,
        position: finalPosition,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding course to program:', insertError)
      return ApiErrors.internal('Failed to add course to program')
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'program.course_added',
        entity_type: 'program',
        entity_id: programId,
        new_state: { course_id, course_title: course.title, is_required, position: finalPosition },
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess({
      ...programCourse,
      course,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Invalid input: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Program courses POST error:', error)
    return ApiErrors.internal()
  }
}

/**
 * DELETE /api/programs/[id]/courses
 * Remove a course from a program
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: programId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify program exists
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, institution_id')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return ApiErrors.notFound('Program not found')
    }

    // Check user has permission
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to manage this program')
    }

    const body = await request.json()
    const { course_id } = removeCourseSchema.parse(body)

    // Delete the program_course
    const { error: deleteError } = await supabaseAdmin
      .from('program_courses')
      .delete()
      .eq('program_id', programId)
      .eq('course_id', course_id)

    if (deleteError) {
      console.error('Error removing course from program:', deleteError)
      return ApiErrors.internal('Failed to remove course from program')
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'program.course_removed',
        entity_type: 'program',
        entity_id: programId,
        old_state: { course_id },
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess({ message: 'Course removed from program' })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Invalid input: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Program courses DELETE error:', error)
    return ApiErrors.internal()
  }
}