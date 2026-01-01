import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/mentor/[id] - Get full mentor profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mentorId } = await params

    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      )
    }

    // Fetch user basic info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('id', mentorId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      )
    }

    // Fetch community profile
    const { data: communityProfile } = await supabaseAdmin
      .from('community_profiles')
      .select('*')
      .eq('user_id', mentorId)
      .single()

    // Fetch mentor profile (extended info)
    const { data: mentorProfile } = await supabaseAdmin
      .from('mentor_profiles')
      .select('*')
      .eq('id', mentorId)
      .single()

    // Check if user is available to mentor
    if (!communityProfile?.is_available_to_mentor) {
      return NextResponse.json(
        { error: 'This user is not available as a mentor' },
        { status: 404 }
      )
    }

    // Fetch teaching skills with skill details
    const { data: teachingSkills } = await supabaseAdmin
      .from('profile_skills')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('user_id', mentorId)
      .eq('skill_type', 'teach')

    // Fetch availability slots
    const { data: availability } = await supabaseAdmin
      .from('availability_slots')
      .select('*')
      .eq('user_id', mentorId)
      .eq('is_active', true)
      .order('day_of_week')

    // Fetch reviews for this mentor
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        session:sessions(id, skill_id, completed_at)
      `)
      .eq('reviewee_id', mentorId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate stats
    const { data: sessionStats } = await supabaseAdmin
      .from('sessions')
      .select('id, status')
      .eq('mentor_id', mentorId)
      .eq('status', 'completed')

    const totalSessions = sessionStats?.length || 0

    // Calculate average rating
    let avgRating = 0
    let reviewsCount = 0
    if (reviews && reviews.length > 0) {
      reviewsCount = reviews.length
      avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount
    }

    // Build response
    const mentorData = {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      // Community profile fields
      username: communityProfile?.username || null,
      display_name: communityProfile?.display_name || user.full_name,
      bio: communityProfile?.bio || null,
      location: communityProfile?.location || null,
      timezone: communityProfile?.timezone || 'Africa/Lagos',
      languages: communityProfile?.languages || ['english'],
      preferred_session_lengths: communityProfile?.preferred_session_lengths || ['60'],
      preferred_meeting_methods: communityProfile?.preferred_meeting_methods || ['google_meet'],
      meeting_link: communityProfile?.meeting_link || null,
      is_verified: communityProfile?.is_verified || false,
      response_time_hours: communityProfile?.response_time_hours || null,
      completion_rate: communityProfile?.completion_rate || 0,
      // Mentor profile fields
      headline: mentorProfile?.headline || null,
      hourly_rate_ngn: mentorProfile?.hourly_rate_ngn || null,
      // Related data
      teaching_skills: teachingSkills || [],
      availability: availability || [],
      reviews: reviews || [],
      // Stats
      total_sessions: totalSessions,
      avg_rating: Math.round(avgRating * 10) / 10,
      reviews_count: reviewsCount,
    }

    return NextResponse.json({ mentor: mentorData })
  } catch (error) {
    console.error('Error fetching mentor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentor profile' },
      { status: 500 }
    )
  }
}