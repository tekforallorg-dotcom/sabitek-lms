import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/community/threads/[id] - Get single thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: threadId } = await params

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 })
    }

    // Verify user is participant
    const { data: participation, error: partError } = await supabaseAdmin
      .from('thread_participants')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single()

    if (partError || !participation) {
      return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 })
    }

    // Get thread with session info
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select(`
        *,
        session:sessions(
          id, status, scheduled_start, scheduled_end, meeting_url, meeting_provider,
          learner:users!sessions_learner_id_fkey(id, full_name, email, avatar_url),
          mentor:users!sessions_mentor_id_fkey(id, full_name, email, avatar_url),
          skill:skills(id, name, slug)
        )
      `)
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get other participant
    const otherUser = thread.session?.learner?.id === user.id
      ? thread.session?.mentor
      : thread.session?.learner

    // Update last_read_at
    await supabaseAdmin
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', user.id)

    return NextResponse.json({
      thread: {
        ...thread,
        other_user: otherUser,
        my_role: participation.role
      }
    })
  } catch (error) {
    console.error('Error in thread GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}