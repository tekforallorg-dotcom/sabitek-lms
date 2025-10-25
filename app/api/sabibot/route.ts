import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { content: 'AI service is not configured. Please check your API key.' },
        { status: 200 }
      )
    }

    const body = await request.json()
    const { messages, userContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { content: 'I need a valid message to respond to. Please try again.' },
        { status: 200 }
      )
    }

    // Build personalized system prompt based on user context
    let systemPrompt = `You are SabiBot, an AI learning companion for Sabitek LMS.`
    
    if (userContext?.userName) {
      systemPrompt += ` You are assisting ${userContext.userName}.`
    }
    
    if (userContext?.userRole === 'instructor') {
      systemPrompt += ` The user is an instructor, so provide guidance on course creation, student management, and teaching strategies.`
    } else {
      systemPrompt += ` The user is a learner seeking educational guidance.`
    }
    
    if (userContext?.learningGoals) {
      systemPrompt += ` The user's learning goals include: ${userContext.learningGoals}.`
    }

    systemPrompt += `

Your personality:
- Professional and helpful
- Clear and concise
- Encouraging but not overly enthusiastic
- Never use emojis in your responses
- Personalized based on user's context and goals

Your capabilities:
1. Course recommendations based on career goals
2. Career path guidance and skill requirements
3. Study techniques and learning strategies
4. Help understanding course concepts (guide, don't give answers)
5. Platform navigation assistance

Rules:
- ONLY answer education, learning, career, and platform-related questions
- Keep responses clear and professional (2-3 paragraphs max)
- Use bullet points for lists
- No emojis or excessive formatting
- Personalize responses when you know the user's context
- If asked off-topic: "I'm here to help with your learning journey. How can I assist with courses, careers, or study strategies?"`

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status, response.statusText)
      return NextResponse.json({
        content: 'I apologize, but I cannot connect to the AI service right now. Please try again later.'
      }, { status: 200 })
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({
        content: 'I received an unexpected response. Please try again.'
      }, { status: 200 })
    }

    return NextResponse.json({
      content: data.choices[0].message.content
    }, { status: 200 })

  } catch (error) {
    console.error('SabiBot API error:', error)
    return NextResponse.json({
      content: 'I encountered an error. Please check your connection and try again.'
    }, { status: 200 })
  }
}