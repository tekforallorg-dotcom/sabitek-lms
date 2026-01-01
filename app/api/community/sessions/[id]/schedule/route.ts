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

// POST /api/community/sessions/[id]/schedule - Schedule a session
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

    const body = await request.json()
    const { scheduled_start, duration_minutes, meeting_provider, meeting_url } = body

    // Validation
    if (!scheduled_start) {
      return NextResponse.json(
        { error: 'Scheduled start time is required' },
        { status: 400 }
      )
    }

    const startDate = new Date(scheduled_start)
    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule a session in the past' },
        { status: 400 }
      )
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
        { error: 'Not authorized to schedule this session' },
        { status: 403 }
      )
    }

    // Check session status
    if (session.status !== 'proposed' && session.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot schedule a session with status: ${session.status}` },
        { status: 400 }
      )
    }

    // Calculate end time
    const durationMins = duration_minutes || session.duration_minutes || 60
    const endDate = new Date(startDate.getTime() + durationMins * 60000)

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        duration_minutes: durationMins,
        meeting_provider: meeting_provider || session.meeting_provider,
        meeting_url: meeting_url || session.meeting_url,
        status: 'scheduled'
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error scheduling session:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule session' },
        { status: 500 }
      )
    }

    // Get scheduler info
    const { data: scheduler } = await supabaseAdmin
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
        type: 'session_scheduled',
        entity_id: sessionId,
        entity_type: 'session',
        title: 'Session Scheduled',
        body: `${scheduler?.full_name || 'Someone'} scheduled a session for ${startDate.toLocaleDateString('en-NG', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
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
          content: `Session scheduled for ${startDate.toLocaleDateString('en-NG', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}${meeting_url ? `. Meeting link: ${meeting_url}` : ''}`,
          content_type: 'system'
        })
    }

    return NextResponse.json({
      message: 'Session scheduled successfully',
      session: updatedSession
    })
  } catch (error) {
    console.error('Error in schedule session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}