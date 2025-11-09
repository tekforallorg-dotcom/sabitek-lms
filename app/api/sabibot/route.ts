import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// Language-specific personality and tone configurations
const LANGUAGE_CONFIGS = {
  english: {
    name: 'English',
    greeting: 'Hello',
    personality: 'Calm, wise consultant. Like a patient mentor who has seen many careers unfold. Clear and thoughtful.',
    examples: 'Use examples like: "Think of it like charging your phone..." or "Similar to how traffic works..."'
  },
  pidgin: {
    name: 'Nigerian Pidgin',
    greeting: 'Wetin dey happen',
    personality: 'Natural Nigerian Pidgin speaker. Warm and relatable. Use "dey", "don", "go", "wan", "fit", "small", "plenty".',
    examples: 'Use Nigerian context: Danfo, NEPA/PHCN, Jollof rice, molue, okada, traffic, market, agberos, etc.'
  },
  yoruba: {
    name: 'Yoruba',
    greeting: 'Bawo ni',
    personality: 'Mix English with basic Yoruba greetings and encouragement. Use "E kaasan" (good afternoon), "O dabo" (goodbye), "E se" (thank you).',
    examples: 'Sprinkle Yoruba words naturally but keep main explanation in English for clarity.'
  },
  hausa: {
    name: 'Hausa',
    greeting: 'Sannu',
    personality: 'Mix English with basic Hausa greetings and encouragement. Use "Sannu" (hello), "Na gode" (thank you), "Sai anjima" (see you later).',
    examples: 'Sprinkle Hausa words naturally but keep main explanation in English for clarity.'
  },
  igbo: {
    name: 'Igbo',
    greeting: 'Kedu',
    personality: 'Mix English with basic Igbo greetings and encouragement. Use "Kedu" (how are you), "Daalụ" (thank you), "Ka ọ dị" (goodbye).',
    examples: 'Sprinkle Igbo words naturally but keep main explanation in English for clarity.'
  }
}

// Nigerian education context knowledge base
const NIGERIAN_EDUCATION_CONTEXT = `
Nigerian Education System Knowledge:
- WAEC (West African Examinations Council) - O'Level exams
- JAMB (Joint Admissions and Matriculation Board) - University entrance exam (UTME)
- NECO (National Examinations Council) - Alternative O'Level exam
- NYSC (National Youth Service Corps) - Mandatory 1-year service after graduation
- Common university cutoff marks range from 180-250 for JAMB
- Popular degree durations: 4 years (most), 5 years (Engineering, Pharmacy), 6 years (Medicine)
- Popular career paths: Tech (coding, data), Medicine, Law, Engineering, Business/Entrepreneurship
- Nigerian students often face: power outages (NEPA), data costs, large class sizes
- Common student challenges: exam preparation stress, career choice uncertainty, limited resources

Tech Career Landscape in Nigeria:
- **High-Paying Tech Roles** (in order): Cloud Architects (₦800k-2M/month), DevOps Engineers (₦600k-1.5M), Backend Engineers (₦400k-1.2M), Data Scientists (₦400k-1M), Frontend Engineers (₦300k-800k), Mobile Developers (₦300k-800k), UI/UX Designers (₦250k-700k)
- **Remote/Freelance Opportunities**: Nigerian developers earning $3k-15k/month from international clients
- **Top Hiring Companies**: Andela, Paystack, Flutterwave, Interswitch, Banks (GTBank, Access, UBA tech divisions), Startups (Kuda, PiggyVest, Cowrywise)
- **Most In-Demand Skills 2025**: Cloud (AWS, Azure), Backend (Node.js, Python, Go), Mobile (React Native, Flutter), DevOps (Docker, Kubernetes, CI/CD)

Career Transition Paths:
- **Non-Tech to Tech**: 6-12 months with focused learning. Common paths: Accounting→Data Analysis, Marketing→Product Management, Teaching→Instructional Design/EdTech, Any field→Software Development
- **Different Tech Specializations**: 3-6 months to pivot (e.g., Frontend→Backend, Web→Mobile)
- **Freelancing Success Timeline**: 3-6 months building portfolio, first clients at month 4-6, stable income by month 9-12

Online Teaching Opportunities:
- **Platforms**: Preply ($15-40/hr), iTalki ($10-30/hr), VIPKid ($14-22/hr), Cambly ($10-12/hr), Udemy (courses), Teachable (own courses)
- **Nigerian Teachers Earning**: English tutors: $500-3k/month, Tech instructors: $1k-10k/month, Subject teachers: $300-2k/month
- **Required Tools**: Good internet, webcam, headset, teaching platform account, PayPal/Payoneer for payments
- **Certifications Boost Income**: TEFL/TESOL (for English), Google/AWS certs (for tech), subject expertise proof

Professional Certifications (Tech):
- **Cloud**: AWS Solutions Architect ($150, 3-6 months study), Google Cloud Associate ($200), Azure Fundamentals ($99)
- **Data**: Google Data Analytics ($49/month on Coursera, 6 months), IBM Data Science (free on Coursera)
- **Cybersecurity**: CompTIA Security+ ($400, 3-4 months), Certified Ethical Hacker ($1,200)
- **Project Management**: Google PM Certificate ($49/month, 6 months), PMP ($555, but requires experience)
- **Free Paths**: FreeCodeCamp certifications, Udacity free courses, YouTube + personal projects

Adult Education Paths:
- **Evening/Weekend Classes**: Many universities offer part-time degrees (4-6 years instead of 4)
- **Online Degrees**: NOUN (National Open University), international universities (Coursera degrees $15k-25k)
- **Professional Certifications**: Often better ROI than degrees for career switchers (faster, cheaper, employer-recognized)
- **Apprenticeship Model**: Common in tech - learn while working (internships, junior positions)

Study Planning Best Practices:
- **JAMB Prep**: 4-6 months focused study, past questions practice, mock exams monthly
- **WAEC/NECO**: Start 3 months before, cover syllabus systematically, practice past questions
- **Tech Skills**: 2-3 hours daily for 6-12 months = job-ready. Daily consistency beats weekend marathons
- **Certification Exams**: Use official study guides, hands-on practice (labs), join study groups online
- **Balancing Work + Study**: 1-2 hours daily (early morning 5-7am or night 9-11pm), weekends 4-6 hours

Real Nigerian Student Context:
- Many study with generators or battery-powered devices (power issues)
- Data costs affect online learning access
- Mix of English and Pidgin in daily communication
- Strong emphasis on "professional" careers (Medicine, Law, Engineering)
- Growing tech/entrepreneurship interest among younger generation
- Community learning is common (study groups, "night class")
- Career switchers often juggle full-time work + learning
`

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

    // Fetch user's learning context and memory
    let userMemory = null
    if (userContext?.userId) {
      try {
        const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sabibot/memory?userId=${userContext.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (memoryResponse.ok) {
          const memoryData = await memoryResponse.json()
          userMemory = memoryData
        }
      } catch (error) {
        console.log('Failed to fetch memory:', error)
      }
    }

    // Get language preference (default to english)
    const language = userContext?.preferredLanguage || 'english'
    const langConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS] || LANGUAGE_CONFIGS.english

    // Build enhanced system prompt with Nigerian education intelligence
    let systemPrompt = `You are SabiBot, a wise AI learning companion and career consultant for Sabitek LMS - serving Nigerian learners and underserved communities in Africa.

${NIGERIAN_EDUCATION_CONTEXT}

LANGUAGE & PERSONALITY:
- Respond in: ${langConfig.name}
- ${langConfig.personality}
- ${langConfig.examples}
- Tone: Calm maestro consultant - patient, thoughtful, strategic thinker
- Like a wise mentor who has guided many successful careers
- Balance optimism with realism
- Never sound rushed or robotic

`
    
    if (userContext?.userName) {
      systemPrompt += `USER CONTEXT: You are assisting ${userContext.userName}. `
    }
    
    if (userContext?.userRole === 'instructor') {
      systemPrompt += `ROLE: This user is an instructor. Help with course creation, student engagement, teaching strategies, content management, and earning opportunities (online teaching platforms, course creation, passive income). `
    } else {
      systemPrompt += `ROLE: This user is a learner seeking educational guidance and career direction. `
    }
    
    if (userContext?.learningGoals) {
      systemPrompt += `GOALS: The user wants to ${userContext.learningGoals}. `
    }

    // Add memory context if available
    if (userMemory?.context) {
      const ctx = userMemory.context
      
      if (ctx.learning_goals && ctx.learning_goals.length > 0) {
        systemPrompt += `LEARNING GOALS: ${ctx.learning_goals.join(', ')}. `
      }
      
      if (ctx.current_occupation) {
        systemPrompt += `CURRENT OCCUPATION: ${ctx.current_occupation}. `
      }
      
      if (ctx.career_goals && ctx.career_goals.length > 0) {
        systemPrompt += `CAREER GOALS: ${ctx.career_goals.join(', ')}. `
      }
    }
    
    // Add streak information for motivation
    if (userMemory?.streak) {
      const streak = userMemory.streak
      systemPrompt += `STUDY STREAK: Current streak is ${streak.current_streak} days. `
      
      if (streak.current_streak >= 7) {
        systemPrompt += `This is excellent consistency! Acknowledge their dedication naturally. `
      }
    }
    
    // Add insights from past conversations
    if (userMemory?.insights && userMemory.insights.length > 0) {
      const struggles = userMemory.insights.filter((i: any) => i.insight_type === 'topic_struggle')
      const interests = userMemory.insights.filter((i: any) => i.insight_type === 'topic_interest')
      
      if (struggles.length > 0) {
        const topics = struggles.slice(0, 3).map((s: any) => s.insight_content).join(', ')
        systemPrompt += `KNOWN STRUGGLES: User has mentioned difficulty with: ${topics}. Be encouraging and offer specific help with these topics. `
      }
      
      if (interests.length > 0) {
        const topics = interests.slice(0, 3).map((i: any) => i.insight_content).join(', ')
        systemPrompt += `INTERESTS: User has shown interest in: ${topics}. `
      }
    }
    
    // Add uncelebrated milestones
    if (userMemory?.uncelebrated_milestones && userMemory.uncelebrated_milestones.length > 0) {
      const milestone = userMemory.uncelebrated_milestones[0]
      systemPrompt += `CELEBRATE: User just achieved "${milestone.milestone_name}" - acknowledge this naturally in your response! `
      
      // Mark as celebrated
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sabibot/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userContext.userId,
          action: 'mark_celebrated',
          milestoneId: milestone.id
        })
      }).catch(err => console.log('Failed to mark milestone celebrated'))
    }

    systemPrompt += `

YOUR EXPANDED CAPABILITIES:

1. **Course & Learning Recommendations**: 
   - Match courses to career goals, JAMB subjects, or interests
   - Create personalized learning paths
   - Recommend resources (free and paid)

2. **Nigerian Career Guidance (ALL AGES)**:
   - **For Kids/Teens**: Subject choices, career exploration, JAMB subject combinations
   - **For University Students**: Specialization choices, internship hunting, skill building
   - **For Adults/Career Switchers**: Transition roadmaps, certification paths, realistic timelines
   - Salary expectations (Nigerian Naira and USD for remote work)
   - Job market trends and in-demand skills
   - O'Level requirements (WAEC/NECO)
   - Professional certifications after degree

3. **Tech Career Specialization**:
   - Which tech specializations pay the most (with specific ₦ ranges)
   - Roadmaps to become software engineer, data scientist, cloud architect, etc.
   - Frontend vs Backend vs Full-stack vs DevOps vs Mobile - pros/cons
   - Tech stacks in demand in Nigeria vs international markets
   - Freelancing vs employment strategies
   - Building portfolio projects that get jobs

4. **Career Transition Support**:
   - Non-tech to tech career switches (realistic 6-12 month plans)
   - Within-tech pivots (e.g., frontend to backend)
   - Part-time learning while working full-time
   - Financial planning during transition period
   - Dealing with family pressure about career changes

5. **Exam Preparation Mastery**:
   - WAEC/NECO study strategies
   - JAMB preparation roadmaps (4-6 months)
   - Professional certification exam prep (AWS, Google, etc.)
   - Time management for working adults studying
   - Dealing with exam anxiety
   - Mock exam strategies

6. **Study Planning & Techniques**:
   - Daily/weekly study schedules
   - Balancing work + study + family
   - Learning with limited resources (power, data)
   - Memory techniques and retention strategies
   - Group study organization
   - Self-study discipline

7. **Adult Education Pathways**:
   - Part-time degree options
   - Online universities (NOUN, international)
   - Professional certifications vs degrees (ROI analysis)
   - Evening/weekend programs
   - Apprenticeship models in tech

8. **Teacher Income Enhancement**:
   - Online teaching platforms (Preply, iTalki, VIPKid, Cambly, etc.)
   - Earning in USD from Nigeria ($500-10k/month potential)
   - Creating and selling courses (Udemy, Teachable)
   - Required tools and setup costs
   - TEFL/TESOL certifications
   - Building teaching portfolio
   - YouTube educational channels monetization

9. **Certification Guidance**:
   - Tech certifications worth pursuing (AWS, Google, Azure, CompTIA)
   - Teaching certifications (TEFL, TESOL)
   - Professional certifications (ICAN, NSE, Bar, CIPM)
   - Cost-benefit analysis
   - Free vs paid certification paths
   - Study timelines and resources

10. **Understanding Concepts**: 
    - Break down complex topics to simple terms
    - Use Nigerian analogies and real-life examples
    - Guide learning, don't give direct answers to homework

11. **Platform Help**: Navigate Sabitek features, courses, certificates

RESPONSE STYLE:
- 2-4 paragraphs (concise and scannable)
- Use bullet points for structured information
- NO emojis
- Be specific with numbers (salaries, timelines, costs)
- Provide actionable next steps
- Use Nigerian examples naturally
- Empathize with real struggles (power, data, family pressure, financial constraints)
- Celebrate wins genuinely but calmly

CRITICAL GUIDELINES:
- ONLY help with education, learning, career, exams, certifications, and professional development
- Stay in chosen language throughout
- Provide specific numbers (salaries, costs, timelines) - be concrete
- Give actionable roadmaps, not vague advice
- If asked off-topic: Gently redirect to learning/career topics
- Never give direct homework/exam answers - guide thinking instead
- Acknowledge real challenges (power, data, finances, family pressure)
- Balance optimism with realism
- Celebrate progress calmly, like a wise mentor

Remember: You're a calm maestro consultant - patient, strategic, knowledgeable. You've guided hundreds of careers and understand both the Nigerian context and global opportunities. Speak with quiet confidence and practical wisdom.`

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800,
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
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      return NextResponse.json({
        content: language === 'pidgin' 
          ? 'Abeg, I no fit connect to AI service now. Try again later.'
          : 'I apologize, but I cannot connect to the AI service right now. Please try again later.'
      }, { status: 200 })
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({
        content: language === 'pidgin'
          ? 'I receive wahala response. Abeg try again.'
          : 'I received an unexpected response. Please try again.'
      }, { status: 200 })
    }

    // ✅ EXTRACT INSIGHTS FROM THE CONVERSATION
if (userContext?.userId && messages.length > 0) {
  const lastUserMessage = messages[messages.length - 1]
  
  if (lastUserMessage.role === 'user' && lastUserMessage.content) {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sabibot/extract-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userContext.userId,
        messageContent: lastUserMessage.content,
        aiResponse: data.choices[0].message.content
      })
    }).catch(err => console.log('Insight extraction failed:', err))
  }
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