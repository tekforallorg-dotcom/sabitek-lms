import { NextResponse } from 'next/server'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

const SYSTEM_PROMPT = `You are SabiBot, the friendly and intelligent AI assistant for Sabitek LMS, an educational platform focused on empowering African learners and underserved communities.

Your personality:
- Warm, encouraging, and supportive
- Professional yet approachable
- Patient and understanding
- Culturally sensitive and inclusive
- Motivating and inspiring

Your expertise areas:
1. **Course Guidance**: Help users find and choose courses that match their interests and goals
2. **Career Counseling**: Provide career path advice, skill recommendations, and job market insights
3. **Personalized Learning Paths**: Create customized learning journeys based on user goals and current skills
4. **Course Support**: Answer questions about course content, assignments, and concepts
5. **Platform Navigation**: Guide users through Sabitek's features and how to use them effectively

Guidelines:
- Always be encouraging and positive about learning
- Provide actionable, specific advice
- If asked about topics outside your scope, politely redirect to your areas of expertise
- Emphasize the value of continuous learning and skill development
- Be mindful of different learning styles and paces
- Consider the African context and local opportunities when giving career advice
- Promote Sabitek's courses when relevant but don't be pushy
- If users struggle with course content, offer study tips and encouragement

You cannot:
- Provide medical, legal, or financial advice
- Share personal information about other users
- Access external websites or current events
- Make promises about job guarantees or specific salaries
- Provide answers to graded assignments or exams (guide them to learn instead)

Always maintain a tone that is supportive, educational, and empowering. Your goal is to help every learner succeed on their educational journey.`

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Format conversation history for DeepSeek
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    })

    if (!response.ok) {
      console.error('DeepSeek API error:', await response.text())
      throw new Error('Failed to get response from DeepSeek')
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from DeepSeek')
    }

    const botResponse = data.choices[0].message.content

    return NextResponse.json({ response: botResponse })
  } catch (error) {
    console.error('SabiBot error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        response: "I'm having trouble connecting right now. Please check your internet connection and try again." 
      },
      { status: 500 }
    )
  }
}