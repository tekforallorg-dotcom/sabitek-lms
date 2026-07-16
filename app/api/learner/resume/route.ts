import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildLessonSequence } from '@/lib/lesson-gating'

/**
 * "Continue where you left off": the learner's most recently active
 * enrollment and the exact next incomplete lesson in it (module-aware
 * ordering via the same sequence builder the viewer uses).
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

    // Most recent learning activity decides which course to resume
    const { data: recentProgress } = await supabaseAdmin
      .from('user_progress')
      .select('lesson_id, completed_at, lessons(course_id)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    let courseId: string | null = (recentProgress as any)?.lessons?.course_id || null

    // Fall back to the newest enrollment when there's no activity yet
    if (!courseId) {
      const { data: enrollment } = await supabaseAdmin
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      courseId = enrollment?.course_id || null
    }
    if (!courseId) return NextResponse.json({ resume: null })

    const [courseRes, lessonsRes, modulesRes, progressRes] = await Promise.all([
      supabaseAdmin.from('courses').select('id, title, slug, status').eq('id', courseId).single(),
      supabaseAdmin
        .from('lessons')
        .select('id, title, slug, lesson_order, module_id')
        .eq('course_id', courseId),
      supabaseAdmin
        .from('modules')
        .select('id, course_id, title, description, order_index')
        .eq('course_id', courseId),
      supabaseAdmin
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),
    ])

    const course = courseRes.data
    if (!course || course.status !== 'published') return NextResponse.json({ resume: null })

    const completed = new Set((progressRes.data || []).map((p) => p.lesson_id))
    const sequence = buildLessonSequence(
      (lessonsRes.data || []) as any,
      (modulesRes.data || []) as any
    )
    const next = sequence.find((l: any) => !completed.has(l.id))
    if (!next) return NextResponse.json({ resume: null, course_complete: true })

    const doneInCourse = sequence.filter((l: any) => completed.has(l.id)).length

    return NextResponse.json({
      resume: {
        course_title: course.title,
        course_slug: course.slug,
        lesson_title: (next as any).title,
        lesson_slug: (next as any).slug,
        href: `/courses/${course.slug}/lessons/${(next as any).slug}`,
        completed_lessons: doneInCourse,
        total_lessons: sequence.length,
      },
    })
  } catch (error) {
    console.error('resume error:', error)
    return NextResponse.json({ resume: null })
  }
}
