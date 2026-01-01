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

// POST /api/community/offers/[id]/decline
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
        request:requests!community_offers_request_id_fkey(id, user_id, title)
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
        { error: 'Only the request owner can decline offers' },
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
      .update({ status: 'declined' })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error declining offer:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline offer' },
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
        user_id: offer.mentor_id,
        type: 'offer_declined',
        entity_id: offerId,
        entity_type: 'offer',
        title: 'Offer Declined',
        body: `${learner?.full_name || 'Someone'} declined your offer to help with "${offer.request?.title}"`,
        is_read: false
      })

    return NextResponse.json({
      message: 'Offer declined'
    })
  } catch (error) {
    console.error('Error in decline offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}