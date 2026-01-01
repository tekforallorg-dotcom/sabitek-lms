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

// POST /api/community/session-requests/[id]/decline
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

    // Optionally get decline reason from body
    let declineReason = null
    try {
      const body = await request.json()
      declineReason = body.reason
    } catch {
      // No body provided, that's fine
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
        { error: 'Only the mentor can decline this request' },
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
      .update({ status: 'declined' })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error declining session request:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline session request' },
        { status: 500 }
      )
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
        type: 'session_request_declined',
        entity_id: requestId,
        entity_type: 'session_request',
        title: 'Session Request Declined',
        body: declineReason 
          ? `${mentor?.full_name || 'The mentor'} has declined your request: "${declineReason}"`
          : `${mentor?.full_name || 'The mentor'} has declined your session request.`,
        is_read: false
      })

    return NextResponse.json({
      message: 'Session request declined'
    })
  } catch (error) {
    console.error('Error in decline session request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}