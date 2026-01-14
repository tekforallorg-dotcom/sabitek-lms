import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executeAdvisorOperation } from '@/lib/advisor/pricing'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { 
      userId, 
      materialId, 
      materialText, 
      category, 
      level,
      questionCount = 10 
    } = await request.json()

    if (!userId || !materialId || !materialText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique input to avoid caching (charge every time)
    const inputForCache = {
      materialId,
      questionCount,
      category,
      level,
      timestamp: Date.now(), // Makes each request unique - no caching
    }

    // Execute with pricing
    const result = await executeAdvisorOperation(supabase, {
      userId,
      operationType: 'quiz_generate',
      module: 'sabiquiz',
      inputForCache,
      skipCache: true, // Always charge
      inputSummary: { materialId, questionCount, category },
      executor: async () => {
        console.log('🎯 Generating quiz questions...')
        
        // Import and run the pipeline
        const { runPipeline, savePipelineResults } = await import('@/lib/sabiquiz/pipeline')
        
        const pipelineResult = await runPipeline(
          materialText,
          materialId,
          category || 'General',
          level || 'Foundation (Beginner)',
          {
            questionCount,
            difficultyMix: { easy: 3, medium: 5, hard: 2 },
            useAdvancedPipeline: false,
            useAIReview: false,
            maxRetries: 2,
          }
        )

        if (!pipelineResult.success || pipelineResult.questions.length === 0) {
          throw new Error(pipelineResult.errors.join(', ') || 'No questions were generated')
        }

        // Save questions to database (pass service role client to bypass RLS)
        await savePipelineResults(
          pipelineResult,
          materialId,
          userId,
          category || 'General',
          level || 'Foundation (Beginner)',
          supabase // Pass the service role client
        )

        console.log(`✅ Generated ${pipelineResult.questions.length} questions`)

        return {
          outputId: materialId,
          outputTable: 'sabiquiz_questions',
          data: {
            questions: pipelineResult.questions,
            stats: pipelineResult.stats,
          },
        }
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: result.error?.includes('Insufficient') ? 402 : 500 }
      )
    }

    const data = result.data as {
      questions: unknown[]
      stats: unknown
    } | undefined

    return NextResponse.json({
      success: true,
      questions: data?.questions || [],
      stats: data?.stats,
      charged: result.costFormatted,
      newBalance: result.newBalanceFormatted,
    })

  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

// GET - Check pricing
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') || 'quiz_generate'

    const { data: pricing } = await supabase
      .from('advisor_pricing')
      .select('*')
      .eq('operation_type', operation)
      .single()

    if (!pricing) {
      return NextResponse.json(
        { error: 'Pricing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      costKobo: pricing.base_cost_kobo,
      costFormatted: `₦${(pricing.base_cost_kobo / 100).toLocaleString()}`,
      displayName: pricing.display_name,
      description: pricing.description,
    })

  } catch (error) {
    console.error('Pricing fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    )
  }
}