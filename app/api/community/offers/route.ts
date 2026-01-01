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

// GET /api/community/offers - Get offers
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')
    const role = searchParams.get('role') || 'all' // 'mentor', 'learner', 'all'

    let query = supabaseAdmin
      .from('community_offers')
      .select(`
        *,
        mentor:users!community_offers_mentor_id_fkey(id, full_name, email, avatar_url),
        request:requests!community_offers_request_id_fkey(
          id, title, description, user_id, skill_id, status,
          skill:skills(id, name, slug)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by specific request
    if (requestId) {
      query = query.eq('request_id', requestId)
    }

    // Filter by role - mentor's offers
    if (role === 'mentor') {
      query = query.eq('mentor_id', user.id)
    }

    const { data: offers, error } = await query

    if (error) {
      console.error('Error fetching offers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      )
    }

    // Filter for learner role (offers on my requests)
    let filteredOffers = offers || []
    if (role === 'learner') {
      filteredOffers = filteredOffers.filter(
        (offer) => offer.request?.user_id === user.id
      )
    }

    return NextResponse.json({ offers: filteredOffers })
  } catch (error) {
    console.error('Error in offers GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/community/offers - Create an offer
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id, message, proposed_rate_ngn } = body

    // Validation
    if (!request_id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Check if the learning request exists and is open
    const { data: learningRequest, error: requestError } = await supabaseAdmin
      .from('requests')
      .select('id, user_id, status, title')
      .eq('id', request_id)
      .single()

    if (requestError || !learningRequest) {
      return NextResponse.json(
        { error: 'Learning request not found' },
        { status: 404 }
      )
    }

    if (learningRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'This request is no longer accepting offers' },
        { status: 400 }
      )
    }

    // Can't offer help on your own request
    if (learningRequest.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot offer help on your own request' },
        { status: 400 }
      )
    }

    // Check if already offered
    const { data: existingOffer } = await supabaseAdmin
      .from('community_offers')
      .select('id')
      .eq('request_id', request_id)
      .eq('mentor_id', user.id)
      .single()

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You have already offered help on this request' },
        { status: 400 }
      )
    }

    // Check if blocked
    const { data: blocks } = await supabaseAdmin
      .from('blocks')
      .select('id')
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)

    const isBlocked = blocks?.some(
      (b: { id: string }) => b.id // Just checking if any blocks exist involving these users
    )

    // More precise block check
    const { data: blockCheck } = await supabaseAdmin
      .from('blocks')
      .select('id')
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${learningRequest.user_id}),and(blocker_id.eq.${learningRequest.user_id},blocked_id.eq.${user.id})`
      )

    if (blockCheck && blockCheck.length > 0) {
      return NextResponse.json(
        { error: 'Unable to offer help on this request' },
        { status: 400 }
      )
    }

    // Create the offer
    const { data: offer, error: createError } = await supabaseAdmin
      .from('community_offers')
      .insert({
        request_id,
        mentor_id: user.id,
        message: message || null,
        proposed_rate_ngn: proposed_rate_ngn || null,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating offer:', createError)
      return NextResponse.json(
        { error: 'Failed to create offer' },
        { status: 500 }
      )
    }

    // Update offers_count on the request
    const { data: currentRequest } = await supabaseAdmin
      .from('requests')
      .select('offers_count')
      .eq('id', request_id)
      .single()

    await supabaseAdmin
      .from('requests')
      .update({ offers_count: (currentRequest?.offers_count || 0) + 1 })
      .eq('id', request_id)

    // Get mentor info for notification
    const { data: mentor } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Create notification for request owner
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: learningRequest.user_id,
        type: 'offer',
        entity_id: offer.id,
        entity_type: 'offer',
        title: 'New Help Offer',
        body: `${mentor?.full_name || 'Someone'} offered to help with "${learningRequest.title}"`,
        is_read: false
      })

    return NextResponse.json(
      {
        message: 'Offer sent successfully',
        offer
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in offers POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}