import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// MEMORY COLLECTION API
// Extracts learning insights from conversations
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userMessage, assistantMessage, action } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Route to appropriate handler
    switch (action) {
      case 'update_streak':
        return await updateStreak(userId)
      
      case 'extract_insights':
        return await extractInsights(userId, userMessage, assistantMessage)
      
      case 'update_context':
        return await updateLearningContext(userId, body.contextData)
      
      case 'add_milestone':
        return await addMilestoneHandler(userId, body.milestoneData)
      
      case 'get_context':
        return await getUserContext(userId)
      
      case 'mark_celebrated':
        return await markMilestoneCelebrated(userId, body.milestoneId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Memory API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// HANDLER: Update Study Streak
// ============================================
async function updateStreak(userId: string) {
  try {
    // Call database function to update streak
    const { data, error } = await supabase.rpc('update_study_streak', {
      p_user_id: userId
    })

    if (error) throw error

    // Get updated streak data
    const { data: streakData, error: streakError } = await supabase
      .from('study_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (streakError) throw streakError

    // Check for streak milestones
    const currentStreak = streakData?.current_streak || 0
    const milestoneThresholds = [3, 7, 14, 30, 60, 100]
    
    if (milestoneThresholds.includes(currentStreak)) {
      // Create milestone
      await supabase.rpc('add_milestone', {
        p_user_id: userId,
        p_milestone_type: 'study_streak',
        p_milestone_name: `${currentStreak} Day Study Streak`,
        p_milestone_description: `Studied for ${currentStreak} consecutive days!`,
        p_metadata: JSON.stringify({ streak_days: currentStreak })
      })
    }

    return NextResponse.json({
      success: true,
      streak: streakData
    })
  } catch (error) {
    console.error('Update streak error:', error)
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
  }
}

// ============================================
// HANDLER: Extract Insights from Conversation (ENHANCED)
// ============================================
async function extractInsights(
  userId: string,
  userMessage: string,
  assistantMessage: string
) {
  try {
    const insights = []

    // Pattern 1: Topic struggles (ENHANCED with more patterns)
    const strugglePatterns = [
      /(?:difficult|hard|confused|don'?t understand|struggling with|can'?t grasp|having trouble with|find it hard|stuck on)\s+(?:with\s+)?([a-zA-Z\s]+)/gi,
      /I find ([a-zA-Z\s]+)\s+(?:difficult|hard|challenging|confusing|tough)/gi,
      /([a-zA-Z\s]+)\s+(?:is|are)\s+(?:difficult|hard|challenging|confusing|tough|tricky)/gi,
      /(?:need help|help me) with ([a-zA-Z\s]+)/gi,
      /(?:weak|poor|bad) at ([a-zA-Z\s]+)/gi,
      /([a-zA-Z\s]+)\s+(?:frustrates|confuses) me/gi
    ]

    for (const pattern of strugglePatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const topic = match[1]?.trim()
        if (topic && topic.length > 2 && topic.length < 50) {
          insights.push({
            user_id: userId,
            insight_type: 'topic_struggle',
            insight_content: topic,
            confidence_score: 75
          })
        }
      }
    }

    // Pattern 2: Learning goals (ENHANCED)
    const goalPatterns = [
      /(?:want to|goal is to|planning to|aspire to|hope to|trying to|aiming to)\s+(?:learn|study|become|master|understand|get into)\s+([a-zA-Z\s]+)/gi,
      /I want to become\s+(?:a\s+)?([a-zA-Z\s]+)/gi,
      /my goal is\s+([a-zA-Z\s]+)/gi,
      /(?:interested in|looking to) (?:learning|studying|mastering)\s+([a-zA-Z\s]+)/gi,
      /(?:prepare for|preparing for)\s+([a-zA-Z\s]+)/gi
    ]

    for (const pattern of goalPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const goal = match[1]?.trim()
        if (goal && goal.length > 2 && goal.length < 100) {
          insights.push({
            user_id: userId,
            insight_type: 'goal_mentioned',
            insight_content: goal,
            confidence_score: 85
          })
        }
      }
    }

    // Pattern 3: Topic interests (ENHANCED)
    const interestPatterns = [
      /(?:interested in|love|enjoy|passionate about|fascinated by|excited about|really like)\s+([a-zA-Z\s]+)/gi,
      /([a-zA-Z\s]+)\s+(?:is|are)\s+(?:interesting|fascinating|exciting|amazing|cool)/gi,
      /(?:good at|strong in|excel at)\s+([a-zA-Z\s]+)/gi
    ]

    for (const pattern of interestPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const topic = match[1]?.trim()
        if (topic && topic.length > 2 && topic.length < 50) {
          insights.push({
            user_id: userId,
            insight_type: 'topic_interest',
            insight_content: topic,
            confidence_score: 80
          })
        }
      }
    }

    // Pattern 4: Career transitions (ENHANCED)
    const careerPatterns = [
      /(?:switch|transition|move|change)\s+(?:to|into|from)\s+([a-zA-Z\s]+)/gi,
      /(?:currently|working as|I am|I'm)\s+(?:a\s+)?([a-zA-Z\s]+)\s+(?:but|and)/gi,
      /(?:career|job)\s+in\s+([a-zA-Z\s]+)/gi,
      /(?:work in|working in)\s+([a-zA-Z\s]+)/gi
    ]

    for (const pattern of careerPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const career = match[1]?.trim()
        if (career && career.length > 2 && career.length < 50) {
          insights.push({
            user_id: userId,
            insight_type: 'career_context',
            insight_content: career,
            confidence_score: 70
          })
        }
      }
    }

    // Pattern 5: Exam Preparation (NEW)
    const examPatterns = [
      /(?:preparing for|prep for|studying for)\s+(JAMB|WAEC|NECO|UTME|IELTS|TOEFL|SAT|GRE|GMAT)/gi,
      /(?:taking|writing)\s+(JAMB|WAEC|NECO|UTME|IELTS|TOEFL|SAT)/gi,
      /exam\s+(?:in|for)\s+([a-zA-Z\s]+)/gi
    ]

    for (const pattern of examPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const exam = match[1]?.trim()
        if (exam) {
          insights.push({
            user_id: userId,
            insight_type: 'exam_preparation',
            insight_content: exam,
            confidence_score: 90
          })
        }
      }
    }

    // Pattern 6: Skill Level Assessment (NEW)
    const skillLevelPatterns = [
      /(?:beginner|novice|new to|just starting)\s+(?:in|with|at)?\s*([a-zA-Z\s]+)/gi,
      /(?:advanced|expert|proficient|experienced)\s+(?:in|with|at)?\s*([a-zA-Z\s]+)/gi,
      /(?:intermediate|moderate)\s+(?:level|knowledge|skills)?\s+(?:in|with|at)?\s*([a-zA-Z\s]+)/gi
    ]

    for (const pattern of skillLevelPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        const skill = match[1]?.trim()
        if (skill && skill.length > 2 && skill.length < 50) {
          insights.push({
            user_id: userId,
            insight_type: 'skill_level',
            insight_content: skill,
            confidence_score: 75
          })
        }
      }
    }

    // Pattern 7: Time Constraints (NEW)
    const timeConstraintPatterns = [
      /(?:only have|have only)\s+(\d+)\s+(hour|hours|minutes|days|weeks|months)/gi,
      /(?:limited time|short time|not much time)/gi,
      /(?:busy|hectic) schedule/gi
    ]

    for (const pattern of timeConstraintPatterns) {
      const matches = userMessage.matchAll(pattern)
      for (const match of matches) {
        insights.push({
          user_id: userId,
          insight_type: 'time_constraint',
          insight_content: match[0],
          confidence_score: 70
        })
      }
    }

    // Save insights to database (deduplicate)
    if (insights.length > 0) {
      // Check for existing similar insights
      const { data: existingInsights } = await supabase
        .from('conversation_insights')
        .select('insight_content, insight_type')
        .eq('user_id', userId)
        .eq('is_active', true)

      const existingSet = new Set(
        existingInsights?.map(i => `${i.insight_type}:${i.insight_content.toLowerCase()}`) || []
      )

      // Filter out duplicates
      const newInsights = insights.filter(insight => {
        const key = `${insight.insight_type}:${insight.insight_content.toLowerCase()}`
        return !existingSet.has(key)
      })

      if (newInsights.length > 0) {
        const { error: insertError } = await supabase
          .from('conversation_insights')
          .insert(newInsights)

        if (insertError) {
          console.error('Error inserting insights:', insertError)
        }
      }

      return NextResponse.json({
        success: true,
        insights_extracted: newInsights.length,
        insights: newInsights
      })
    }

    return NextResponse.json({
      success: true,
      insights_extracted: 0
    })
  } catch (error) {
    console.error('Extract insights error:', error)
    return NextResponse.json({ error: 'Failed to extract insights' }, { status: 500 })
  }
}


// ============================================
// HANDLER: Update Learning Context
// ============================================
async function updateLearningContext(userId: string, contextData: any) {
  try {
    // Check if context exists
    const { data: existing } = await supabase
      .from('user_learning_context')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_learning_context')
        .update({
          ...contextData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error
    } else {
      // Insert new
      const { error } = await supabase
        .from('user_learning_context')
        .insert({
          user_id: userId,
          ...contextData
        })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update context error:', error)
    return NextResponse.json({ error: 'Failed to update context' }, { status: 500 })
  }
}

// ============================================
// HANDLER: Add Milestone
// ============================================
async function addMilestoneHandler(userId: string, milestoneData: any) {
  try {
    const { data, error } = await supabase.rpc('add_milestone', {
      p_user_id: userId,
      p_milestone_type: milestoneData.type,
      p_milestone_name: milestoneData.name,
      p_milestone_description: milestoneData.description || null,
      p_metadata: JSON.stringify(milestoneData.metadata || {})
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      milestone_id: data
    })
  } catch (error) {
    console.error('Add milestone error:', error)
    return NextResponse.json({ error: 'Failed to add milestone' }, { status: 500 })
  }
}

// ============================================
// HANDLER: Mark Milestone as Celebrated
// ============================================
async function markMilestoneCelebrated(userId: string, milestoneId: string) {
  try {
    const { error } = await supabase
      .from('learning_milestones')
      .update({ celebrated: true })
      .eq('id', milestoneId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark celebrated error:', error)
    return NextResponse.json({ error: 'Failed to mark milestone' }, { status: 500 })
  }
}

// ============================================
// HANDLER: Get User Context
// ============================================
async function getUserContext(userId: string) {
  try {
    // ✅ Auto-expire insights older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await supabase
      .from('conversation_insights')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('extracted_at', thirtyDaysAgo.toISOString())

    // Get learning context
    const { data: context } = await supabase
      .from('user_learning_context')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get study streak
    const { data: streak } = await supabase
      .from('study_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get uncelebrated milestones
    const { data: milestones } = await supabase
      .from('learning_milestones')
      .select('*')
      .eq('user_id', userId)
      .eq('celebrated', false)
      .order('achieved_at', { ascending: false })
      .limit(5)

    // Get active insights (only recent ones)
    const { data: insights } = await supabase
      .from('conversation_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('extracted_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      context: context || null,
      streak: streak || null,
      uncelebrated_milestones: milestones || [],
      insights: insights || []
    })
  } catch (error) {
    console.error('Get context error:', error)
    return NextResponse.json({ error: 'Failed to get context' }, { status: 500 })
  }
}

// ============================================
// GET: Retrieve User Context
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    return await getUserContext(userId)
  } catch (error) {
    console.error('Memory API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}