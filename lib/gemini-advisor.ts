import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// REQUEST CACHE - Prevent duplicate calls
const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>()
const CACHE_TTL = 300000 // 5 minutes cache

// RATE LIMITER - Prevent burst requests
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 3000 // 3 seconds between requests

export interface CareerTrack {
  name: string
  confidence: number
  why_fits: string
  salary_range_ngn: string
  time_to_job_ready: string
  top_skills: string[]
  entry_roles: string[]
  demand?: number
}

export interface MonthPlan {
  month: number
  title: string
  focus: string
  milestones: string[]
  skills: string[]
  projects: string[]
  resources: string[]
}

export interface NextStepsBlock {
  icon: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface CareerRecommendation {
  primary_tracks: CareerTrack[]
  alternative_tracks: CareerTrack[]
  overall_confidence: number
  next_steps: NextStepsBlock[]
  roadmap_6m: {
    track: string
    months: MonthPlan[]
  }
}

// Nigerian Tech Roles Catalog (50+ roles with complete data)
const NIGERIAN_TECH_ROLES = `
NIGERIAN TECH CAREER CATALOG (2025):

HIGH-DEMAND DEVELOPMENT ROLES:
1. Software Engineer - Frontend
   Demand: 87% | Entry: ₦300k | Mid: ₦650k | Senior: ₦1.6M
   Skills: HTML, CSS, JavaScript, React, Next.js, Tailwind, Git
   Timeline: 6-9 months | Certs: Meta Frontend, Google UX

2. Software Engineer - Backend  
   Demand: 85% | Entry: ₦350k | Mid: ₦700k | Senior: ₦1.7M
   Skills: Node.js, Python, REST APIs, SQL, Auth, Testing
   Timeline: 8-12 months | Certs: AWS Cloud Practitioner

3. Full-Stack Developer
   Demand: 83% | Entry: ₦350k | Mid: ₦700k | Senior: ₦1.8M
   Skills: React, Node.js, REST, SQL, Auth, Git, Deployment
   Timeline: 12-18 months | Most versatile role

4. Software Engineer (General)
   Demand: 88% | Entry: ₦350k | Mid: ₦700k | Senior: ₦1.8M
   Skills: Python, JavaScript, OOP, Data Structures
   Timeline: 8-12 months | Very broad role

MOBILE & UI/UX:
5. Mobile Developer (Flutter)
   Demand: 75% | Entry: ₦350k | Mid: ₦650k | Senior: ₦1.6M
   Skills: Flutter, Dart, Firebase, APIs, Mobile UI
   Timeline: 8-12 months | Huge SME demand

6. Mobile Developer (React Native)
   Demand: 70% | Entry: ₦320k | Mid: ₦600k | Senior: ₦1.5M
   Skills: React Native, JavaScript, APIs
   Timeline: 8-12 months | Strong fintech demand

7. UI/UX Designer
   Demand: 78% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.3M
   Skills: Figma, Wireframes, Prototyping, User Research
   Timeline: 6-12 months | Certs: Google UX Design

8. Frontend Developer
   Demand: 84% | Entry: ₦300k | Mid: ₦600k | Senior: ₦1.5M
   Skills: HTML, CSS, JavaScript, React
   Timeline: 6-9 months | Very accessible entry

CLOUD & INFRASTRUCTURE:
9. Cloud Architect
   Demand: 34% | Entry: ₦700k | Mid: ₦1.3M | Senior: ₦3.5M
   Skills: AWS, Azure, VPC, IAM, Serverless, IaC
   Timeline: 18-24 months | Requires prior experience

10. DevOps Engineer
    Demand: 68% | Entry: ₦450k | Mid: ₦900k | Senior: ₦2.2M
    Skills: Linux, Docker, CI/CD, Kubernetes, Terraform
    Timeline: 12-18 months | Certs: AWS DevOps, CKA

11. Cloud Engineer
    Demand: 66% | Entry: ₦450k | Mid: ₦900k | Senior: ₦2.3M
    Skills: AWS/Azure, Networking, Security
    Timeline: 12-18 months | Strong growth area

12. Site Reliability Engineer (SRE)
    Demand: 38% | Entry: ₦500k | Mid: ₦1M | Senior: ₦2.6M
    Skills: Reliability, Monitoring, Automation
    Timeline: 18-24 months | Adopted in startups

DATA & AI:
13. Data Scientist
    Demand: 55% | Entry: ₦400k | Mid: ₦900k | Senior: ₦2.5M
    Skills: Python, Statistics, ML, Pandas, Scikit-Learn
    Timeline: 12-18 months | Portfolio matters most

14. Data Analyst
    Demand: 86% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.2M
    Skills: Excel, SQL, Power BI, Python basics
    Timeline: 3-6 months | Very accessible entry

15. Data Engineer
    Demand: 52% | Entry: ₦400k | Mid: ₦900k | Senior: ₦2.4M
    Skills: ETL, Airflow, Python, SQL, Data Pipelines
    Timeline: 12-18 months | High demand in fintech

16. Machine Learning Engineer
    Demand: 48% | Entry: ₦450k | Mid: ₦1M | Senior: ₦2.8M
    Skills: ML Ops, TensorFlow, Python, MLOps
    Timeline: 18-24 months | Requires strong math

17. Business Intelligence Analyst
    Demand: 64% | Entry: ₦300k | Mid: ₦600k | Senior: ₦1.4M
    Skills: ETL, Power BI, Tableau, SQL
    Timeline: 6-9 months | Strong in banks/retail

18. AI Engineer / GenAI
    Demand: 46% | Entry: ₦450k | Mid: ₦1M | Senior: ₦3M
    Skills: LLMs, RAG, OpenAI APIs, Prompt Engineering
    Timeline: 12-18 months | Emerging field

SECURITY & QUALITY:
19. Cybersecurity Analyst
    Demand: 72% | Entry: ₦350k | Mid: ₦800k | Senior: ₦2.2M
    Skills: SIEM, Threat Detection, Network Security
    Timeline: 12-18 months | Certs: Security+, CySA+

20. Cybersecurity Specialist
    Demand: 70% | Entry: ₦350k | Mid: ₦750k | Senior: ₦2M
    Skills: Security Tools, Incident Response
    Timeline: 12-18 months | NDPR compliance demand

21. Quality Assurance (Manual Tester)
    Demand: 61% | Entry: ₦250k | Mid: ₦450k | Senior: ₦1.1M
    Skills: Test Cases, ISTQB, Manual Testing
    Timeline: 3-6 months | Easy entry point

22. QA Automation Engineer
    Demand: 50% | Entry: ₦350k | Mid: ₦700k | Senior: ₦1.7M
    Skills: Selenium, Playwright, Python/JS
    Timeline: 9-12 months | Higher paid than manual

23. SOC Analyst (Blue Team)
    Demand: 60% | Entry: ₦320k | Mid: ₦700k | Senior: ₦2M
    Skills: SIEM, Log Analysis, Threat Hunting
    Timeline: 12-15 months | 24/7 operations

IT SUPPORT & ADMIN:
24. IT Support / Helpdesk
    Demand: 92% | Entry: ₦180k | Mid: ₦360k | Senior: ₦600k
    Skills: Hardware, Networking, Windows, Troubleshooting
    Timeline: 1-3 months | Easiest tech entry

25. Systems Administrator
    Demand: 57% | Entry: ₦280k | Mid: ₦550k | Senior: ₦1.3M
    Skills: Windows Server, Active Directory, Networking
    Timeline: 6-12 months | Gateway to DevOps

26. Network Engineer
    Demand: 58% | Entry: ₦300k | Mid: ₦650k | Senior: ₦1.6M
    Skills: Routing, CCNA, VPN, Firewalls
    Timeline: 9-15 months | ISPs, banks, telcos

SPECIALIZED TECHNICAL:
27. Product Manager (Tech)
    Demand: 54% | Entry: ₦400k | Mid: ₦900k | Senior: ₦2.5M
    Skills: Planning, Agile, Product Strategy
    Timeline: 12-24 months | Requires tech + business

28. Technical Writer
    Demand: 42% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.2M
    Skills: Documentation, API Writing, Markdown
    Timeline: 3-6 months | Very remote-friendly

29. IT Project Manager
    Demand: 53% | Entry: ₦400k | Mid: ₦900k | Senior: ₦2.4M
    Skills: Planning, PMP, Agile, Stakeholder Management
    Timeline: 12-18 months | Needs maturity

30. Scrum Master / Agile Coach
    Demand: 39% | Entry: ₦300k | Mid: ₦600k | Senior: ₦1.5M
    Skills: Agile, Scrum, Facilitation
    Timeline: 6-12 months | CSM certification

EMERGING & NICHE:
31. Blockchain Developer
    Demand: 21% | Entry: ₦300k | Mid: ₦700k | Senior: ₦2M
    Skills: Solidity, Web3, Smart Contracts
    Timeline: 12-18 months | Niche but growing

32. Game Developer
    Demand: 22% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.3M
    Skills: Unity, C#, Game Design
    Timeline: 12-18 months | Small but passionate

33. EdTech Content Developer
    Demand: 33% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.1M
    Skills: Instructional Design, LMS
    Timeline: 3-6 months | Growing with online learning

34. GIS Analyst
    Demand: 27% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.2M
    Skills: ArcGIS, QGIS, Spatial Analysis
    Timeline: 6-12 months | Government, NGOs

35. AI Prompt Engineer / Evaluator
    Demand: 23% | Entry: ₦300k | Mid: ₦700k | Senior: ₦1.8M
    Skills: Prompt Engineering, LLM Testing
    Timeline: 3-6 months | Very new field

BUSINESS & OPERATIONS:
36. Digital Marketing (Performance)
    Demand: 65% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.2M
    Skills: Ads, SEO, Analytics, Content
    Timeline: 3-6 months | High freelance demand

37. Social Media Manager (Tech-adjacent)
    Demand: 59% | Entry: ₦180k | Mid: ₦350k | Senior: ₦800k
    Skills: Content, Hootsuite, Analytics
    Timeline: 1-3 months | Entry point for many

38. Business Analyst (IT)
    Demand: 62% | Entry: ₦300k | Mid: ₦600k | Senior: ₦1.4M
    Skills: Requirements Analysis, SQL, Process Mapping
    Timeline: 6-9 months | Bridge role

39. Customer Success (SaaS)
    Demand: 46% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.2M
    Skills: Onboarding, Product Knowledge
    Timeline: 1-3 months | People skills + tech

40. Salesforce Admin/Consultant
    Demand: 28% | Entry: ₦350k | Mid: ₦800k | Senior: ₦2.2M
    Skills: CRM, Salesforce Platform
    Timeline: 6-12 months | Trailhead certification

SPECIALIZED ENGINEERING:
41. Embedded Systems / IoT Engineer
    Demand: 29% | Entry: ₦300k | Mid: ₦650k | Senior: ₦1.7M
    Skills: C/C++, Microcontrollers, RTOS
    Timeline: 12-18 months | Hardware + software

42. Robotics Technician
    Demand: 18% | Entry: ₦200k | Mid: ₦400k | Senior: ₦900k
    Skills: Mechatronics, Programming, Electronics
    Timeline: 12-18 months | Manufacturing focus

43. Hardware / PC Technician
    Demand: 52% | Entry: ₦150k | Mid: ₦250k | Senior: ₦450k
    Skills: Repairs, Hardware, Diagnostics
    Timeline: 1-3 months | Computer village, SMEs

44. AR/VR Developer
    Demand: 15% | Entry: ₦250k | Mid: ₦500k | Senior: ₦1.4M
    Skills: Unity, Unreal, 3D, VR SDKs
    Timeline: 12-18 months | Very niche

COMPLIANCE & GOVERNANCE:
45. IT Compliance / NDPR Officer
    Demand: 31% | Entry: ₦280k | Mid: ₦550k | Senior: ₦1.4M
    Skills: NDPR, GDPR, Compliance, Documentation
    Timeline: 6-9 months | Regulatory demand

46. IT Auditor / GRC Analyst
    Demand: 43% | Entry: ₦350k | Mid: ₦800k | Senior: ₦2.1M
    Skills: Risk, Audit, ISO27001, Frameworks
    Timeline: 12-18 months | Banks, enterprises

47. Information Security Manager
    Demand: 26% | Entry: ₦700k | Mid: ₦1.4M | Senior: ₦3.5M
    Skills: Policies, Risk Management, ISMS
    Timeline: 18-24 months | Senior leadership

DATABASE & ARCHITECTURE:
48. Database Administrator (DBA)
    Demand: 41% | Entry: ₦350k | Mid: ₦750k | Senior: ₦1.8M
    Skills: PostgreSQL, MySQL, Backup, Performance
    Timeline: 9-15 months | Banks, enterprises

49. Solutions Architect
    Demand: 47% | Entry: ₦500k | Mid: ₦1.1M | Senior: ₦3M
    Skills: Design Patterns, AWS, Microservices
    Timeline: 18-24 months | Requires experience

50. ERP Consultant (SAP/Oracle)
    Demand: 36% | Entry: ₦500k | Mid: ₦1.2M | Senior: ₦3M
    Skills: SAP, ERP Systems, Business Process
    Timeline: 12-18 months | Enterprise focus

ADDITIONAL ROLES:
- Power Platform / Low-Code Dev (45% demand, ₦300k-1.3M)
- Penetration Tester (40% demand, ₦350k-2.4M)
- Technical Recruiter (32% demand, ₦220k-1.1M)
- Pre-Sales / Solutions Engineer (37% demand, ₦350k-1.3M)
- IT Trainer / Facilitator (49% demand, ₦200k-900k)
- Chief Technology Officer (12% demand, ₦1.2M-6M) - Leadership
- Chief Information Security Officer (9% demand, ₦1.2M-6M) - Leadership
- Observability Engineer (14% demand, ₦400k-2M)
- GIS Developer (16% demand, ₦250k-1.4M)

PATHWAY CONSIDERATIONS:
- Student Pathway: Structured learning, certificates, internships
- Market Woman Pathway: Low-barrier entry (UI/UX, QA, Digital Marketing)
- Older Men Pathway: Weekend learning, practical projects, freelance
- Career Switcher Pathway: Intensive bootcamps, portfolio focus, networking
`

const SYSTEM_PROMPT = `You are SabiAdvisor, a veteran tech career consultant with 40+ years global experience and deep Nigerian market knowledge.

${NIGERIAN_TECH_ROLES}

YOUR TASK:
Analyze survey responses and recommend the BEST-FIT tech career tracks using tiered recommendations:
- PRIMARY TRACKS (3): The absolute best matches based on user profile
- ALTERNATIVE TRACKS (2): Solid backup options if primary paths don't work out

SELECTION CRITERIA:
1. Interest alignment (35%)
2. Time/budget constraints (25%)
3. Current skills/experience (20%)
4. Market demand in Nigeria (15%)
5. Learning style fit (5%)

RESPONSE FORMAT (STRICT JSON):
{
  "primary_tracks": [
    {
      "name": "Software Engineer - Frontend",
      "confidence": 90,
      "why_fits": "Your interest in visual design plus problem solving plus 6-month timeline aligns perfectly. HTML CSS React path is fastest to job-ready.",
      "salary_range_ngn": "₦300k-800k/month",
      "time_to_job_ready": "6-9 months",
      "top_skills": ["HTML/CSS", "JavaScript", "React", "Git", "Tailwind"],
      "entry_roles": ["Junior Frontend Developer", "UI Developer", "React Developer"],
      "demand": 87
    }
    // ... 2 more primary tracks
  ],
  "alternative_tracks": [
    {
      "name": "UI/UX Designer",
      "confidence": 75,
      "why_fits": "If coding feels overwhelming, design is a creative alternative with similar visual outcomes and strong freelance market.",
      "salary_range_ngn": "₦250k-600k/month",
      "time_to_job_ready": "6-12 months",
      "top_skills": ["Figma", "Wireframing", "Prototyping", "User Research"],
      "entry_roles": ["UI Designer", "UX Designer", "Product Designer"],
      "demand": 78
    }
    // ... 1 more alternative track
  ],
  "overall_confidence": 85,
  "next_steps": [
    {
      "icon": "book",
      "title": "Start with Free Resources",
      "description": "Begin with FreeCodeCamp HTML CSS curriculum. No cost, self-paced, certificate included.",
      "priority": "high"
    },
    {
      "icon": "laptop",
      "title": "Get Basic Setup",
      "description": "Install VS Code and Chrome browser. Both are free and work on low-spec computers.",
      "priority": "high"
    },
    {
      "icon": "users",
      "title": "Join Tech Community",
      "description": "Connect with Nigerian developers on Twitter and WhatsApp groups for support.",
      "priority": "medium"
    },
    {
      "icon": "target",
      "title": "Build Portfolio Projects",
      "description": "Create 3-5 simple projects to showcase skills. Host free on GitHub Pages.",
      "priority": "medium"
    }
  ],
  "roadmap_6m": {
    "track": "Frontend Web Developer",
    "months": [
      {
        "month": 1,
        "title": "HTML & CSS Foundations",
        "focus": "Master the building blocks of web pages",
        "milestones": ["Complete HTML basics", "Style 3 web pages", "Understand CSS layout"],
        "skills": ["HTML5 semantic tags", "CSS styling", "Flexbox", "Responsive design basics"],
        "projects": ["Personal landing page", "Simple portfolio site", "Restaurant menu page"],
        "resources": ["FreeCodeCamp Responsive Web Design", "MDN HTML CSS docs", "Kevin Powell YouTube"]
      }
      // ... 5 more months
    ]
  }
}

SELECTION GUIDELINES:
- PRIMARY TRACKS: Highest confidence (80-95%), best fit for user's situation
- ALTERNATIVE TRACKS: Good confidence (70-85%), viable backup plans
- Consider user's constraints (budget, time, power, internet)
- For students: Recommend roles with clear educational paths
- For career switchers: Focus on roles with transferable skills
- For market women: Prioritize low-barrier, freelance-friendly roles (UI/UX, QA, Digital Marketing, Technical Writer)
- For older learners: Weekend-friendly paths with practical outcomes
- Always recommend free resources first (FreeCodeCamp, YouTube, Odin Project)
- Mention relevant certifications that boost salary (AWS, Google, Meta)
- Keep timeline expectations realistic
- Use Nigerian salary ranges and context

CRITICAL JSON FORMATTING:
- Return ONLY valid JSON (no markdown, no backticks, no explanations)
- Do NOT use line breaks inside string values
- Replace any newlines with spaces
- Keep all text on single lines within strings
- Use spaces instead of tabs
- Ensure all quotes are properly escaped
- Icon field must be one of: book, laptop, users, target, code, briefcase, award, rocket

DEMAND INTERPRETATION:
- 80%+ = Very High Demand (prioritize for quick employment)
- 60-79% = High Demand (solid career choice)
- 40-59% = Moderate Demand (selective hiring)
- 20-39% = Niche Demand (specialized opportunities)
- <20% = Emerging/Very Niche (for passionate early adopters)`

export async function getCareerRecommendations(
  surveyAnswers: any
): Promise<CareerRecommendation> {
  try {
    // Verify API key is present
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    // Create cache key from survey answers
    const cacheKey = JSON.stringify(surveyAnswers)
    
    // Check cache first
    const cached = requestCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('✅ Returning cached recommendation (avoiding API call)')
      return await cached.promise
    }

    // RATE LIMITING - Prevent burst requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      console.log(`⏱️  Rate limiting: waiting ${waitTime}ms before next request`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastRequestTime = Date.now()

    console.log('Initializing Gemini with API key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...')

    // Create the request promise
    const requestPromise = (async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      })

      const prompt = `SURVEY RESPONSES:
${JSON.stringify(surveyAnswers, null, 2)}

Based on these responses, recommend tech career tracks for this Nigerian learner using TIERED RECOMMENDATIONS:
- 3 PRIMARY TRACKS (best fits, 80-95% confidence)
- 2 ALTERNATIVE TRACKS (solid backups, 70-85% confidence)

Also provide a detailed 6-month learning roadmap for the TOP primary track.
Include 4 actionable next_steps blocks with icons.

Return ONLY valid JSON with no markdown formatting, no backticks, no explanations.
Keep all string values on single lines without line breaks.`

      console.log('🚀 Calling Gemini API...')
      
      const result = await model.generateContent([SYSTEM_PROMPT, prompt])
      const response = await result.response
      let text = response.text()

      console.log('✅ Gemini API response received')

      // Strip markdown code blocks if present
      text = text.replace(/```json\n?/g, '')
                 .replace(/```\n?/g, '')
                 .trim()

      // Sanitize the JSON string to handle control characters
      text = sanitizeJsonString(text)

      // Parse and validate
      const parsed = JSON.parse(text)
      
      // Validate structure
      if (!parsed.primary_tracks || !Array.isArray(parsed.primary_tracks) || parsed.primary_tracks.length === 0) {
        throw new Error('Invalid response structure: missing or empty primary_tracks')
      }

      if (!parsed.alternative_tracks || !Array.isArray(parsed.alternative_tracks)) {
        throw new Error('Invalid response structure: missing alternative_tracks')
      }

      if (!parsed.roadmap_6m || !parsed.roadmap_6m.months) {
        throw new Error('Invalid response structure: missing roadmap_6m')
      }

      // Ensure we have exactly 3 primary tracks
      if (parsed.primary_tracks.length > 3) {
        parsed.primary_tracks = parsed.primary_tracks.slice(0, 3)
      }

      // Ensure we have exactly 2 alternative tracks
      if (parsed.alternative_tracks.length > 2) {
        parsed.alternative_tracks = parsed.alternative_tracks.slice(0, 2)
      }

      // Ensure we have 6 months in roadmap
      if (parsed.roadmap_6m.months.length > 6) {
        parsed.roadmap_6m.months = parsed.roadmap_6m.months.slice(0, 6)
      }

      console.log('✅ Successfully parsed recommendations')

      return parsed as CareerRecommendation
    })()

    // Cache the promise with timestamp
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: Date.now() })
    
    // Auto-clear cache after TTL
    setTimeout(() => {
      requestCache.delete(cacheKey)
      console.log('🗑️  Cache cleared for request')
    }, CACHE_TTL)

    return await requestPromise

  } catch (error: any) {
    console.error('❌ Gemini API Error:', {
      message: error.message,
      code: error.code || ''
    })
    
    // Handle rate limit errors specifically
    if (error.message?.includes('429') || error.message?.includes('Resource exhausted') || error.message?.includes('Too Many Requests')) {
      throw new Error('Rate limit reached. Please wait 60 seconds and try again. This helps us manage server costs.')
    }
    
    if (error.message?.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection.')
    }
    
    if (error.message?.includes('JSON')) {
      throw new Error('Failed to process AI response. Please try again.')
    }
    
    if (error.message?.includes('404')) {
      throw new Error('AI model not available. Please contact support.')
    }

    if (error.message?.includes('API key')) {
      throw new Error('API key configuration error. Please check environment variables.')
    }
    
    throw new Error(`Failed to generate recommendations: ${error.message}`)
  }
}

function sanitizeJsonString(jsonStr: string): string {
  let inString = false
  let escaped = false
  let result = ''
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i]
    
    if (char === '"' && !escaped) {
      inString = !inString
      result += char
      continue
    }
    
    if (char === '\\' && !escaped) {
      escaped = true
      result += char
      continue
    }
    
    if (inString && !escaped) {
      if (char === '\n') {
        result += ' '
        escaped = false
        continue
      }
      if (char === '\r') {
        escaped = false
        continue
      }
      if (char === '\t') {
        result += ' '
        escaped = false
        continue
      }
    }
    
    result += char
    escaped = false
  }
  
  return result
}