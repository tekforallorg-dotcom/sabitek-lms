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

// POST /api/community/offers/[id]/accept
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: offerId } = await params

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      )
    }

    // Fetch the offer with request details
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from('community_offers')
      .select(`
        *,
        request:requests!community_offers_request_id_fkey(id, user_id, title, skill_id)
      `)
      .eq('id', offerId)
      .single()

    if (fetchError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Verify the current user owns the request
    if (offer.request?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the request owner can accept offers' },
        { status: 403 }
      )
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: `This offer has already been ${offer.status}` },
        { status: 400 }
      )
    }

    // Update offer status
    const { error: updateError } = await supabaseAdmin
      .from('community_offers')
      .update({ status: 'accepted' })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error accepting offer:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept offer' },
        { status: 500 }
      )
    }

    // Update request status to matched
    await supabaseAdmin
      .from('requests')
      .update({ status: 'matched' })
      .eq('id', offer.request_id)

    // Decline other pending offers on this request
    await supabaseAdmin
      .from('community_offers')
      .update({ status: 'declined' })
      .eq('request_id', offer.request_id)
      .eq('status', 'pending')
      .neq('id', offerId)

    // Create a session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        learner_id: user.id,
        mentor_id: offer.mentor_id,
        offer_id: offerId,
        skill_id: offer.request?.skill_id || null,
        status: 'proposed'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
    }

    // Create a thread for messaging
    let thread = null
    if (session) {
      const { data: newThread, error: threadError } = await supabaseAdmin
        .from('threads')
        .insert({
          session_id: session.id,
          context: 'offer'
        })
        .select()
        .single()

      if (!threadError && newThread) {
        thread = newThread

        // Add participants
        await supabaseAdmin
          .from('thread_participants')
          .insert([
            { thread_id: newThread.id, user_id: user.id, role: 'learner' },
            { thread_id: newThread.id, user_id: offer.mentor_id, role: 'mentor' }
          ])

        // Add system message
        await supabaseAdmin
          .from('messages')
          .insert({
            thread_id: newThread.id,
            sender_id: user.id,
            content: 'Offer accepted. You can now chat and schedule your session.',
            content_type: 'system'
          })
      }
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
        user_id: offer.mentor_id,
        type: 'offer_accepted',
        entity_id: session?.id || offerId,
        entity_type: session ? 'session' : 'offer',
        title: 'Offer Accepted',
        body: `${learner?.full_name || 'Someone'} accepted your offer to help with "${offer.request?.title}"`,
        is_read: false
      })

    return NextResponse.json({
      message: 'Offer accepted',
      session,
      thread
    })
  } catch (error) {
    console.error('Error in accept offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}