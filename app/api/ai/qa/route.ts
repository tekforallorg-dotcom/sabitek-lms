import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { lessonId, question, lessonContent, contentType } = await req.json()

    if (!question || !lessonId) {
      return NextResponse.json(
        { error: 'Question and lesson ID are required' },
        { status: 400 }
      )
    }

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('title, content')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Store the question for analytics
    await supabase
      .from('lesson_questions')
      .insert({
        lesson_id: lessonId,
        question: question,
        asked_at: new Date().toISOString()
      })

    // Generate context-aware response
    let systemPrompt = `You are an educational AI assistant helping a student understand a lesson titled "${lesson.title}". 
    Be helpful, clear, and encouraging. Keep answers concise but comprehensive.
    Focus on educational value and helping the student learn.`

    let userPrompt = ''

    if (contentType === 'text' && lessonContent) {
      userPrompt = `Based on this lesson content: "${lessonContent}"
      
      Student's question: ${question}
      
      Please provide a helpful answer that references the lesson material when relevant.`
    } else if (contentType === 'youtube') {
      userPrompt = `This is a video lesson. The student is asking: ${question}
      
      Since we don't have the video transcript, provide a general educational response about the topic "${lesson.title}" 
      and suggest how they might find the answer in the video (e.g., what to look for, typical video structure for this topic).`
    } else {
      userPrompt = `The student is studying a ${contentType} lesson titled "${lesson.title}" and asks: ${question}
      
      Provide a helpful educational response based on common knowledge about this topic.`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const answer = completion.choices[0].message.content

    // Store Q&A pair for future reference
    await supabase
      .from('lesson_qa_history')
      .insert({
        lesson_id: lessonId,
        question: question,
        answer: answer,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error generating answer:', error)
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    )
  }
}