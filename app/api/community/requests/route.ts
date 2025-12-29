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

// GET - List requests (with filters)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skill_id = searchParams.get('skill_id')
    const status = searchParams.get('status') || 'open'
    const my_requests = searchParams.get('my_requests') === 'true'

    let query = supabaseAdmin
      .from('requests')
      .select(`
        *,
        skill:skills(id, name, slug, category),
        user:users(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (my_requests) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.eq('status', status)
    }

    if (skill_id) {
      query = query.eq('skill_id', skill_id)
    }

    const { data: requests, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in GET /api/community/requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, skill_id, level, preferred_language, urgency, session_length, constraints } = body

    // Validation
    if (!title || title.length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
    }

    if (!description || description.length < 20) {
      return NextResponse.json({ error: 'Description must be at least 20 characters' }, { status: 400 })
    }

    if (!skill_id) {
      return NextResponse.json({ error: 'Please select a skill' }, { status: 400 })
    }

    // Check user doesn't have too many open requests
    const { count } = await supabaseAdmin
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'open')

    if (count && count >= 5) {
      return NextResponse.json({ error: 'Maximum 5 open requests allowed' }, { status: 400 })
    }

    // Create request
    const { data: newRequest, error } = await supabaseAdmin
      .from('requests')
      .insert({
        user_id: user.id,
        title,
        description,
        skill_id,
        level: level || 'beginner',
        preferred_language: preferred_language || 'english',
        urgency: urgency || 'medium',
        session_length: session_length || '60',
        constraints: constraints || [],
        status: 'open',
      })
      .select(`
        *,
        skill:skills(id, name, slug, category),
        user:users(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating request:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest })
  } catch (error) {
    console.error('Error in POST /api/community/requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Close/delete a request
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const request_id = searchParams.get('request_id')

    if (!request_id) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('requests')
      .select('user_id')
      .eq('id', request_id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Soft delete - change status to closed
    const { error } = await supabaseAdmin
      .from('requests')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', request_id)

    if (error) {
      console.error('Error closing request:', error)
      return NextResponse.json({ error: 'Failed to close request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/community/requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}