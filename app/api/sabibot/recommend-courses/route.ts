import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user's struggles and interests
    const { data: insights, error: insightsError } = await supabase
      .from('conversation_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('insight_type', ['topic_struggle', 'topic_interest', 'goal_mentioned'])
      .order('confidence_score', { ascending: false })
      .limit(10)

    if (insightsError) {
      console.error('Insights query error:', insightsError)
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'Could not fetch insights'
      })
    }

    if (!insights || insights.length === 0) {
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'No insights available yet. Chat more with SabiBot to get personalized recommendations!'
      })
    }

    // Extract keywords from insights
    const keywords = insights.map(i => i.insight_content.toLowerCase())

    // Search for relevant courses (WITHOUT level column)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, instructor_id, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (coursesError) {
      console.error('Courses query error:', coursesError)
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'Could not fetch courses'
      })
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({ 
        success: true,
        recommendations: [],
        message: 'No courses available yet'
      })
    }

    // Get instructor names separately
    const instructorIds = [...new Set(courses.map(c => c.instructor_id).filter(Boolean))]
    const { data: instructors } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', instructorIds)

    const instructorMap = new Map(instructors?.map(i => [i.id, i.full_name]) || [])

    // Score courses based on keyword matches
    const scoredCourses = courses.map(course => {
      let score = 0
      const titleLower = course.title.toLowerCase()
      const descLower = (course.description || '').toLowerCase()

      keywords.forEach(keyword => {
        if (titleLower.includes(keyword)) score += 10
        if (descLower.includes(keyword)) score += 5
      })

      return { 
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        level: null, // Not available in database
        created_at: course.created_at,
        users: course.instructor_id ? { full_name: instructorMap.get(course.instructor_id) } : null,
        relevance_score: score
      }
    }).filter(c => c.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 6)

    // Get user's enrolled courses to exclude
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId)

    const enrolledIds = new Set(enrollments?.map(e => e.course_id) || [])
    const recommendations = scoredCourses.filter(c => !enrolledIds.has(c.id))

    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, 5),
      based_on: insights.slice(0, 3).map(i => i.insight_content)
    })

  } catch (error) {
    console.error('Course recommendation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}