import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getSanitizedLessonQuiz } from '@/lib/quizzes/sanitize'
import { checkCourseAccess } from '@/lib/course-access'
import { getProgramLockForCourse } from '@/lib/access/program-sequence'

/**
 * GET /api/learner/lesson-data?courseSlug=&lessonSlug=
 *
 * Consolidated lesson-viewer loader. Replaces the 5-stage browser waterfall
 * (course -> [enrollment, lessons, modules, progress] -> [notes, attempts,
 * session] -> access -> quiz) with token-verified, parallel service-role
 * reads returning one payload.
 *
 * Identity comes from the token only. The sanitized quiz is produced by the
 * shared getSanitizedLessonQuiz helper, so correct answers/explanations
 * never enter this payload. Grading still happens in /api/quizzes/grade.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('courseSlug')
    const lessonSlug = searchParams.get('lessonSlug')
    if (!courseSlug || !lessonSlug) {
      return ApiErrors.badRequest('courseSlug and lessonSlug required')
    }

    // Stage 1: resolve the course by slug.
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, slug, instructor_id, instructor:users!courses_instructor_id_fkey(full_name)')
      .eq('slug', courseSlug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found', code: 'course_not_found' }, { status: 404 })
    }

    const isInstructor = course.instructor_id === userId

    // Stage 2: everything that only needs the course id, in parallel.
    const [lessonsRes, modulesRes, enrollmentRes, progressRes, access] = await Promise.all([
      supabaseAdmin.from('lessons').select('*').eq('course_id', course.id).order('lesson_order'),
      supabaseAdmin
        .from('modules')
        .select('id, course_id, title, description, order_index')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true }),
      isInstructor
        ? Promise.resolve({ data: { id: 'instructor' } })
        : supabaseAdmin
            .from('course_enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', course.id)
            .maybeSingle(),
      supabaseAdmin
        .from('user_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .not('completed_at', 'is', null),
      isInstructor ? Promise.resolve(null) : checkCourseAccess(supabaseAdmin, userId, course.id),
    ])

    const lessons = lessonsRes.data || []
    const currentLesson = lessons.find((l) => l.slug === lessonSlug)
    if (!currentLesson) {
      return NextResponse.json({ error: 'Lesson not found', code: 'lesson_not_found' }, { status: 404 })
    }

    const lessonIds = lessons.map((l) => l.id)

    // Stage 3: reads that need the current lesson / full lesson id set.
    const [notesRes, attemptsRes, quizData, programLock] = await Promise.all([
      supabaseAdmin
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('quiz_attempts')
        .select('lesson_id, passed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']),
      getSanitizedLessonQuiz(course.id, currentLesson.id),
      // Program sequencing: mirror /api/courses/[id]/access - only a
      // cohort-sponsored course can be sequence-locked. Instructors bypass.
      !isInstructor && (access as any)?.accessType === 'cohort_sponsored'
        ? getProgramLockForCourse(userId, course.id)
        : Promise.resolve({ locked: false, blocking: null } as Awaited<ReturnType<typeof getProgramLockForCourse>>),
    ])

    const notesData = notesRes.data
    const noteText = notesData
      ? notesData.notes || notesData.content || notesData.note_content || ''
      : ''

    return apiSuccess({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        instructor_id: course.instructor_id,
        instructor: course.instructor,
      },
      isInstructor,
      enrollment: !!enrollmentRes.data,
      lessons,
      modules: modulesRes.data || [],
      completedLessonIds: (progressRes.data || []).map((p) => p.lesson_id),
      notes: notesData ? { id: notesData.id, content: noteText } : null,
      quiz: quizData.quiz,
      quizLessonIds: quizData.quizLessonIds,
      attempts: attemptsRes.data || [],
      programLock: programLock.locked
        ? { title: programLock.blocking?.title || '', slug: programLock.blocking?.slug || '' }
        : null,
    })
  } catch (error) {
    console.error('lesson-data error:', error)
    return ApiErrors.internal('Failed to load lesson')
  }
}
