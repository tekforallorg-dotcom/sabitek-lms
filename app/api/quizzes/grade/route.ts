import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
 * Server-side quiz grading. The browser never sees correct answers before
 * submission and cannot assert `passed` - the score, pass verdict, and the
 * quiz_attempts row (which drives lesson gating and certificates) are all
 * computed and written here with the service role.
 */
export async function POST(request: NextRequest) {
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
    const userId = userData.user.id

    const body = await request.json()
    const { lessonId, answers } = body as { lessonId?: string; answers?: Record<string, number> }
    if (!lessonId || !answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'lessonId and answers required' }, { status: 400 })
    }

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, course_id')
      .eq('id', lessonId)
      .single()
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const { data: quizRow } = await supabaseAdmin
      .from('quizzes')
      .select('id, pass_percentage, questions')
      .eq('lesson_id', lessonId)
      .single()
    const questions = parseQuestions(quizRow?.questions)
    if (!quizRow || questions.length === 0) {
      return NextResponse.json({ error: 'No quiz for this lesson' }, { status: 404 })
    }

    // Every question must be answered
    const unanswered = questions.filter((q: any, i: number) => {
      const qid = q.id || `q-${i}`
      return typeof answers[qid] !== 'number'
    })
    if (unanswered.length > 0) {
      return NextResponse.json(
        { error: `Answer all questions (${unanswered.length} missing)` },
        { status: 400 }
      )
    }

    // Grade
    let correctCount = 0
    const results = questions.map((q: any, i: number) => {
      const qid = q.id || `q-${i}`
      const selected = answers[qid]
      const isCorrect = selected === q.correct_answer
      if (isCorrect) correctCount++
      return {
        question_id: qid,
        selected_answer: selected,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        explanation: q.explanation || null,
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= (quizRow.pass_percentage ?? 70)

    const { error: insertError } = await supabaseAdmin.from('quiz_attempts').insert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      score_percentage: score,
      passed,
      answers: results,
    })
    if (insertError) {
      console.error('quiz attempt insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
    }

    return NextResponse.json({
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      results,
    })
  } catch (error) {
    console.error('quiz grade error:', error)
    return NextResponse.json({ error: 'Failed to grade quiz' }, { status: 500 })
  }
}
