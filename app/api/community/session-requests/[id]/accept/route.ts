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

// POST /api/community/session-requests/[id]/accept
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requestId } = await params

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Fetch the session request
    const { data: sessionRequest, error: fetchError } = await supabaseAdmin
      .from('session_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !sessionRequest) {
      return NextResponse.json(
        { error: 'Session request not found' },
        { status: 404 }
      )
    }

    // Verify the current user is the mentor
    if (sessionRequest.mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the mentor can accept this request' },
        { status: 403 }
      )
    }

    // Check if request is still pending
    if (sessionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${sessionRequest.status}` },
        { status: 400 }
      )
    }

    // Update session request status
    const { error: updateError } = await supabaseAdmin
      .from('session_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error accepting session request:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept session request' },
        { status: 500 }
      )
    }

    // Create a session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        learner_id: sessionRequest.learner_id,
        mentor_id: sessionRequest.mentor_id,
        session_request_id: requestId,
        status: 'proposed'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      // Don't fail the whole request, session can be created later
    }

    // Create a thread for messaging
    let thread = null
    if (session) {
      const { data: newThread, error: threadError } = await supabaseAdmin
        .from('threads')
        .insert({
          session_id: session.id,
          context: 'session_request'
        })
        .select()
        .single()

      if (!threadError && newThread) {
        thread = newThread

        // Add participants to thread
        await supabaseAdmin
          .from('thread_participants')
          .insert([
            { thread_id: newThread.id, user_id: sessionRequest.learner_id, role: 'learner' },
            { thread_id: newThread.id, user_id: sessionRequest.mentor_id, role: 'mentor' }
          ])

        // Add system message
        await supabaseAdmin
          .from('messages')
          .insert({
            thread_id: newThread.id,
            sender_id: user.id,
            content: 'Session request accepted. You can now chat and schedule your session.',
            content_type: 'system'
          })
      }
    }

    // Get mentor info for notification
    const { data: mentor } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Create notification for learner
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: sessionRequest.learner_id,
        type: 'session_request_accepted',
        entity_id: session?.id || requestId,
        entity_type: session ? 'session' : 'session_request',
        title: 'Session Request Accepted',
        body: `${mentor?.full_name || 'Your mentor'} has accepted your session request.`,
        is_read: false
      })

    return NextResponse.json({
      message: 'Session request accepted',
      session: session,
      thread: thread
    })
  } catch (error) {
    console.error('Error in accept session request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}