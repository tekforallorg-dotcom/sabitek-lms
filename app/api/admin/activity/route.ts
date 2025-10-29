import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is super admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch recent audit logs with user info
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        reason,
        created_at,
        actor:actor_user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: logs || [] })

  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}