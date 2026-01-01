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

// GET /api/community/threads - Get user's threads
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get threads where user is a participant
    const { data: participations, error: partError } = await supabaseAdmin
      .from('thread_participants')
      .select('thread_id, role, last_read_at')
      .eq('user_id', user.id)

    if (partError) {
      console.error('Error fetching participations:', partError)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ threads: [] })
    }

    const threadIds = participations.map(p => p.thread_id)

    // Get threads with session info
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from('threads')
      .select(`
        *,
        session:sessions(
          id, status, scheduled_start,
          learner:users!sessions_learner_id_fkey(id, full_name, avatar_url),
          mentor:users!sessions_mentor_id_fkey(id, full_name, avatar_url),
          skill:skills(id, name)
        )
      `)
      .in('id', threadIds)
      .order('updated_at', { ascending: false })

    if (threadsError) {
      console.error('Error fetching threads:', threadsError)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    // Get last message for each thread
    const threadsWithDetails = await Promise.all(
      (threads || []).map(async (thread) => {
        // Get last message
        const { data: lastMessage } = await supabaseAdmin
          .from('messages')
          .select('id, content, content_type, sender_id, created_at')
          .eq('thread_id', thread.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const participation = participations.find(p => p.thread_id === thread.id)
        const lastReadAt = participation?.last_read_at || new Date(0).toISOString()

        const { count: unreadCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .eq('is_deleted', false)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadAt)

        // Determine the other participant
        const otherUser = thread.session?.learner?.id === user.id
          ? thread.session?.mentor
          : thread.session?.learner

        return {
          ...thread,
          last_message: lastMessage || null,
          unread_count: unreadCount || 0,
          other_user: otherUser,
          my_role: participation?.role
        }
      })
    )

    // Sort by last message or updated_at
    threadsWithDetails.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.updated_at
      const bTime = b.last_message?.created_at || b.updated_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return NextResponse.json({ threads: threadsWithDetails })
  } catch (error) {
    console.error('Error in threads GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}