import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCourseContent } from '@/lib/access/course-tenancy'
import { getSanitizedLessonQuiz } from '@/lib/quizzes/sanitize'

/**
 * Sanitized quiz delivery: learners get questions WITHOUT correct answers
 * or explanations (those come back from /api/quizzes/grade after
 * submission). Also returns which lessons in the course carry a real quiz,
 * for sequential gating - so the client never needs to read the quizzes
 * table directly.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')
    if (!lessonId || !courseId) {
      return NextResponse.json({ error: 'lessonId and courseId required' }, { status: 400 })
    }

    if (!(await canAccessCourseContent(userData.user.id, courseId))) {
      return NextResponse.json({ error: 'No access to this course' }, { status: 403 })
    }

    const { quiz, quizLessonIds } = await getSanitizedLessonQuiz(courseId, lessonId)

    return NextResponse.json({ quiz, quizLessonIds })
  } catch (error) {
    console.error('for-lesson quiz error:', error)
    return NextResponse.json({ error: 'Failed to load quiz' }, { status: 500 })
  }
}
