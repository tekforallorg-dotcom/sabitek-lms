import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/community/reviews - Get reviews for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const sessionId = searchParams.get('session_id')

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        session:sessions(
          id,
          skill:skills(id, name)
        )
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('reviewee_id', userId)
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate average rating if filtering by user
    let averageRating = null
    if (userId && reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
      averageRating = Math.round((sum / reviews.length) * 10) / 10
    }

    return NextResponse.json({
      reviews: reviews || [],
      average_rating: averageRating,
      total_reviews: reviews?.length || 0
    })
  } catch (error) {
    console.error('Error in reviews GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/community/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, rating, comment } = body

    // Validation
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user is participant
    if (session.learner_id !== user.id && session.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to review this session' }, { status: 403 })
    }

    // Session must be completed
    if (session.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed sessions' }, { status: 400 })
    }

    // Determine reviewee (the other person)
    const revieweeId = session.learner_id === user.id ? session.mentor_id : session.learner_id

    // Check if already reviewed
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('session_id', session_id)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this session' }, { status: 400 })
    }

    // Create review
    const { data: review, error: createError } = await supabaseAdmin
      .from('reviews')
      .insert({
        session_id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: Math.round(rating),
        comment: comment?.trim() || null
      })
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error creating review:', createError)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Update mentor_profiles average rating if reviewee is a mentor
    const { data: mentorProfile } = await supabaseAdmin
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', revieweeId)
      .single()

    if (mentorProfile) {
      // Calculate new average
      const { data: allReviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', revieweeId)

      if (allReviews && allReviews.length > 0) {
        const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length

        await supabaseAdmin
          .from('mentor_profiles')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            reviews_count: allReviews.length
          })
          .eq('user_id', revieweeId)
      }
    }

    // Notify the reviewee
    const { data: reviewer } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: revieweeId,
        type: 'review_received',
        entity_id: review.id,
        entity_type: 'review',
        title: 'New Review',
        body: `${reviewer?.full_name || 'Someone'} left you a ${rating}-star review!`,
        is_read: false
      })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error in reviews POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}