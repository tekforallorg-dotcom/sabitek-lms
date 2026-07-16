import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { notify } from '@/lib/notifications'

/** Instructor answers a lesson question; the asker gets notified. */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (!userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userData.user.id

    const { questionId, answer } = (await request.json()) as { questionId?: string; answer?: string }
    if (!questionId || !answer?.trim()) {
      return NextResponse.json({ error: 'questionId and answer are required' }, { status: 400 })
    }
    if (answer.length > 3000) {
      return NextResponse.json({ error: 'Keep answers under 3000 characters' }, { status: 400 })
    }

    const { data: q } = await supabaseAdmin
      .from('lesson_questions')
      .select('id, user_id, lesson_id, course_id, courses(instructor_id, title, slug), lessons(title, slug)')
      .eq('id', questionId)
      .single()
    if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    if ((q as any).courses?.instructor_id !== userId) {
      const { data: me } = await supabaseAdmin.from('users').select('is_super_admin').eq('id', userId).single()
      if (!me?.is_super_admin) return NextResponse.json({ error: 'Not your course' }, { status: 403 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('lesson_questions')
      .update({ answer: answer.trim(), answered_by: userId, answered_at: new Date().toISOString() })
      .eq('id', questionId)
    if (updateError) {
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }

    notify(q.user_id, {
      type: 'system',
      title: 'Your instructor answered your question',
      body: `On "${(q as any).lessons?.title || 'a lesson'}"`,
      href: `/courses/${(q as any).courses?.slug}/lessons/${(q as any).lessons?.slug}`,
    })

    return NextResponse.json({ answered: true })
  } catch (error) {
    console.error('answer question error:', error)
    return NextResponse.json({ error: 'Failed to answer' }, { status: 500 })
  }
}
