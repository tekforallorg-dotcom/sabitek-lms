import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCareerRecommendations } from '@/lib/gemini-advisor'
import { executeAdvisorOperation } from '@/lib/advisor/pricing'

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

    // Prepare input for caching (hash the survey answers)
    const inputForCache = {
      surveyAnswers,
    }

    // Execute with pricing
    const result = await executeAdvisorOperation(supabase, {
      userId,
      operationType: 'roadmap_generate',
      module: 'roadmap',
      inputForCache,
      inputSummary: { 
        goals: surveyAnswers.goals?.slice(0, 2),
        experience: surveyAnswers.tech_experience?.[0],
      },
      executor: async () => {
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
          throw new Error('Failed to save survey')
        }

        console.log('🚀 Generating Career Roadmap...')

        // Get AI recommendations (includes tiered recommendations + 6-month roadmap)
        const recommendations = await getCareerRecommendations(surveyAnswers)

        // Combine primary and alternative tracks for storage
        const all_tracks = [
          ...recommendations.primary_tracks.map(t => ({ ...t, tier: 'primary' as const })),
          ...recommendations.alternative_tracks.map(t => ({ ...t, tier: 'alternative' as const }))
        ]

        // Save results to database
        const { data: resultData, error: resultError } = await supabase
          .from('career_results')
          .insert({
            user_id: userId,
            survey_id: survey.id,
            top_tracks: all_tracks,
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
          throw new Error('Failed to save results')
        }

        console.log('✅ Career Roadmap generated successfully!')

        return {
          outputId: resultData.id,
          outputTable: 'career_results',
          data: {
            resultId: resultData.id,
            recommendations,
          },
        }
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Operation failed' },
        { status: result.error?.includes('Insufficient') ? 402 : 500 }
      )
    }

    // Extract data from result
    const data = result.data as {
      resultId: string
      recommendations: Awaited<ReturnType<typeof getCareerRecommendations>>
    } | undefined

    if (!data) {
      return NextResponse.json(
        { error: 'No data returned from operation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultId: data.resultId,
      recommendations: data.recommendations,
      charged: result.costFormatted,
      cached: result.cached,
      newBalance: result.newBalanceFormatted,
    })
  } catch (error: unknown) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}