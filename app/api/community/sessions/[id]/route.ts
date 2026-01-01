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

// GET /api/community/sessions/[id] - Get single session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        learner:users!sessions_learner_id_fkey(id, full_name, email, avatar_url),
        mentor:users!sessions_mentor_id_fkey(id, full_name, email, avatar_url),
        skill:skills(id, name, slug)
      `)
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user is participant
    if (session.learner_id !== user.id && session.mentor_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this session' },
        { status: 403 }
      )
    }

    // Get thread if exists
    const { data: thread } = await supabaseAdmin
      .from('threads')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    // Get reviews for this session
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url)
      `)
      .eq('session_id', sessionId)

    return NextResponse.json({
      session: {
        ...session,
        thread_id: thread?.id || null,
        reviews: reviews || []
      }
    })
  } catch (error) {
    console.error('Error in session GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}