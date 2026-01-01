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

// GET /api/community/sessions - Get user's sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'upcoming', 'past', 'all', or specific status
    const role = searchParams.get('role') // 'learner', 'mentor', 'all'

    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        learner:users!sessions_learner_id_fkey(id, full_name, email, avatar_url),
        mentor:users!sessions_mentor_id_fkey(id, full_name, email, avatar_url),
        skill:skills(id, name, slug)
      `)
      .or(`learner_id.eq.${user.id},mentor_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    // Filter by role
    if (role === 'learner') {
      query = supabaseAdmin
        .from('sessions')
        .select(`
          *,
          learner:users!sessions_learner_id_fkey(id, full_name, email, avatar_url),
          mentor:users!sessions_mentor_id_fkey(id, full_name, email, avatar_url),
          skill:skills(id, name, slug)
        `)
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false })
    } else if (role === 'mentor') {
      query = supabaseAdmin
        .from('sessions')
        .select(`
          *,
          learner:users!sessions_learner_id_fkey(id, full_name, email, avatar_url),
          mentor:users!sessions_mentor_id_fkey(id, full_name, email, avatar_url),
          skill:skills(id, name, slug)
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false })
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Filter by status type
    let filteredSessions = sessions || []
    const now = new Date()

    if (status === 'upcoming') {
      filteredSessions = filteredSessions.filter(s => 
        s.status === 'scheduled' && s.scheduled_start && new Date(s.scheduled_start) > now
      )
    } else if (status === 'past') {
      filteredSessions = filteredSessions.filter(s => 
        s.status === 'completed' || 
        (s.scheduled_start && new Date(s.scheduled_start) < now && s.status !== 'cancelled')
      )
    } else if (status === 'proposed') {
      filteredSessions = filteredSessions.filter(s => s.status === 'proposed')
    } else if (status === 'scheduled') {
      filteredSessions = filteredSessions.filter(s => s.status === 'scheduled')
    } else if (status === 'completed') {
      filteredSessions = filteredSessions.filter(s => s.status === 'completed')
    } else if (status === 'cancelled') {
      filteredSessions = filteredSessions.filter(s => s.status === 'cancelled')
    }

    // Sort: upcoming first by date, then others by created_at
    filteredSessions.sort((a, b) => {
      if (a.status === 'scheduled' && b.status === 'scheduled') {
        return new Date(a.scheduled_start || 0).getTime() - new Date(b.scheduled_start || 0).getTime()
      }
      if (a.status === 'proposed' && b.status !== 'proposed') return -1
      if (b.status === 'proposed' && a.status !== 'proposed') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ sessions: filteredSessions })
  } catch (error) {
    console.error('Error in sessions GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}