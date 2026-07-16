import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { userId, messageContent, aiResponse } = await request.json()

    if (!userId || !messageContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a learning insight extraction AI. Respond ONLY with valid JSON.' },
          { role: 'user', content: extractionPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error('DeepSeek extraction failed:', response.status)
      return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content || ''

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

// ✅ NEW FUNCTION: Sync goal_mentioned insights to user_memory
async function syncGoalsToMemory(userId: string) {
  try {
    // Get all active goal_mentioned insights
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

    // Extract unique goals
    const goals = [...new Set(goalInsights.map(g => g.insight_content))]

    // Get or create user_memory record
    const { data: existingMemory } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingMemory) {
      // Update existing memory with new goals
      const currentContext = existingMemory.context || {}
      const updatedContext = {
        ...currentContext,
        learning_goals: goals
      }

      await supabase
        .from('user_memory')
        .update({ 
          context: updatedContext,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } else {
      // Create new memory record
      await supabase
        .from('user_memory')
        .insert({
          user_id: userId,
          context: {
            learning_goals: goals,
            career_goals: [],
            current_occupation: '',
            weak_topics: [],
            strong_topics: []
          }
        })
    }

    console.log(`✅ Synced ${goals.length} goals to user_memory for user ${userId}`)
  } catch (error) {
    console.error('Failed to sync goals to memory:', error)
    // Don't throw - this is a background operation
  }
}