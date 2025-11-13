import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCareerRecommendations } from '@/lib/gemini-advisor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, surveyAnswers } = await request.json()

    if (!userId || !surveyAnswers) {
      return NextResponse.json(
        { error: 'Missing userId or surveyAnswers' },
        { status: 400 }
      )
    }

    // Save survey to database
    const { data: survey, error: surveyError } = await supabase
      .from('career_surveys')
      .insert({
        user_id: userId,
        answers: surveyAnswers,
      })
      .select()
      .single()

    if (surveyError) {
      console.error('Survey save error:', surveyError)
      return NextResponse.json(
        { error: 'Failed to save survey' },
        { status: 500 }
      )
    }

    // Get AI recommendations (now includes tiered recommendations + 6-month roadmap)
    const recommendations = await getCareerRecommendations(surveyAnswers)

    // Combine primary and alternative tracks for storage
    const all_tracks = [
      ...recommendations.primary_tracks.map(t => ({ ...t, tier: 'primary' })),
      ...recommendations.alternative_tracks.map(t => ({ ...t, tier: 'alternative' }))
    ]

    // Save results to database
    const { data: result, error: resultError } = await supabase
      .from('career_results')
      .insert({
        user_id: userId,
        survey_id: survey.id,
        top_tracks: all_tracks, // Store all tracks with tier labels
        primary_tracks: recommendations.primary_tracks,
        alternative_tracks: recommendations.alternative_tracks,
        confidence: recommendations.overall_confidence,
        next_steps: recommendations.next_steps,
        roadmap_6m: recommendations.roadmap_6m,
      })
      .select()
      .single()

    if (resultError) {
      console.error('Result save error:', resultError)
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultId: result.id,
      recommendations,
    })
  } catch (error: any) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}