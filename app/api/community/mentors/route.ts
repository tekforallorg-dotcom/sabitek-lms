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

// GET - List mentors with their teaching skills
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skill_id = searchParams.get('skill_id')
    const category = searchParams.get('category')
    const language = searchParams.get('language')
    const level = searchParams.get('level')

    // Get mentors who are available and public
    let profileQuery = supabaseAdmin
      .from('community_profiles')
      .select(`
        user_id,
        username,
        display_name,
        bio,
        location,
        languages,
        preferred_session_lengths,
        preferred_meeting_methods,
        is_verified,
        response_time_hours,
        completion_rate,
        created_at,
        user:users(id, full_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_available_to_mentor', true)
      .eq('is_suspended', false)
      .neq('user_id', user.id) // Don't show self
      .order('completion_rate', { ascending: false })
      .limit(50)

    if (language) {
      profileQuery = profileQuery.contains('languages', [language])
    }

    const { data: profiles, error: profileError } = await profileQuery

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ mentors: [] })
    }

    // Get teaching skills for these mentors
    const userIds = profiles.map(p => p.user_id)
    
    let skillsQuery = supabaseAdmin
      .from('profile_skills')
      .select(`
        user_id,
        skill_id,
        level,
        years_experience,
        description,
        skill:skills(id, name, slug, category)
      `)
      .in('user_id', userIds)
      .eq('skill_type', 'teach')

    if (skill_id) {
      skillsQuery = skillsQuery.eq('skill_id', skill_id)
    }

    const { data: skills, error: skillsError } = await skillsQuery

    if (skillsError) {
      console.error('Error fetching skills:', skillsError)
    }

    // Group skills by user
    const skillsByUser: Record<string, any[]> = {}
    skills?.forEach(s => {
      if (!skillsByUser[s.user_id]) {
        skillsByUser[s.user_id] = []
      }
      skillsByUser[s.user_id].push(s)
    })

    // Filter by category if specified
    let filteredProfiles = profiles
    if (category) {
      filteredProfiles = profiles.filter(p => {
        const userSkills = skillsByUser[p.user_id] || []
        return userSkills.some((s: any) => s.skill?.category === category)
      })
    }

    // Filter by skill_id - only show mentors who teach this skill
    if (skill_id) {
      filteredProfiles = filteredProfiles.filter(p => {
        const userSkills = skillsByUser[p.user_id] || []
        return userSkills.length > 0
      })
    }

    // Filter by level if specified
    if (level) {
      filteredProfiles = filteredProfiles.filter(p => {
        const userSkills = skillsByUser[p.user_id] || []
        return userSkills.some((s: any) => s.level === level)
      })
    }

   // Combine data
    const mentors = filteredProfiles.map(p => {
      // Supabase returns joined tables as arrays, get first element
      const userData = Array.isArray(p.user) ? p.user[0] : p.user
      return {
        ...p,
        display_name: p.display_name || userData?.full_name || 'Anonymous',
        avatar_url: userData?.avatar_url || null,
        teaching_skills: skillsByUser[p.user_id] || [],
        // Placeholder stats until we have sessions/reviews tables
        total_sessions: 0,
        avg_rating: 0,
        reviews_count: 0,
      }
    })

    return NextResponse.json({ mentors })
  } catch (error) {
    console.error('Error in GET /api/community/mentors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}