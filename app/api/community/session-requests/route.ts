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

// GET /api/community/session-requests - Get user's session requests
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all' // 'learner', 'mentor', 'all'
    const status = searchParams.get('status') // 'pending', 'accepted', etc.

    let query = supabaseAdmin
      .from('session_requests')
      .select(`
        *,
        learner:users!session_requests_learner_id_fkey(id, full_name, email, avatar_url),
        mentor:users!session_requests_mentor_id_fkey(id, full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })

    // Filter by role
    if (role === 'learner') {
      query = query.eq('learner_id', user.id)
    } else if (role === 'mentor') {
      query = query.eq('mentor_id', user.id)
    } else {
      query = query.or(`learner_id.eq.${user.id},mentor_id.eq.${user.id}`)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching session requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch session requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Error in session-requests GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/community/session-requests - Create a new session request
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mentor_id, message } = body

    // Validation
    if (!mentor_id) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      )
    }

    if (mentor_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot send a session request to yourself' },
        { status: 400 }
      )
    }

    // Check if mentor exists and is available
    const { data: mentorProfile } = await supabaseAdmin
      .from('community_profiles')
      .select('user_id, is_available_to_mentor, is_suspended')
      .eq('user_id', mentor_id)
      .single()

    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      )
    }

    if (!mentorProfile.is_available_to_mentor) {
      return NextResponse.json(
        { error: 'This mentor is not currently accepting requests' },
        { status: 400 }
      )
    }

    if (mentorProfile.is_suspended) {
      return NextResponse.json(
        { error: 'This mentor is currently unavailable' },
        { status: 400 }
      )
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('session_requests')
      .select('id')
      .eq('learner_id', user.id)
      .eq('mentor_id', mentor_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request to this mentor' },
        { status: 400 }
      )
    }

    // Check if blocked
    const { data: blockExists } = await supabaseAdmin
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${mentor_id}),and(blocker_id.eq.${mentor_id},blocked_id.eq.${user.id})`)
      .single()

    if (blockExists) {
      return NextResponse.json(
        { error: 'Unable to send request to this mentor' },
        { status: 400 }
      )
    }

    // Create session request
    const { data: sessionRequest, error: createError } = await supabaseAdmin
      .from('session_requests')
      .insert({
        learner_id: user.id,
        mentor_id: mentor_id,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating session request:', createError)
      return NextResponse.json(
        { error: 'Failed to create session request' },
        { status: 500 }
      )
    }

    // Get learner info for notification
    const { data: learner } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Create notification for mentor
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: mentor_id,
        type: 'session_request',
        entity_id: sessionRequest.id,
        entity_type: 'session_request',
        title: 'New Session Request',
        body: `${learner?.full_name || 'Someone'} has requested a mentoring session with you.`,
        is_read: false
      })

    return NextResponse.json(
      { 
        message: 'Session request sent successfully',
        request: sessionRequest 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in session-requests POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}