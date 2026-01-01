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

// POST /api/community/sessions/[id]/complete - Mark session as complete
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

    // Optional notes from body
    let notes = null
    try {
      const body = await request.json()
      notes = body.notes
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
        { error: 'Not authorized to complete this session' },
        { status: 403 }
      )
    }

    // Check session status
    if (session.status !== 'scheduled' && session.status !== 'proposed') {
      return NextResponse.json(
        { error: `Cannot complete a session with status: ${session.status}` },
        { status: 400 }
      )
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || session.notes
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error completing session:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      )
    }

    // Get completer info
    const { data: completer } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Notify the other participant to leave a review
    const otherUserId = session.learner_id === user.id ? session.mentor_id : session.learner_id

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: otherUserId,
        type: 'review_prompt',
        entity_id: sessionId,
        entity_type: 'session',
        title: 'Session Completed',
        body: `Your session with ${completer?.full_name || 'your partner'} has been marked as complete. Leave a review!`,
        is_read: false
      })

    // Also notify the user who completed
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'review_prompt',
        entity_id: sessionId,
        entity_type: 'session',
        title: 'Leave a Review',
        body: `Don't forget to leave a review for your session!`,
        is_read: false
      })

    return NextResponse.json({
      message: 'Session marked as complete',
      session: updatedSession
    })
  } catch (error) {
    console.error('Error in complete session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}