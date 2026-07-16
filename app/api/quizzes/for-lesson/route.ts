import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canAccessCourseContent } from '@/lib/access/course-tenancy'

function parseQuestions(raw: unknown): any[] {
  let qs = raw
  if (typeof qs === 'string') {
    try {
      qs = JSON.parse(qs)
    } catch {
      qs = []
    }
  }
  return Array.isArray(qs) ? qs : []
}

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

    const { data: lessonRows } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
    const lessonIds = (lessonRows || []).map((l) => l.id)

    const { data: quizRows } = await supabaseAdmin
      .from('quizzes')
      .select('id, lesson_id, title, description, pass_percentage, time_limit, questions')
      .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000'])

    const quizLessonIds = (quizRows || [])
      .filter((q) => parseQuestions(q.questions).length > 0)
      .map((q) => q.lesson_id)

    const current = (quizRows || []).find((q) => q.lesson_id === lessonId) || null
    let quiz = null
    if (current) {
      const questions = parseQuestions(current.questions)
      if (questions.length > 0) {
        quiz = {
          id: current.id,
          lesson_id: current.lesson_id,
          title: current.title,
          description: current.description,
          pass_percentage: current.pass_percentage,
          time_limit: current.time_limit,
          questions: questions.map((q: any, i: number) => ({
            id: q.id || `q-${i}`,
            question: q.question,
            options: q.options,
            // correct_answer and explanation deliberately withheld
          })),
        }
      }
    }

    return NextResponse.json({ quiz, quizLessonIds })
  } catch (error) {
    console.error('for-lesson quiz error:', error)
    return NextResponse.json({ error: 'Failed to load quiz' }, { status: 500 })
  }
}
