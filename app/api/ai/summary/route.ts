import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { canAccessCourseContent } from '@/lib/access/course-tenancy'

// Bound the prompt so one request cannot run up an arbitrary bill.
const MAX_LESSON_CHARS = 12000

// One-time generation per lesson (cached in lesson_summaries), so this
// is a publish-time cost, not a per-learner cost. Runs on DeepSeek
// (mirrors the SabiBot pattern): the OpenAI SDK pointed at DeepSeek's
// OpenAI-compatible endpoint.
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req)
    if ('error' in auth) return auth.error

    const body = await req.json()
    const lessonId: string | undefined = body.lessonId
    const contentType: string | undefined = body.contentType
    const content = typeof body.content === 'string' ? body.content.slice(0, MAX_LESSON_CHARS) : ''

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Verify the lesson exists and the caller may read it
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, title, course_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (!(await canAccessCourseContent(auth.user.id, lesson.course_id))) {
      return NextResponse.json({ error: 'You do not have access to this lesson' }, { status: 403 })
    }

    // Check if summary already exists
    const { data: existingSummary } = await supabaseAdmin
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
      model: 'deepseek-chat',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are an educational assistant helping students understand lesson content. Provide clear, concise summaries focused on learning objectives. Respond in plain text. Never use em dashes or en dashes; use commas, periods, or the word "and" instead.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const summary = completion.choices[0]?.message?.content || ''

    // Store the summary for future use
    await supabaseAdmin
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