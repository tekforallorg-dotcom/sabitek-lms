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
    const courseId = searchParams.get('courseId') || ''
    
    const offset = (page - 1) * limit

    // Build base query
    let baseQuery = supabaseAdmin
      .from('certificates')
      .select(`
        id,
        certificate_number,
        user_id,
        course_id,
        issued_at,
        revoked_at,
        revoke_reason,
        completion_date,
        grade_percentage,
        certificate_url,
        user:user_id (
          full_name,
          email
        ),
        course:course_id (
          title
        )
      `, { count: 'exact' })
      .order('issued_at', { ascending: false })

    // Apply status filter first
    if (status === 'active') {
      baseQuery = baseQuery.is('revoked_at', null)
    } else if (status === 'revoked') {
      baseQuery = baseQuery.not('revoked_at', 'is', null)
    }

    if (courseId) {
      baseQuery = baseQuery.eq('course_id', courseId)
    }

    // Get all matching records first (if searching)
    let allCertificates = []
    if (search) {
      // Fetch all to filter by user name
      const { data: tempData, error: tempError } = await baseQuery
      
      if (tempError) {
        console.error('Error fetching certificates:', tempError)
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
      }

      // Filter by certificate number or user name
      allCertificates = tempData?.filter(cert => {
        const user = Array.isArray(cert.user) ? cert.user[0] : cert.user
        const certNumber = cert.certificate_number?.toLowerCase() || ''
        const userName = user?.full_name?.toLowerCase() || ''
        const userEmail = user?.email?.toLowerCase() || ''
        const searchLower = search.toLowerCase()
        
        return certNumber.includes(searchLower) || 
               userName.includes(searchLower) || 
               userEmail.includes(searchLower)
      }) || []
      
      // Paginate manually
      const startIndex = offset
      const endIndex = offset + limit
      const certificates = allCertificates.slice(startIndex, endIndex)
      
      // Format response
      const formattedCertificates = certificates.map(cert => {
        const user = Array.isArray(cert.user) ? cert.user[0] : cert.user
        const course = Array.isArray(cert.course) ? cert.course[0] : cert.course
        
        return {
          ...cert,
          user_name: user?.full_name || 'Unknown',
          user_email: user?.email || '',
          course_title: course?.title || 'Unknown Course',
        }
      })

      return NextResponse.json({
        certificates: formattedCertificates,
        total: allCertificates.length,
        page,
        limit,
        totalPages: Math.ceil(allCertificates.length / limit),
      })
    } else {
      // No search - use normal pagination
      const { data: certificates, error, count } = await baseQuery
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching certificates:', error)
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
      }

      // Format response
      const formattedCertificates = certificates?.map(cert => {
        const user = Array.isArray(cert.user) ? cert.user[0] : cert.user
        const course = Array.isArray(cert.course) ? cert.course[0] : cert.course
        
        return {
          ...cert,
          user_name: user?.full_name || 'Unknown',
          user_email: user?.email || '',
          course_title: course?.title || 'Unknown Course',
        }
      }) || []

      return NextResponse.json({
        certificates: formattedCertificates,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}