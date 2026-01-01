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

// GET /api/community/threads/[id]/messages
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 })
    }

    // Get thread to verify access via session participants
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, session_id')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check if user is participant via session
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('learner_id, mentor_id')
      .eq('id', thread.session_id)
      .single()

    if (!session || (session.learner_id !== user.id && session.mentor_id !== user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query
    let query = supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Update last_read_at in thread_participants if exists
    await supabaseAdmin
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', user.id)

    const chronologicalMessages = (messages || []).reverse()

    return NextResponse.json({
      messages: chronologicalMessages,
      has_more: messages?.length === limit
    })
  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/community/threads/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: threadId } = await params
    const body = await request.json()
    const { content } = body

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    // Get thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, session_id')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get session to verify access
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('learner_id, mentor_id')
      .eq('id', thread.session_id)
      .single()

    if (!session || (session.learner_id !== user.id && session.mentor_id !== user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const otherUserId = session.learner_id === user.id ? session.mentor_id : session.learner_id

    // Check if blocked
    const { data: block } = await supabaseAdmin
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)

    if (block && block.length > 0) {
      return NextResponse.json({ error: 'Unable to send message' }, { status: 403 })
    }

    // Create message
    const { data: message, error: createError } = await supabaseAdmin
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content: content.trim(),
        content_type: 'text'
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating message:', createError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update thread updated_at
    await supabaseAdmin
      .from('threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    // Create notification for other participant
    const { data: sender } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'message',
        entity_id: threadId,
        entity_type: 'thread',
        title: 'New Message',
        body: `${sender?.full_name || 'Someone'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        is_read: false
      })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error in messages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}