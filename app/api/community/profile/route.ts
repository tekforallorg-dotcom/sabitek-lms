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

// GET /api/community/profile - Get current user's community profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get profile with skills and availability
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('community_profiles')
      .select(`
        *,
        user:users(full_name, email, avatar_url)
      `)
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Get skills
    const { data: skills } = await supabaseAdmin
      .from('profile_skills')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('user_id', userId)

    // Get availability
    const { data: availability } = await supabaseAdmin
      .from('availability_slots')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time')

    const teachingSkills = skills?.filter(s => s.skill_type === 'teach') || []
    const learningSkills = skills?.filter(s => s.skill_type === 'learn') || []

    return NextResponse.json({
      profile: profile || null,
      teaching_skills: teachingSkills,
      learning_skills: learningSkills,
      availability: availability || [],
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/community/profile - Create or update community profile
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()

    // Validate username uniqueness if provided
    if (body.username) {
      const { data: existing } = await supabaseAdmin
        .from('community_profiles')
        .select('id')
        .eq('username', body.username)
        .neq('user_id', userId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    // Upsert profile
    const { data: profile, error } = await supabaseAdmin
      .from('community_profiles')
      .upsert({
        user_id: userId,
        username: body.username || null,
        display_name: body.display_name || null,
        bio: body.bio || null,
        location: body.location || null,
        timezone: body.timezone || 'Africa/Lagos',
        languages: body.languages || ['english'],
        preferred_session_lengths: body.preferred_session_lengths || ['60'],
        preferred_meeting_methods: body.preferred_meeting_methods || ['google_meet'],
        meeting_link: body.meeting_link || null,
        is_public: body.is_public ?? true,
        is_available_to_mentor: body.is_available_to_mentor ?? false,
        is_looking_to_learn: body.is_looking_to_learn ?? true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving profile:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}