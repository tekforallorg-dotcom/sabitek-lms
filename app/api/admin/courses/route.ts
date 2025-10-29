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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const difficulty = searchParams.get('difficulty') || ''
    
    const offset = (page - 1) * limit

    // Build query with instructor info
    let query = supabaseAdmin
      .from('courses')
      .select(`
        id,
        title,
        slug,
        description,
        instructor_id,
        category,
        difficulty_level,
        status,
        thumbnail_url,
        price_cents,
        is_free,
        estimated_duration_minutes,
        created_at,
        published_at,
        instructor:instructor_id (
          full_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    const { data: courses, error, count } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Get enrollment counts for each course
    const courseIds = courses?.map(c => c.id) || []
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds)

    // Count enrollments per course
    const enrollmentCounts: Record<string, number> = {}
    enrollments?.forEach(e => {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1
    })

    // Format response
    const formattedCourses = courses?.map(course => {
      // Instructor comes as array from Supabase join
      const instructor = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor
      
      return {
        ...course,
        instructor_name: instructor?.full_name || 'Unknown',
        instructor_email: instructor?.email || '',
        enrollment_count: enrollmentCounts[course.id] || 0,
      }
    }) || []

    return NextResponse.json({
      courses: formattedCourses,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}