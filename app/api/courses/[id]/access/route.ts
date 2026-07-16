import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getProgramLockForCourse } from '@/lib/access/program-sequence'
import { checkCourseAccess } from '@/lib/course-access'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/courses/[id]/access
 * Check if the current user has access to a course.
 *
 * Returns:
 * {
 *   hasAccess: boolean,
 *   accessType: 'free' | 'purchased' | 'cohort_sponsored' | 'none',
 *   cohort?: { id, name, programId, programName }  // if cohort_sponsored
 * }
 *
 * Anonymous users: only returns hasAccess=true if course is free
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params

    // Validate courseId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(courseId)) {
      return ApiErrors.badRequest('Invalid course ID')
    }

    // Check if course exists and get basic info
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, is_free, price, status')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return ApiErrors.notFound('Course not found')
    }

    // Check if course is published
    if (course.status !== 'published') {
      return ApiErrors.notFound('Course not found')
    }

    // Check for auth token
    const token = extractBearerToken(request.headers.get('authorization'))

    // Anonymous user
    if (!token) {
      const isFree = course.is_free === true || course.price === 0 || course.price === null
      return apiSuccess({
        hasAccess: isFree,
        accessType: isFree ? 'free' : 'none',
      })
    }

    // Authenticated user - verify token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      // Invalid token - treat as anonymous
      const isFree = course.is_free === true || course.price === 0 || course.price === null
      return apiSuccess({
        hasAccess: isFree,
        accessType: isFree ? 'free' : 'none',
      })
    }

    // Full access check for authenticated user
    const result = await checkCourseAccess(supabaseAdmin, user.id, courseId)

    // Program sequencing: a cohort-sponsored course stays locked until the
    // previous required course in the program is complete.
    if ((result as any)?.accessType === 'cohort_sponsored' && token) {
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token)
        if (userData?.user) {
          const lock = await getProgramLockForCourse(userData.user.id, courseId)
          if (lock.locked) {
            return apiSuccess({
              ...result,
              hasAccess: false,
              accessType: 'sequence_locked',
              blocking: lock.blocking,
            })
          }
        }
      } catch {
        // Fail open: never lock learners out on transient errors
      }
    }

    return apiSuccess(result)
  } catch (error: unknown) {
    console.error('Course access check error:', error)
    return ApiErrors.internal()
  }
}