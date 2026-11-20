import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkAIQuota, generateText, quotaMessage } from '@/lib/ai'

const supabase = supabaseAdmin


export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if ('error' in auth) return auth.error
    const userId = auth.user.id

    const { messageContent, aiResponse } = await request.json()

    if (!messageContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const quota = await checkAIQuota(userId, 'sabibot_insights')
    if (!quota.ok) {
      return NextResponse.json({ error: quotaMessage(quota) }, { status: 429 })
    }

    // Use AI to extract insights from the conversation
    const extractionPrompt = `Analyze this student's message and extract learning insights.

Student message: "${messageContent}"

Extract the following if present:
1. GOALS: Any learning goals, career aspirations, or skills they want to learn
2. STRUGGLES: Topics they find difficult or are struggling with
3. INTERESTS: Topics they're curious about or passionate about
4. CAREER: Career-related context (current job, career goals)

Respond ONLY in this exact JSON format:
{
  "goals": ["goal1", "goal2"],
  "struggles": ["topic1", "topic2"],
  "interests": ["topic1", "topic2"],
  "career": ["career context"]
}

Rules:
- Extract SHORT phrases (2-4 words max per item)
- Only include items that are EXPLICITLY mentioned
- If nothing found for a category, use empty array []
- NO explanations, ONLY the JSON`

    let extractedText = ''
    try {
      const result = await generateText({
        feature: 'sabibot_insights',
        userId,
        system: 'You are a learning insight extraction AI. Respond ONLY with valid JSON.',
        prompt: extractionPrompt,
        maxTokens: 500,
        temperature: 0.3,
      })
      extractedText = result.text
    } catch (error) {
      console.error('Insight extraction failed:', error instanceof Error ? error.message : error)
      return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
    }

    // Parse JSON response
    let insights
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      insights = JSON.parse(cleanedText)
    } catch (error) {
      console.error('Failed to parse insights:', extractedText)
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
    }

    // Insert insights into database
    const insightsToInsert = []

    // Goals
    for (const goal of insights.goals || []) {
      if (goal.trim()) {
        insightsToInsert.push({
          user_id: userId,
          insight_type: 'goal_mentioned',
          insight_content: goal.trim(),
          confidence_score: 90,
          is_active: true
        })
      }
    }

    // Struggles
    for (const struggle of insights.struggles || []) {
      if (struggle.trim()) {
        insightsToInsert.push({
          user_id: userId,
          insight_type: 'topic_struggle',
          insight_content: struggle.trim(),
          confidence_score: 85,
          is_active: true
        })
      }
    }

    // Interests
    for (const interest of insights.interests || []) {
      if (interest.trim()) {
        insightsToInsert.push({
          user_id: userId,
          insight_type: 'topic_interest',
          insight_content: interest.trim(),
          confidence_score: 85,
          is_active: true
        })
      }
    }

    // Career context
    for (const career of insights.career || []) {
      if (career.trim()) {
        insightsToInsert.push({
          user_id: userId,
          insight_type: 'career_context',
          insight_content: career.trim(),
          confidence_score: 90,
          is_active: true
        })
      }
    }

    // Insert all insights
    if (insightsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('conversation_insights')
        .insert(insightsToInsert)

      if (insertError) {
        console.error('Failed to insert insights:', insertError)
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
      }
    }

    // ✅ SYNC GOALS TO USER MEMORY (NEW CODE)
    await syncGoalsToMemory(userId)

    return NextResponse.json({
      success: true,
      extracted: insightsToInsert.length,
      insights: insights
    })

  } catch (error) {
    console.error('Extract insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Sync goal_mentioned insights into user_learning_context - the table the
// Goals tab and SabiBot's memory actually read from.
async function syncGoalsToMemory(userId: string) {
  try {
    const { data: goalInsights } = await supabase
      .from('conversation_insights')
      .select('insight_content')
      .eq('user_id', userId)
      .eq('insight_type', 'goal_mentioned')
      .eq('is_active', true)
      .order('extracted_at', { ascending: false })

    if (!goalInsights || goalInsights.length === 0) {
      return
    }

    const goals = [...new Set(goalInsights.map(g => g.insight_content))].slice(0, 10)

    const { data: existing } = await supabase
      .from('user_learning_context')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('user_learning_context')
        .update({ learning_goals: goals, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_learning_context')
        .insert({ user_id: userId, learning_goals: goals })
    }

    console.log(`Synced ${goals.length} goals to user_learning_context for ${userId}`)
  } catch (error) {
    console.error('Failed to sync goals:', error)
    // Background operation - never throw
  }
}
