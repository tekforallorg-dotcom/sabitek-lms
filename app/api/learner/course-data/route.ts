import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { parseQuizQuestions } from '@/lib/quizzes/sanitize'
import { checkCourseAccess } from '@/lib/course-access'
import { getProgramLockForCourse } from '@/lib/access/program-sequence'

type AccessResult = {
  hasAccess: boolean
  accessType: string
  cohort?: unknown
  blocking?: unknown
}

function anonAccess(course: { is_free: boolean | null; price: number | null }): AccessResult {
  const isFree = course.is_free === true || course.price === 0 || course.price === null
  return { hasAccess: isFree, accessType: isFree ? 'free' : 'none' }
}

/**
 * GET /api/learner/course-data?courseSlug=
 *
 * Consolidated course-detail loader. Verifies the bearer token when present
 * (the course page is reachable anonymously, so a token is optional), then
 * runs course + modules + lessons + enrollment + access + progress + quiz
 * gating in parallel server-side and returns one payload.
 *
 * Identity is derived from the token only. Unpublished courses are only
 * returned to their instructor or a super admin (mirrors RLS visibility).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('courseSlug')
    if (!courseSlug) return ApiErrors.badRequest('courseSlug required')

    // Resolve the viewer (optional - anonymous visitors are allowed).
    const token = extractBearerToken(request.headers.get('authorization'))
    let userId: string | null = null
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      userId = user?.id ?? null
    }

    // Course by slug (full row + instructor for the detail header).
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*, instructor:users!courses_instructor_id_fkey(full_name)')
      .eq('slug', courseSlug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found', code: 'course_not_found' }, { status: 404 })
    }

    // Unpublished courses stay hidden unless the viewer owns them / is admin.
    if (course.status !== 'published') {
      let allowed = false
      if (userId) {
        if (course.instructor_id === userId) {
          allowed = true
        } else {
          const { data: me } = await supabaseAdmin
            .from('users')
            .select('is_super_admin')
            .eq('id', userId)
            .single()
          allowed = !!me?.is_super_admin
        }
      }
      if (!allowed) {
        return NextResponse.json({ error: 'Course not found', code: 'course_not_found' }, { status: 404 })
      }
    }

    // Lessons + modules are needed for everyone (curriculum preview included).
    const [lessonsRes, modulesRes] = await Promise.all([
      supabaseAdmin.from('lessons').select('*').eq('course_id', course.id).order('lesson_order'),
      supabaseAdmin
        .from('modules')
        .select('id, course_id, title, description, order_index')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true }),
    ])

    const lessons = lessonsRes.data || []
    const modules = modulesRes.data || []
    const lessonIds = lessons.map((l) => l.id)

    // Anonymous viewer: public course data + free/none access, nothing personal.
    if (!userId) {
      return apiSuccess({
        course,
        lessons,
        modules,
        isEnrolled: false,
        accessResult: anonAccess(course),
        completedLessonIds: [],
        quizLessonIds: [],
        passedLessonIds: [],
      })
    }

    // Authenticated viewer: enrollment + access + (if enrolled) gating data.
    const [enrollmentRes, accessRaw] = await Promise.all([
      supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .maybeSingle(),
      checkCourseAccess(supabaseAdmin, userId, course.id),
    ])

    // Program sequencing augmentation, identical to /api/courses/[id]/access.
    let accessResult: AccessResult = accessRaw as AccessResult
    if (accessResult?.accessType === 'cohort_sponsored') {
      try {
        const lock = await getProgramLockForCourse(userId, course.id)
        if (lock.locked) {
          accessResult = {
            ...accessResult,
            hasAccess: false,
            accessType: 'sequence_locked',
            blocking: lock.blocking,
          }
        }
      } catch {
        // Fail open: never lock a learner out on transient errors.
      }
    }

    const isEnrolled = !!enrollmentRes.data

    let completedLessonIds: string[] = []
    let quizLessonIds: string[] = []
    let passedLessonIds: string[] = []

    if (isEnrolled && lessonIds.length > 0) {
      const [progressRes, quizzesRes, attemptsRes] = await Promise.all([
        supabaseAdmin
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('course_id', course.id)
          .not('completed_at', 'is', null),
        supabaseAdmin.from('quizzes').select('lesson_id, questions').in('lesson_id', lessonIds),
        supabaseAdmin
          .from('quiz_attempts')
          .select('lesson_id, passed')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds),
      ])

      completedLessonIds = (progressRes.data || []).map((p) => p.lesson_id)
      quizLessonIds = (quizzesRes.data || [])
        .filter((q) => parseQuizQuestions(q.questions).length > 0)
        .map((q) => q.lesson_id)
      passedLessonIds = (attemptsRes.data || [])
        .filter((a) => a.passed === true)
        .map((a) => a.lesson_id)
    }

    return apiSuccess({
      course,
      lessons,
      modules,
      isEnrolled,
      accessResult,
      completedLessonIds,
      quizLessonIds,
      passedLessonIds,
    })
  } catch (error) {
    console.error('course-data error:', error)
    return ApiErrors.internal('Failed to load course')
  }
}
