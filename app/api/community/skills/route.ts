import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/community/skills - List all active skills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabaseAdmin
      .from('skills')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
    }

    return NextResponse.json({ skills: data })
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}