import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to get user from Authorization header
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) return null
  return user
}

// POST /api/community/sessions/[id]/cancel - Cancel a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Optional reason from body
    let reason = null
    try {
      const body = await request.json()
      reason = body.reason
    } catch {
      // No body, that's fine
    }

    // Fetch the session
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user is participant
    if (session.learner_id !== user.id && session.mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this session' },
        { status: 403 }
      )
    }

    // Check session status
    if (session.status === 'completed' || session.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot cancel a session with status: ${session.status}` },
        { status: 400 }
      )
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : session.notes
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error cancelling session:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel session' },
        { status: 500 }
      )
    }

    // Get canceller info
    const { data: canceller } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Notify the other participant
    const otherUserId = session.learner_id === user.id ? session.mentor_id : session.learner_id

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'session_scheduled', // Reusing type, could add 'session_cancelled'
        entity_id: sessionId,
        entity_type: 'session',
        title: 'Session Cancelled',
        body: `${canceller?.full_name || 'Someone'} has cancelled the session.${reason ? ` Reason: ${reason}` : ''}`,
        is_read: false
      })

    // Add system message to thread if exists
    const { data: thread } = await supabaseAdmin
      .from('threads')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (thread) {
      await supabaseAdmin
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: user.id,
          content: `Session cancelled${reason ? `: ${reason}` : ''}`,
          content_type: 'system'
        })
    }

    return NextResponse.json({
      message: 'Session cancelled',
      session: updatedSession
    })
  } catch (error) {
    console.error('Error in cancel session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}