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
      .order('extracted_at', { ascending: false })
      .limit(20)

    if (insightsError) {
      console.error('Insights query error:', insightsError)
    }

    // Extract keywords
    let keywords: string[] = []
    if (insights && insights.length > 0) {
      keywords = insights.flatMap(i => {
        const words = i.insight_content.toLowerCase()
          .split(/[\s,]+/)
          .filter((w: string) => w.length > 2)
        
        return [i.insight_content.toLowerCase(), ...words]
      })
      
      keywords = [...new Set(keywords)]
    }

    console.log('Keywords for matching:', keywords)

    // Get all published courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, slug, title, description, thumbnail_url, instructor_id, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)

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

    // Get instructor names
    const instructorIds = [...new Set(courses.map(c => c.instructor_id).filter(Boolean))]
    const { data: instructors } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', instructorIds)

    const instructorMap = new Map(instructors?.map(i => [i.id, i.full_name]) || [])

    // Get user's enrollments
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId)

    const enrolledIds = new Set(enrollments?.map(e => e.course_id) || [])

    // Score courses based on keyword matches
    const scoredCourses = courses.map(course => {
      let score = 0
      const titleLower = course.title.toLowerCase()
      const descLower = (course.description || '').toLowerCase()
      const combined = `${titleLower} ${descLower}`

      if (keywords.length > 0) {
        keywords.forEach(keyword => {
          if (titleLower.includes(keyword)) {
            score += 15
          }
          if (descLower.includes(keyword)) {
            score += 8
          }
          const words = combined.split(/\s+/)
          words.forEach(word => {
            if (word.includes(keyword) || keyword.includes(word)) {
              score += 3
            }
          })
        })
      } else {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(course.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        score = Math.max(0, 10 - daysSinceCreated)
      }

      return { 
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        level: null,
        created_at: course.created_at,
        users: course.instructor_id ? { full_name: instructorMap.get(course.instructor_id) } : null,
        relevance_score: score,
        is_enrolled: enrolledIds.has(course.id)
      }
    })

    // Sort by relevance and recency - NO FILTERING
    const recommendations = scoredCourses
      .sort((a, b) => {
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      .slice(0, 3) // TOP 3 ONLY

    console.log(`Returning ${recommendations.length} recommendations`)
    console.log('Recommendations:', recommendations.map(r => ({
      title: r.title,
      score: r.relevance_score,
      enrolled: r.is_enrolled
    })))

    return NextResponse.json({
      success: true,
      recommendations,
      based_on: insights?.slice(0, 3).map(i => i.insight_content) || []
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