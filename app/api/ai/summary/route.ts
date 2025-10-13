import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an educational assistant helping students understand lesson content. Provide clear, concise summaries focused on learning objectives.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const summary = completion.choices[0].message.content

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