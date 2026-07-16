import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * When an instructor edits a lesson, cached AI outputs derived from the
 * OLD content (Q&A cache, stored summary) must not keep serving.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (!userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lessonId } = (await request.json()) as { lessonId?: string }
    if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, courses(instructor_id)')
      .eq('id', lessonId)
      .single()
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    if ((lesson as any).courses?.instructor_id !== userData.user.id) {
      const { data: me } = await supabaseAdmin
        .from('users')
        .select('is_super_admin')
        .eq('id', userData.user.id)
        .single()
      if (!me?.is_super_admin) return NextResponse.json({ error: 'Not your lesson' }, { status: 403 })
    }

    await Promise.all([
      supabaseAdmin.from('qa_cache').delete().eq('lesson_id', lessonId),
      supabaseAdmin.from('lesson_summaries').delete().eq('lesson_id', lessonId),
    ])
    return NextResponse.json({ invalidated: true })
  } catch (error) {
    console.error('invalidate error:', error)
    return NextResponse.json({ error: 'Failed to invalidate' }, { status: 500 })
  }
}
