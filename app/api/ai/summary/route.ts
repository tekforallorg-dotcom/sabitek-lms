import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

// One-time generation per lesson (cached in lesson_summaries), so this
// is a publish-time cost, not a per-learner cost.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { lessonId, content, contentType } = await req.json()

    // Verify the lesson exists
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if summary already exists
    const { data: existingSummary } = await supabase
      .from('lesson_summaries')
      .select('summary')
      .eq('lesson_id', lessonId)
      .single()

    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary.summary })
    }

    // Generate summary based on content type
    let prompt = ''
    
    if (contentType === 'text') {
      prompt = `Summarize the following lesson content in a clear, concise manner suitable for students. 
      Focus on key concepts, main points, and important takeaways. 
      Keep it under 200 words and use bullet points where appropriate.
      
      Lesson content: ${content}`
    } else if (contentType === 'youtube') {
      prompt = `This is a video lesson. Since we cannot process the video content directly, 
      please provide a generic structure for what students should focus on when watching the video:
      - Key points to watch for
      - Suggested note-taking approach
      - How to identify important concepts
      
      Video Title: ${lesson.title}`
    } else {
      prompt = `Create a brief overview for this ${contentType} lesson titled "${lesson.title}". 
      Include what students should focus on and how to approach this type of content.`
    }

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system:
        'You are an educational assistant helping students understand lesson content. Provide clear, concise summaries focused on learning objectives.',
      messages: [{ role: 'user', content: prompt }],
    })

    const firstBlock = completion.content[0]
    const summary = firstBlock?.type === 'text' ? firstBlock.text : ''

    // Store the summary for future use
    await supabase
      .from('lesson_summaries')
      .insert({
        lesson_id: lessonId,
        summary: summary,
        generated_at: new Date().toISOString()
      })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}