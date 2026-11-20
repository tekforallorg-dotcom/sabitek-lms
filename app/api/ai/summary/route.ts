import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { canAccessCourseContent } from '@/lib/access/course-tenancy'

// Bound the prompt so one request cannot run up an arbitrary bill.
const MAX_LESSON_CHARS = 12000

const SUMMARY_MODEL = 'deepseek-chat'

// One generation per lesson: the summary is cached in lesson_ai_artifacts and
// served to every later learner, so this is a per-lesson cost, not a
// per-learner one. Instructors clear it via /api/ai/invalidate-lesson when the
// lesson changes. Runs on DeepSeek (mirrors the SabiBot pattern): the OpenAI
// SDK pointed at DeepSeek's OpenAI-compatible endpoint.
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

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // The lesson's content and type are read here, on the server. They are not
    // taken from the request: the result is cached for everyone, so a caller
    // must not be able to choose what gets summarised.
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, title, course_id, content, content_type')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (!lesson.course_id || !(await canAccessCourseContent(auth.user.id, lesson.course_id))) {
      return NextResponse.json({ error: 'You do not have access to this lesson' }, { status: 403 })
    }

    // Serve the cached summary if there is one.
    const { data: cached } = await supabaseAdmin
      .from('lesson_ai_artifacts')
      .select('summary')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (cached?.summary) {
      return NextResponse.json({ summary: cached.summary })
    }

    const contentType = lesson.content_type || 'text'
    const content = (lesson.content || '').slice(0, MAX_LESSON_CHARS)

    // Generate summary based on content type
    let prompt = ''

    if (contentType === 'text' && content) {
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
      model: SUMMARY_MODEL,
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

    // Cache it for the next learner. A failed write only costs a regeneration.
    if (summary) {
      const { error: cacheError } = await supabaseAdmin
        .from('lesson_ai_artifacts')
        .upsert(
          {
            lesson_id: lessonId,
            summary,
            model: SUMMARY_MODEL,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'lesson_id' }
        )
      if (cacheError) {
        console.error('Could not cache lesson summary:', cacheError.message)
      }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
