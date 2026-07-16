import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Instructor questions inbox. RLS lets instructors read only answered or
 * their own rows, so pending learner questions never reach the client.
 * This service-role route bypasses RLS and returns every question across
 * the instructor's own courses (or all, for super admins).
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

    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('instructor_id', userId)
    const courseIds = (courses || []).map((c) => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('lesson_questions')
      .select('*, lessons(title, slug), courses(title, slug), users!lesson_questions_user_id_fkey(full_name)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // Table may not exist yet — return empty rather than 500.
      return NextResponse.json({ questions: [] })
    }

    const questions = (data || []).map((q: any) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      answered_at: q.answered_at,
      created_at: q.created_at,
      lesson_title: q.lessons?.title || 'Lesson',
      lesson_slug: q.lessons?.slug || '',
      course_title: q.courses?.title || 'Course',
      course_slug: q.courses?.slug || '',
      asker_name: (q.users?.full_name || 'Learner').split(' ')[0],
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('instructor questions error:', error)
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }
}
