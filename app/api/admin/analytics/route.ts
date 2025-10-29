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
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Fetch all data in parallel
    const [
      usersData,
      coursesData,
      enrollmentsData,
      certificatesData,
      recentEnrollments,
      recentProgress,
      popularCoursesData,
    ] = await Promise.all([
      // User growth data
      supabaseAdmin
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),

      // Course creation data
      supabaseAdmin
        .from('courses')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),

      // Enrollment data
      supabaseAdmin
        .from('course_enrollments')
        .select('enrolled_at, completed_at, course_id, user_id')
        .gte('enrolled_at', startDate.toISOString())
        .order('enrolled_at', { ascending: true }),

      // Certificate data
      supabaseAdmin
        .from('certificates')
        .select('issued_at, grade_percentage')
        .gte('issued_at', startDate.toISOString())
        .order('issued_at', { ascending: true }),

      // Recent enrollments (last 7 days) for active user calculation
      supabaseAdmin
        .from('course_enrollments')
        .select('user_id, enrolled_at')
        .gte('enrolled_at', sevenDaysAgo.toISOString()),

      // Recent lesson progress (last 7 days) for active user calculation
      supabaseAdmin
        .from('user_progress')
        .select('user_id, completed_at')
        .gte('completed_at', sevenDaysAgo.toISOString()),

      // Popular courses (all time)
      supabaseAdmin
        .from('course_enrollments')
        .select(`
          course_id,
          courses!inner (
            title,
            thumbnail_url
          )
        `),
    ])

    // Calculate active users based on actual platform activity
    const activeUsersSet = new Set<string>()
    const dauSet = new Set<string>()

    // Users who enrolled in last 7 days
    recentEnrollments.data?.forEach(enrollment => {
      activeUsersSet.add(enrollment.user_id)
      
      // Check if in last 24 hours for DAU
      const enrolledAt = new Date(enrollment.enrolled_at)
      if (enrolledAt >= oneDayAgo) {
        dauSet.add(enrollment.user_id)
      }
    })

    // Users who completed lessons in last 7 days
    recentProgress.data?.forEach(progress => {
      activeUsersSet.add(progress.user_id)
      
      // Check if in last 24 hours for DAU
      const completedAt = new Date(progress.completed_at)
      if (completedAt >= oneDayAgo) {
        dauSet.add(progress.user_id)
      }
    })

    const wau = activeUsersSet.size
    const dau = dauSet.size

    // Process user growth by day
    const userGrowthByDay: Record<string, number> = {}
    let cumulativeUsers = 0
    
    // Get total users before start date
    const { count: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString())
    
    cumulativeUsers = existingUsers || 0

    usersData.data?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      userGrowthByDay[date] = (userGrowthByDay[date] || 0) + 1
    })

    const userGrowthSeries = Object.entries(userGrowthByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        cumulativeUsers += count
        return {
          date,
          count: cumulativeUsers,
          newUsers: count,
        }
      })

    // Process enrollment trends by day
    const enrollmentsByDay: Record<string, number> = {}
    enrollmentsData.data?.forEach(enrollment => {
      const date = new Date(enrollment.enrolled_at).toISOString().split('T')[0]
      enrollmentsByDay[date] = (enrollmentsByDay[date] || 0) + 1
    })

    const enrollmentSeries = Object.entries(enrollmentsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
      }))

    // Process certificate trends by day
    const certificatesByDay: Record<string, number> = {}
    certificatesData.data?.forEach(cert => {
      const date = new Date(cert.issued_at).toISOString().split('T')[0]
      certificatesByDay[date] = (certificatesByDay[date] || 0) + 1
    })

    const certificateSeries = Object.entries(certificatesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
      }))

    // Calculate popular courses
    const courseCounts: Record<string, { count: number; title: string; thumbnail: string }> = {}
    popularCoursesData.data?.forEach((enrollment: any) => {
      const course = enrollment.courses
      const courseId = enrollment.course_id
      
      if (!courseCounts[courseId]) {
        courseCounts[courseId] = {
          count: 0,
          title: course?.title || 'Unknown Course',
          thumbnail: course?.thumbnail_url || '',
        }
      }
      courseCounts[courseId].count++
    })

    const popularCourses = Object.entries(courseCounts)
      .map(([id, data]) => ({
        id,
        title: data.title,
        thumbnail: data.thumbnail,
        enrollments: data.count,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10)

    // Calculate completion rate
    const totalEnrollments = enrollmentsData.data?.length || 0
    const completedEnrollments = enrollmentsData.data?.filter(e => e.completed_at).length || 0
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0

    // Calculate average grade
    const grades = certificatesData.data?.map(c => c.grade_percentage).filter(g => g !== null) || []
    const averageGrade = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + (g || 0), 0) / grades.length)
      : 0

    return NextResponse.json({
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      userGrowth: userGrowthSeries,
      enrollmentTrend: enrollmentSeries,
      certificateTrend: certificateSeries,
      popularCourses,
      metrics: {
        totalUsers: cumulativeUsers,
        activeUsers: {
          dau,
          wau,
        },
        completionRate,
        averageGrade,
        totalEnrollments,
        totalCertificates: certificatesData.data?.length || 0,
      },
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}