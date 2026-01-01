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

// GET /api/community/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        reviewee:users!reviews_reviewee_id_fkey(id, full_name, avatar_url),
        session:sessions(
          id,
          skill:skills(id, name)
        )
      `)
      .eq('id', reviewId)
      .single()

    if (error || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error in review GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/community/reviews/[id] - Delete own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reviewId } = await params

    // Get review
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only reviewer can delete
    if (review.reviewer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this review' }, { status: 403 })
    }

    // Delete review
    const { error: deleteError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      console.error('Error deleting review:', deleteError)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    // Update mentor_profiles average rating
    const { data: mentorProfile } = await supabaseAdmin
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', review.reviewee_id)
      .single()

    if (mentorProfile) {
      const { data: allReviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', review.reviewee_id)

      if (allReviews && allReviews.length > 0) {
        const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
        await supabaseAdmin
          .from('mentor_profiles')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            reviews_count: allReviews.length
          })
          .eq('user_id', review.reviewee_id)
      } else {
        await supabaseAdmin
          .from('mentor_profiles')
          .update({ rating: null, reviews_count: 0 })
          .eq('user_id', review.reviewee_id)
      }
    }

    return NextResponse.json({ message: 'Review deleted' })
  } catch (error) {
    console.error('Error in review DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}