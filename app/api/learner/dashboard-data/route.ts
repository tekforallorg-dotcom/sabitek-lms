import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getMyCohortsForUser } from '@/lib/cohorts/my-cohorts'

/**
 * GET /api/learner/dashboard-data
 *
 * Consolidated learner-dashboard loader. Verifies the bearer token, then
 * runs every page-level query in parallel server-side (service role) and
 * returns one JSON payload, replacing the browser-side waterfall of
 * enrollments -> courses -> certificates -> cohorts.
 *
 * Identity is derived from the token only; nothing from the query/body is
 * trusted for identity, and the route fails closed.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()
    const userId = user.id

    // Kick off the independent reads together.
    const [enrollmentsRes, certsRes, cohorts] = await Promise.all([
      supabaseAdmin
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false }),
      supabaseAdmin
        .from('certificates')
        .select('*, course:courses(title, cover_image_url)')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })
        .limit(3),
      getMyCohortsForUser(userId).catch((e) => {
        console.error('dashboard-data cohorts error:', e)
        return [] as Awaited<ReturnType<typeof getMyCohortsForUser>>
      }),
    ])

    const enrollments = enrollmentsRes.data || []

    // Fixes the N+1: one .in() query hydrates every enrolled course (with
    // instructor) instead of a per-course fallback loop.
    let enrolledCourses: any[] = []
    const courseIds = enrollments.map((e) => e.course_id).filter(Boolean)
    if (courseIds.length > 0) {
      const { data: courseDetails } = await supabaseAdmin
        .from('courses')
        .select('*, instructor:users!courses_instructor_id_fkey(full_name)')
        .in('id', courseIds)

      const courseMap = new Map((courseDetails || []).map((c) => [c.id, c]))
      enrolledCourses = enrollments
        .map((enrollment) => ({
          ...enrollment,
          course: courseMap.get(enrollment.course_id) || null,
        }))
        .filter((e) => e.course !== null)
    }

    return apiSuccess({
      enrolledCourses,
      certificates: certsRes.data || [],
      cohorts,
    })
  } catch (error) {
    console.error('dashboard-data error:', error)
    return ApiErrors.internal('Failed to load dashboard')
  }
}
