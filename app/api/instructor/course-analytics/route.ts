import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildLessonSequence } from '@/lib/lesson-gating'

/**
 * Instructor course analytics: the numbers that tell an instructor what
 * to fix. Roster with per-learner progress, the lesson drop-off funnel,
 * quiz item analysis (which questions fail), and enrollment trend.
 * Instructor-of-the-course or super admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    const courseId = new URL(request.url).searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .single()
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (course.instructor_id !== userId) {
      const { data: me } = await supabaseAdmin.from('users').select('is_super_admin').eq('id', userId).single()
      if (!me?.is_super_admin) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 })
      }
    }

    const [lessonsRes, modulesRes, enrollRes] = await Promise.all([
      supabaseAdmin
        .from('lessons')
        .select('id, title, slug, lesson_order, module_id')
        .eq('course_id', courseId),
      supabaseAdmin
        .from('modules')
        .select('id, course_id, title, description, order_index')
        .eq('course_id', courseId),
      supabaseAdmin
        .from('course_enrollments')
        .select('user_id, created_at, users(full_name, email)')
        .eq('course_id', courseId),
    ])

    const lessons = lessonsRes.data || []
    const sequence = buildLessonSequence(lessons as any, (modulesRes.data || []) as any)
    const lessonIds = sequence.map((l: any) => l.id)
    const enrollments = enrollRes.data || []
    const learnerIds = enrollments.map((e) => e.user_id)

    const [progressRes, attemptsRes, quizRowsRes] = await Promise.all([
      learnerIds.length > 0 && lessonIds.length > 0
        ? supabaseAdmin
            .from('user_progress')
            .select('user_id, lesson_id, completed_at')
            .in('user_id', learnerIds)
            .in('lesson_id', lessonIds)
            .not('completed_at', 'is', null)
        : Promise.resolve({ data: [] as any[] }),
      lessonIds.length > 0
        ? supabaseAdmin
            .from('quiz_attempts')
            .select('user_id, lesson_id, score_percentage, passed, answers')
            .in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as any[] }),
      lessonIds.length > 0
        ? supabaseAdmin
            .from('quizzes')
            .select('lesson_id, pass_percentage, questions')
            .in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const progress = progressRes.data || []
    const attempts = attemptsRes.data || []
    const quizRows = quizRowsRes.data || []

    // ── Roster ──
    const completedByUser = new Map<string, { count: number; last: string | null }>()
    for (const p of progress) {
      const cur = completedByUser.get(p.user_id) || { count: 0, last: null }
      cur.count++
      if (!cur.last || p.completed_at > cur.last) cur.last = p.completed_at
      completedByUser.set(p.user_id, cur)
    }
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    const roster = enrollments
      .map((e: any) => {
        const done = completedByUser.get(e.user_id) || { count: 0, last: null }
        return {
          name: e.users?.full_name || 'Learner',
          enrolled_at: e.created_at,
          lessons_completed: done.count,
          total_lessons: lessonIds.length,
          progress_pct: lessonIds.length > 0 ? Math.round((done.count / lessonIds.length) * 100) : 0,
          last_active: done.last,
          at_risk: done.count < lessonIds.length && (!done.last || new Date(done.last).getTime() < twoWeeksAgo),
        }
      })
      .sort((a, b) => b.progress_pct - a.progress_pct)

    // ── Funnel: completions per lesson in sequence order ──
    const completionsPerLesson = new Map<string, number>()
    for (const p of progress) {
      completionsPerLesson.set(p.lesson_id, (completionsPerLesson.get(p.lesson_id) || 0) + 1)
    }
    const funnel = sequence.map((l: any, i: number) => ({
      lesson_id: l.id,
      title: l.title,
      order: i + 1,
      completions: completionsPerLesson.get(l.id) || 0,
    }))

    // ── Quiz item analysis ──
    const lessonTitle = new Map(sequence.map((l: any) => [l.id, l.title]))
    const quizzes = quizRows
      .map((q: any) => {
        let questions = q.questions
        if (typeof questions === 'string') {
          try { questions = JSON.parse(questions) } catch { questions = [] }
        }
        if (!Array.isArray(questions) || questions.length === 0) return null
        const qAttempts = attempts.filter((a) => a.lesson_id === q.lesson_id)
        if (qAttempts.length === 0) {
          return {
            lesson_id: q.lesson_id,
            lesson_title: lessonTitle.get(q.lesson_id) || '',
            attempts: 0,
            pass_rate: null,
            avg_score: null,
            items: [],
          }
        }
        const stats = new Map<string, { correct: number; total: number }>()
        for (const a of qAttempts) {
          for (const ans of (Array.isArray(a.answers) ? a.answers : []) as any[]) {
            const st = stats.get(ans.question_id) || { correct: 0, total: 0 }
            st.total++
            if (ans.is_correct) st.correct++
            stats.set(ans.question_id, st)
          }
        }
        return {
          lesson_id: q.lesson_id,
          lesson_title: lessonTitle.get(q.lesson_id) || '',
          attempts: qAttempts.length,
          pass_rate: Math.round((qAttempts.filter((a) => a.passed).length / qAttempts.length) * 100),
          avg_score: Math.round(qAttempts.reduce((s, a) => s + (a.score_percentage || 0), 0) / qAttempts.length),
          items: questions.map((question: any, i: number) => {
            const qid = question.id || `q-${i}`
            const st = stats.get(qid)
            return {
              question: question.question,
              answered: st?.total ?? 0,
              correct_rate: st && st.total > 0 ? Math.round((st.correct / st.total) * 100) : null,
            }
          }),
        }
      })
      .filter(Boolean)

    // ── Enrollment trend: last 12 weeks ──
    const weeks: { week: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
      const label = `${start.getMonth() + 1}/${start.getDate()}`
      weeks.push({ week: label, count: 0 })
    }
    for (const e of enrollments) {
      const age = Math.floor((Date.now() - new Date(e.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (age >= 0 && age < 12) weeks[11 - age].count++
    }

    const completedAll = roster.filter((r) => r.lessons_completed >= lessonIds.length && lessonIds.length > 0).length
    const activeWeek = roster.filter(
      (r) => r.last_active && Date.now() - new Date(r.last_active).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length

    return NextResponse.json({
      course_title: course.title,
      summary: {
        enrolled: enrollments.length,
        active_7d: activeWeek,
        completed: completedAll,
        completion_rate: enrollments.length > 0 ? Math.round((completedAll / enrollments.length) * 100) : 0,
        at_risk: roster.filter((r) => r.at_risk).length,
      },
      trend: weeks,
      funnel,
      quizzes,
      roster,
    })
  } catch (error) {
    console.error('course analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
