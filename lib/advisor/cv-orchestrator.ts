/**
 * CV Builder Orchestrator
 * 
 * World-class multi-stage AI pipeline for generating professional CVs
 * Uses section-specific logic for optimal results
 */

// Types
export interface ProfileData {
  full_name: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  work_experience: WorkExperience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  target_roles: string[]
}

export interface WorkExperience {
  company: string
  title: string
  location?: string
  start_date: string
  end_date?: string
  is_current?: boolean
  bullets: string[]
}

export interface Education {
  institution: string
  degree: string
  field?: string
  year: string
}

export interface Project {
  name: string
  description: string
  technologies: string[]
  url?: string
}

export interface Certification {
  name: string
  issuer: string
  year?: string
}

export interface CVInput {
  profile: ProfileData
  targetRole: string
  level: 'entry' | 'mid' | 'senior' | 'executive'
  format: string
  jobDescription?: string
  uploadedCVText?: string
}

export interface CVOutput {
  summary: string
  skills: string[]
  experience: Array<{
    company: string
    title: string
    duration: string
    bullets: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    year: string
  }>
  projects: Array<{
    name: string
    description: string
    technologies: string[]
  }>
  certifications: Array<{
    name: string
    issuer: string
    year?: string
  }>
  atsKeywords: string[]
  atsScore: number
}

// AI Call function
async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  // Use DeepSeek for cost efficiency with good quality
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// Parse JSON from AI response
function parseJSON<T>(text: string, fallback: T): T {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/(\{[\s\S]*\})/) ||
                      text.match(/(\[[\s\S]*\])/)
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }
    return JSON.parse(text)
  } catch (e) {
    console.error('JSON parse error:', e)
    return fallback
  }
}

/**
 * STAGE 1: Role Analysis & Keyword Extraction
 * Analyze the target role against global standards
 */
async function analyzeTargetRole(input: CVInput): Promise<{
  standardizedRole: string
  keyCompetencies: string[]
  atsKeywords: string[]
  industryContext: string
}> {
  const systemPrompt = `You are an expert career consultant with deep knowledge of global job markets, especially in technology and IT. Your task is to analyze a target job role and provide industry-standard insights.

CRITICAL: Return ONLY valid JSON, no other text.`

  const userPrompt = `Analyze this target role and provide standardized information:

Target Role: ${input.targetRole}
Experience Level: ${input.level}
${input.jobDescription ? `Job Description:\n${input.jobDescription.slice(0, 2000)}` : ''}

User's Current Skills: ${input.profile.skills?.join(', ') || 'Not specified'}
User's Experience: ${input.profile.work_experience?.map(e => e.title).join(', ') || 'Not specified'}

Return JSON:
{
  "standardizedRole": "Industry-standard job title (e.g., 'Senior Systems Administrator' not just 'sysadmin')",
  "keyCompetencies": ["List of 8-12 must-have competencies for this role"],
  "atsKeywords": ["20-30 ATS keywords that recruiters search for"],
  "industryContext": "Brief context about this role in today's market (2-3 sentences)"
}`

  const response = await callAI(systemPrompt, userPrompt, 1500)
  
  return parseJSON(response, {
    standardizedRole: input.targetRole,
    keyCompetencies: [],
    atsKeywords: [],
    industryContext: ''
  })
}

/**
 * STAGE 2: Professional Summary Generation
 * Create a compelling summary tailored to the role
 */
async function generateSummary(
  input: CVInput, 
  roleAnalysis: { standardizedRole: string; keyCompetencies: string[]; industryContext: string }
): Promise<string> {
  const systemPrompt = `You are an expert CV writer who creates compelling professional summaries. Your summaries are:
- Concise (3-4 sentences, 50-80 words)
- Impactful with quantifiable achievements when possible
- Tailored to the specific role
- ATS-optimized with relevant keywords
- Written in first person implied (no "I")

CRITICAL: Return ONLY the summary text, no JSON, no quotes, no explanations.`

  const userPrompt = `Write a professional summary for this person:

TARGET ROLE: ${roleAnalysis.standardizedRole}
LEVEL: ${input.level}
KEY COMPETENCIES NEEDED: ${roleAnalysis.keyCompetencies.slice(0, 6).join(', ')}

PERSON'S BACKGROUND:
- Name: ${input.profile.full_name}
- Current/Recent Role: ${input.profile.work_experience?.[0]?.title || 'Not specified'}
- Years of Experience: ${calculateYearsOfExperience(input.profile.work_experience)}
- Key Skills: ${input.profile.skills?.slice(0, 10).join(', ') || 'Not specified'}
- Education: ${input.profile.education?.[0]?.degree || 'Not specified'} from ${input.profile.education?.[0]?.institution || 'Not specified'}

THEIR EXISTING SUMMARY (if any): ${input.profile.summary || 'None provided'}

${input.uploadedCVText ? `ADDITIONAL CONTEXT FROM UPLOADED CV:\n${input.uploadedCVText.slice(0, 1000)}` : ''}

Write a powerful professional summary that positions this person perfectly for the ${roleAnalysis.standardizedRole} role. Use their ACTUAL background - do not invent experience.`

  const response = await callAI(systemPrompt, userPrompt, 500)
  
  // Clean up the response
  return response
    .replace(/^["']|["']$/g, '')
    .replace(/^Summary:?\s*/i, '')
    .trim()
}

/**
 * STAGE 3: Skills Optimization
 * Match and prioritize skills for the target role
 */
async function optimizeSkills(
  input: CVInput,
  roleAnalysis: { keyCompetencies: string[]; atsKeywords: string[] }
): Promise<string[]> {
  const systemPrompt = `You are an expert at optimizing CV skills sections for ATS systems and recruiters. Your task is to:
1. Match user's skills to role requirements
2. Prioritize most relevant skills first
3. Use industry-standard terminology
4. Include technical AND soft skills
5. NEVER add skills the user doesn't actually have

CRITICAL: Return ONLY a JSON array of strings, no other text.`

  const userPrompt = `Optimize the skills section for this CV:

TARGET ROLE: ${input.targetRole} (${input.level} level)
REQUIRED COMPETENCIES: ${roleAnalysis.keyCompetencies.join(', ')}
ATS KEYWORDS: ${roleAnalysis.atsKeywords.slice(0, 15).join(', ')}

USER'S ACTUAL SKILLS: ${input.profile.skills?.join(', ') || 'None specified'}

USER'S WORK EXPERIENCE (to infer additional skills):
${input.profile.work_experience?.map(e => `- ${e.title} at ${e.company}: ${e.bullets?.join('; ')}`).join('\n') || 'None'}

${input.uploadedCVText ? `SKILLS FROM UPLOADED CV:\n${extractSkillsSection(input.uploadedCVText)}` : ''}

Return a JSON array of 12-20 optimized skills, ordered by relevance to the target role.
Only include skills the user ACTUALLY has based on their experience.
Use proper capitalization (e.g., "Microsoft Azure" not "microsoft azure").

Example format: ["Skill 1", "Skill 2", "Skill 3"]`

  const response = await callAI(systemPrompt, userPrompt, 800)
  
  const skills = parseJSON<string[]>(response, input.profile.skills || [])
  
  // Ensure we have at least some skills
  if (skills.length === 0 && input.profile.skills?.length) {
    return input.profile.skills.slice(0, 15)
  }
  
  return skills.slice(0, 20)
}

/**
 * STAGE 4: Experience Enhancement
 * Rewrite experience bullets with STAR method and metrics
 */
async function enhanceExperience(
  input: CVInput,
  roleAnalysis: { standardizedRole: string; atsKeywords: string[] }
): Promise<CVOutput['experience']> {
  if (!input.profile.work_experience?.length) {
    return []
  }

  const systemPrompt = `You are an expert CV writer specializing in transforming work experience into impactful, ATS-optimized bullet points. You use:
- STAR method (Situation, Task, Action, Result)
- Strong action verbs (Led, Implemented, Optimized, Delivered)
- Quantifiable metrics when possible (%, $, numbers)
- Industry-relevant terminology

CRITICAL RULES:
1. NEVER fabricate experience or achievements
2. ONLY enhance what the user actually did
3. If no metrics provided, DON'T invent numbers
4. Preserve the essence of each role
5. Return ONLY valid JSON

Format each bullet as: "[Action Verb] [What you did] [Result/Impact]"`

  const experienceData = input.profile.work_experience.map(exp => ({
    company: exp.company,
    title: exp.title,
    duration: formatDuration(exp.start_date, exp.end_date, exp.is_current),
    originalBullets: exp.bullets || []
  }))

  const userPrompt = `Enhance these work experiences for a ${roleAnalysis.standardizedRole} position:

TARGET ROLE: ${roleAnalysis.standardizedRole}
ATS KEYWORDS TO INCORPORATE (where relevant): ${roleAnalysis.atsKeywords.slice(0, 10).join(', ')}

WORK EXPERIENCES TO ENHANCE:
${JSON.stringify(experienceData, null, 2)}

${input.uploadedCVText ? `ADDITIONAL CONTEXT FROM UPLOADED CV:\n${input.uploadedCVText.slice(0, 1500)}` : ''}

For each experience:
1. Keep the same company and title (or improve title to industry-standard if very informal)
2. Rewrite bullets to be more impactful (3-5 bullets each)
3. Start each bullet with a strong action verb
4. Add metrics ONLY if they can be reasonably inferred from context
5. Align language to the target role where truthful

Return JSON array:
[
  {
    "company": "Company Name",
    "title": "Job Title",
    "duration": "Start - End",
    "bullets": ["Enhanced bullet 1", "Enhanced bullet 2", "Enhanced bullet 3"]
  }
]`

  const response = await callAI(systemPrompt, userPrompt, 2500)
  
  const enhanced = parseJSON<CVOutput['experience']>(response, [])
  
  // Fallback to original if parsing failed
  if (enhanced.length === 0) {
    return experienceData.map(exp => ({
      company: exp.company,
      title: exp.title,
      duration: exp.duration,
      bullets: exp.originalBullets
    }))
  }
  
  return enhanced
}

/**
 * STAGE 5: Education & Certifications Formatting
 */
async function formatEducation(input: CVInput): Promise<{
  education: CVOutput['education']
  certifications: CVOutput['certifications']
}> {
  // Education is mostly formatting, minimal AI needed
  const education: CVOutput['education'] = (input.profile.education || []).map(edu => ({
    institution: edu.institution,
    degree: edu.field ? `${edu.degree} in ${edu.field}` : edu.degree,
    year: edu.year
  }))

  const certifications: CVOutput['certifications'] = (input.profile.certifications || []).map(cert => ({
    name: cert.name,
    issuer: cert.issuer,
    year: cert.year
  }))

  return { education, certifications }
}

/**
 * STAGE 6: Projects Enhancement
 */
async function enhanceProjects(
  input: CVInput,
  roleAnalysis: { atsKeywords: string[] }
): Promise<CVOutput['projects']> {
  if (!input.profile.projects?.length) {
    return []
  }

  const systemPrompt = `You are an expert at presenting technical projects on CVs. Your task is to:
1. Write concise, impactful project descriptions
2. Highlight technologies and skills used
3. Emphasize results and impact
4. Use industry-standard terminology

CRITICAL: Return ONLY valid JSON array.`

  const userPrompt = `Enhance these project descriptions:

TARGET ROLE: ${input.targetRole}
RELEVANT KEYWORDS: ${roleAnalysis.atsKeywords.slice(0, 10).join(', ')}

PROJECTS:
${JSON.stringify(input.profile.projects, null, 2)}

Return JSON array:
[
  {
    "name": "Project Name",
    "description": "Concise 1-2 sentence description highlighting impact",
    "technologies": ["Tech 1", "Tech 2"]
  }
]`

  const response = await callAI(systemPrompt, userPrompt, 1000)
  
  return parseJSON<CVOutput['projects']>(response, input.profile.projects.map(p => ({
    name: p.name,
    description: p.description,
    technologies: p.technologies || []
  })))
}

/**
 * STAGE 7: Final Quality Check & ATS Score
 */
async function qualityCheck(
  cvOutput: Partial<CVOutput>,
  roleAnalysis: { atsKeywords: string[] }
): Promise<{ atsScore: number; suggestions: string[] }> {
  // Calculate ATS score based on keyword presence
  const cvText = JSON.stringify(cvOutput).toLowerCase()
  const matchedKeywords = roleAnalysis.atsKeywords.filter(kw => 
    cvText.includes(kw.toLowerCase())
  )
  
  const atsScore = Math.min(100, Math.round((matchedKeywords.length / roleAnalysis.atsKeywords.length) * 100) + 20)
  
  return {
    atsScore,
    suggestions: []
  }
}

// Helper functions
function calculateYearsOfExperience(experience?: WorkExperience[]): string {
  if (!experience?.length) return '0'
  
  const firstJob = experience[experience.length - 1]
  if (!firstJob.start_date) return 'Several'
  
  const startYear = parseInt(firstJob.start_date.split(/[-/]/)[0]) || new Date().getFullYear()
  const years = new Date().getFullYear() - startYear
  
  if (years <= 1) return '1+'
  if (years <= 3) return '2-3'
  if (years <= 5) return '3-5'
  if (years <= 10) return '5-10'
  return '10+'
}

function formatDuration(startDate?: string, endDate?: string, isCurrent?: boolean): string {
  if (!startDate) return ''
  
  const formatDate = (date: string) => {
    const parts = date.split(/[-/]/)
    if (parts.length >= 2) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthIndex = parseInt(parts[1]) - 1
      return `${months[monthIndex] || ''} ${parts[0]}`
    }
    return date
  }
  
  const start = formatDate(startDate)
  const end = isCurrent ? 'Present' : (endDate ? formatDate(endDate) : 'Present')
  
  return `${start} - ${end}`
}

function extractSkillsSection(text: string): string {
  // Try to find skills section in uploaded CV
  const skillsMatch = text.match(/skills?[:\s]*([\s\S]*?)(?=experience|education|projects|$)/i)
  return skillsMatch ? skillsMatch[1].slice(0, 500) : ''
}

/**
 * MAIN ORCHESTRATOR
 * Runs all stages and returns optimized CV
 */
export async function orchestrateCVGeneration(input: CVInput): Promise<CVOutput> {
  console.log('Starting CV orchestration for:', input.targetRole)
  
  // Stage 1: Analyze target role
  console.log('Stage 1: Analyzing target role...')
  const roleAnalysis = await analyzeTargetRole(input)
  console.log('Role analysis complete:', roleAnalysis.standardizedRole)
  
  // Stage 2: Generate summary
  console.log('Stage 2: Generating professional summary...')
  const summary = await generateSummary(input, roleAnalysis)
  console.log('Summary generated:', summary.slice(0, 50) + '...')
  
  // Stage 3: Optimize skills
  console.log('Stage 3: Optimizing skills...')
  const skills = await optimizeSkills(input, roleAnalysis)
  console.log('Skills optimized:', skills.length, 'skills')
  
  // Stage 4: Enhance experience
  console.log('Stage 4: Enhancing work experience...')
  const experience = await enhanceExperience(input, roleAnalysis)
  console.log('Experience enhanced:', experience.length, 'positions')
  
  // Stage 5: Format education
  console.log('Stage 5: Formatting education...')
  const { education, certifications } = await formatEducation(input)
  
  // Stage 6: Enhance projects
  console.log('Stage 6: Enhancing projects...')
  const projects = await enhanceProjects(input, roleAnalysis)
  
  // Compile output
  const cvOutput: CVOutput = {
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    atsKeywords: roleAnalysis.atsKeywords,
    atsScore: 0
  }
  
  // Stage 7: Quality check
  console.log('Stage 7: Quality check...')
  const { atsScore } = await qualityCheck(cvOutput, roleAnalysis)
  cvOutput.atsScore = atsScore
  
  console.log('CV orchestration complete! ATS Score:', atsScore)
  
  return cvOutput
}