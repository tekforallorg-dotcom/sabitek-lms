import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/advisor/profile
 * Get user's career profile
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create profile
    let { data: profile, error } = await supabaseAdmin
      .from('career_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create one
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('career_profiles')
        .insert({
          user_id: user.id,
          full_name: userProfile?.full_name || '',
          email: userProfile?.email || user.email || '',
          education: [],
          work_experience: [],
          projects: [],
          skills: [],
          certifications: [],
          links: {},
          target_roles: [],
          preferred_industries: [],
          profile_completeness: 0
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Profile create error:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      profile = newProfile
    } else if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/advisor/profile
 * Update user's career profile
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      location,
      summary,
      education,
      work_experience,
      projects,
      skills,
      certifications,
      links,
      target_roles,
      preferred_industries
    } = body

    // Calculate profile completeness
    let completeness = 0
    if (full_name) completeness += 10
    if (email) completeness += 5
    if (phone) completeness += 5
    if (location) completeness += 5
    if (summary && summary.length > 50) completeness += 15
    if (education && education.length > 0) completeness += 15
    if (work_experience && work_experience.length > 0) completeness += 20
    if (skills && skills.length > 0) completeness += 10
    if (projects && projects.length > 0) completeness += 10
    if (target_roles && target_roles.length > 0) completeness += 5

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      profile_completeness: Math.min(completeness, 100)
    }

    // Only update provided fields
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (summary !== undefined) updateData.summary = summary
    if (education !== undefined) updateData.education = education
    if (work_experience !== undefined) updateData.work_experience = work_experience
    if (projects !== undefined) updateData.projects = projects
    if (skills !== undefined) updateData.skills = skills
    if (certifications !== undefined) updateData.certifications = certifications
    if (links !== undefined) updateData.links = links
    if (target_roles !== undefined) updateData.target_roles = target_roles
    if (preferred_industries !== undefined) updateData.preferred_industries = preferred_industries

    const { data: profile, error } = await supabaseAdmin
      .from('career_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile, message: 'Profile updated successfully' })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/advisor/profile
 * Create profile (if not exists) or import from CV
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    if (action === 'import') {
      // Import from parsed CV data
      const {
        full_name,
        email,
        phone,
        location,
        summary,
        education,
        work_experience,
        projects,
        skills,
        certifications,
        links
      } = data

      // Calculate completeness
      let completeness = 0
      if (full_name) completeness += 10
      if (email) completeness += 5
      if (phone) completeness += 5
      if (location) completeness += 5
      if (summary && summary.length > 50) completeness += 15
      if (education && education.length > 0) completeness += 15
      if (work_experience && work_experience.length > 0) completeness += 20
      if (skills && skills.length > 0) completeness += 10
      if (projects && projects.length > 0) completeness += 10

      const { data: profile, error } = await supabaseAdmin
        .from('career_profiles')
        .upsert({
          user_id: user.id,
          full_name: full_name || '',
          email: email || user.email || '',
          phone: phone || '',
          location: location || '',
          summary: summary || '',
          education: education || [],
          work_experience: work_experience || [],
          projects: projects || [],
          skills: skills || [],
          certifications: certifications || [],
          links: links || {},
          target_roles: [],
          preferred_industries: [],
          profile_completeness: Math.min(completeness, 100),
          last_import_source: 'cv_upload',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select('*')
        .single()

      if (error) {
        console.error('Profile import error:', error)
        return NextResponse.json({ error: 'Failed to import profile' }, { status: 500 })
      }

      return NextResponse.json({ 
        profile, 
        message: 'Profile imported successfully from CV' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}