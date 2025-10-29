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

    // Calculate date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch all stats in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      previousActiveUsersResult,
      totalCoursesResult,
      publishedCoursesResult,
      previousCoursesResult,
      totalEnrollmentsResult,
      previousEnrollmentsResult,
      totalCertificatesResult,
      previousCertificatesResult,
    ] = await Promise.all([
      // Total users (exclude soft deleted)
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'soft_deleted'),

      // Active users (last 30 days)
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('last_seen_at', thirtyDaysAgo.toISOString()),

      // Previous period active users (30-60 days ago)
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('last_seen_at', sixtyDaysAgo.toISOString())
        .lt('last_seen_at', thirtyDaysAgo.toISOString()),

      // Total courses
      supabaseAdmin
        .from('courses')
        .select('id', { count: 'exact', head: true }),

      // Published courses
      supabaseAdmin
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),

      // Previous period courses (created 30-60 days ago)
      supabaseAdmin
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),

      // Total enrollments - FIXED: Changed from 'enrollments' to 'course_enrollments'
      supabaseAdmin
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true }),

      // Previous period enrollments - FIXED: Changed from 'enrollments' to 'course_enrollments'
      supabaseAdmin
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .gte('enrolled_at', sixtyDaysAgo.toISOString())
        .lt('enrolled_at', thirtyDaysAgo.toISOString()),

      // Total certificates
      supabaseAdmin
        .from('certificates')
        .select('id', { count: 'exact', head: true }),

      // Previous period certificates
      supabaseAdmin
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .gte('issued_at', sixtyDaysAgo.toISOString())
        .lt('issued_at', thirtyDaysAgo.toISOString()),
    ])

    // Calculate changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const totalUsers = totalUsersResult.count || 0
    const mau = activeUsersResult.count || 0
    const previousMau = previousActiveUsersResult.count || 0
    const totalCourses = totalCoursesResult.count || 0
    const activeCourses = publishedCoursesResult.count || 0
    const previousCourses = previousCoursesResult.count || 0
    const totalEnrollments = totalEnrollmentsResult.count || 0
    const previousEnrollments = previousEnrollmentsResult.count || 0
    const totalCertificates = totalCertificatesResult.count || 0
    const previousCertificates = previousCertificatesResult.count || 0

    return NextResponse.json({
      totalUsers: {
        value: totalUsers,
        change: calculateChange(totalUsers, totalUsers - mau),
        trend: totalUsers >= (totalUsers - mau) ? 'up' : 'down',
      },
      mau: {
        value: mau,
        change: calculateChange(mau, previousMau),
        trend: mau >= previousMau ? 'up' : 'down',
      },
      activeCourses: {
        value: activeCourses,
        total: totalCourses,
        change: calculateChange(totalCourses, previousCourses),
        trend: totalCourses >= previousCourses ? 'up' : 'down',
      },
      totalEnrollments: {
        value: totalEnrollments,
        change: calculateChange(totalEnrollments, previousEnrollments),
        trend: totalEnrollments >= previousEnrollments ? 'up' : 'down',
      },
      totalCertificates: {
        value: totalCertificates,
        change: calculateChange(totalCertificates, previousCertificates),
        trend: totalCertificates >= previousCertificates ? 'up' : 'down',
      },
    })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}