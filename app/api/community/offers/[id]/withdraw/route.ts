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

// POST /api/community/offers/[id]/withdraw
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

    // Fetch the offer
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from('community_offers')
      .select('*')
      .eq('id', offerId)
      .single()

    if (fetchError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Verify the current user is the mentor who made the offer
    if (offer.mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the mentor can withdraw their offer' },
        { status: 403 }
      )
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot withdraw an offer that has been ${offer.status}` },
        { status: 400 }
      )
    }

    // Update offer status
    const { error: updateError } = await supabaseAdmin
      .from('community_offers')
      .update({ status: 'withdrawn' })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error withdrawing offer:', updateError)
      return NextResponse.json(
        { error: 'Failed to withdraw offer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Offer withdrawn'
    })
  } catch (error) {
    console.error('Error in withdraw offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}