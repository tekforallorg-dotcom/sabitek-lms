import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Server-side certificate issuance.
 *
 * Replaces the old client-side insert: the browser could previously write
 * any grade/course directly to `certificates`. This route re-verifies the
 * completion requirements with the service role before issuing:
 *   1. course exists and is published
 *   2. no certificate already exists for (user, course)
 *   3. every lesson of the course is completed (user_progress.completed_at)
 *   4. if the course has quizzes: at least one passed attempt and an
 *      average passed score of >= 70%
 *
 * Responses use stable `code` values the client maps to its modals.
 */
export async function POST(request: NextRequest) {
  // Authenticate the caller from the bearer token.
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const courseId = typeof body.course_id === 'string' ? body.course_id : null
  if (!courseId) {
    return NextResponse.json({ code: 'invalid_request' }, { status: 400 })
  }

  // Course must exist and be published.
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, status')
    .eq('id', courseId)
    .single()

  if (courseError || !course || course.status !== 'published') {
    return NextResponse.json({ code: 'course_not_found' }, { status: 404 })
  }

  // Already issued?
  const { data: existingCert } = await supabaseAdmin
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  if (existingCert) {
    return NextResponse.json({ code: 'already_exists', certificate_id: existingCert.id })
  }

  // All lessons completed?
  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('course_id', course.id)

  if (lessonsError || !lessons || lessons.length === 0) {
    return NextResponse.json({ code: 'course_not_found' }, { status: 404 })
  }

  const lessonIds = lessons.map((l) => l.id)

  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .not('completed_at', 'is', null)

  const completedIds = new Set((progress || []).map((p) => p.lesson_id))
  const completedCount = lessonIds.filter((id) => completedIds.has(id)).length

  if (completedCount < lessonIds.length) {
    return NextResponse.json({
      code: 'incomplete_lessons',
      completed: completedCount,
      total: lessonIds.length,
    })
  }

  // Quiz requirements (mirrors the previous client logic).
  const { data: courseQuizzes } = await supabaseAdmin
    .from('quizzes')
    .select('id')
    .in('lesson_id', lessonIds)

  let avgScore = 100

  if (courseQuizzes && courseQuizzes.length > 0) {
    const { data: quizAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score_percentage, passed')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .eq('passed', true)

    if (!quizAttempts || quizAttempts.length === 0) {
      return NextResponse.json({ code: 'quizzes_required' })
    }

    avgScore = Math.round(
      quizAttempts.reduce((sum, attempt) => sum + (attempt.score_percentage || 0), 0) /
        quizAttempts.length
    )

    if (avgScore < 70) {
      return NextResponse.json({ code: 'score_too_low', avg_score: avgScore })
    }
  }

  // Issue.
  const courseAbbrev = course.title
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 5)
  const certificateNumber = `SABITEK-${courseAbbrev}-${Date.now()}`
  const now = new Date().toISOString()

  const { data: newCert, error: certError } = await supabaseAdmin
    .from('certificates')
    .insert({
      user_id: user.id,
      course_id: course.id,
      certificate_number: certificateNumber,
      grade_percentage: avgScore,
      issued_at: now,
      completion_date: now,
    })
    .select()
    .single()

  if (certError) {
    console.error('Certificate issuance error:', certError)
    return NextResponse.json({ code: 'issuance_failed' }, { status: 500 })
  }

  await supabaseAdmin
    .from('course_enrollments')
    .update({ progress_percentage: 100, completed_at: now })
    .eq('user_id', user.id)
    .eq('course_id', course.id)

  return NextResponse.json({ code: 'issued', certificate: newCert })
}
