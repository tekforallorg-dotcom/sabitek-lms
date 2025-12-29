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

// POST /api/community/profile/skills - Add a skill
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()

    if (!body.skill_id || !body.skill_type || !body.level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: skill, error } = await supabaseAdmin
      .from('profile_skills')
      .upsert({
        user_id: userId,
        skill_id: body.skill_id,
        skill_type: body.skill_type,
        level: body.level,
        years_experience: body.years_experience || null,
        proof_links: body.proof_links || null,
        description: body.description || null,
        tags: body.tags || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,skill_id,skill_type',
      })
      .select(`
        *,
        skill:skills(*)
      `)
      .single()

    if (error) {
      console.error('Error saving skill:', error)
      return NextResponse.json({ error: 'Failed to save skill' }, { status: 500 })
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/community/profile/skills - Remove a skill
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skill_id')
    const skillType = searchParams.get('skill_type')

    if (!skillId || !skillType) {
      return NextResponse.json({ error: 'Missing skill_id or skill_type' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profile_skills')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .eq('skill_type', skillType)

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}