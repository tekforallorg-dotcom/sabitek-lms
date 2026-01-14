/**
 * CV Builder v2 - Resume Extraction Service
 * 
 * Extracts structured ResumeSchema from raw CV text
 * - Uses AI for intelligent extraction
 * - Validates output with Zod
 * - Handles retries and error cases
 */

import { ResumeSchema, ResumeSchemaZ, safeParseResumeSchema } from '../schemas'
import { SYSTEM_PROMPTS, buildResumeExtractionPrompt, extractJSON, cleanAIResponse } from '../prompts'

// ============================================
// CONFIGURATION
// ============================================

const AI_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  maxRetries: 2,
  retryDelayMs: 1000,
  maxTokens: 4000,
  temperature: 0.3, // Lower temperature for extraction accuracy
}

// ============================================
// AI CALL FUNCTION
// ============================================

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = AI_CONFIG.maxTokens
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📄 Resume extraction - Attempt ${attempt}/${AI_CONFIG.maxRetries}`)
      
      const response = await fetch(AI_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: AI_CONFIG.temperature,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`AI API error: ${response.status}`, errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      if (!content || content.trim().length < 50) {
        throw new Error('Empty or too short response')
      }

      console.log(`✅ Resume extraction completed (${data.usage?.total_tokens || 0} tokens)`)
      return content

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error)
      
      if (attempt < AI_CONFIG.maxRetries) {
        const delay = AI_CONFIG.retryDelayMs * attempt
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error('Resume extraction failed after all retries')
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

export interface ExtractionResult {
  success: boolean
  resume?: ResumeSchema
  error?: string
  warnings: string[]
  parseQuality: 'good' | 'partial' | 'poor'
}

/**
 * Extract structured ResumeSchema from raw CV text
 */
export async function extractResumeFromText(rawText: string): Promise<ExtractionResult> {
  const warnings: string[] = []
  
  // Pre-validation
  if (!rawText || rawText.trim().length < 100) {
    return {
      success: false,
      error: 'CV text is too short or empty',
      warnings: ['Minimum 100 characters required'],
      parseQuality: 'poor',
    }
  }

  // Check for low-quality text (possibly scanned PDF)
  const wordCount = rawText.split(/\s+/).length
  const hasEmail = /@/.test(rawText)
  const hasPhone = /\d{6,}/.test(rawText)
  
  if (wordCount < 50) {
    warnings.push('Very short CV text - may be a scanned document')
  }
  if (!hasEmail) {
    warnings.push('No email detected in CV text')
  }
  if (!hasPhone) {
    warnings.push('No phone number detected in CV text')
  }

  try {
    // Build prompt and call AI
    const userPrompt = buildResumeExtractionPrompt(rawText)
    const response = await callAI(
      SYSTEM_PROMPTS.resumeExtraction,
      userPrompt,
      AI_CONFIG.maxTokens
    )

    // Extract and parse JSON
    const jsonData = extractJSON(response)
    if (!jsonData) {
      return {
        success: false,
        error: 'Failed to extract valid JSON from AI response',
        warnings,
        parseQuality: 'poor',
      }
    }

    // Validate with Zod
    const parseResult = safeParseResumeSchema(jsonData)
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: `Schema validation failed: ${parseResult.error}`,
        warnings,
        parseQuality: 'poor',
      }
    }

    const resume = parseResult.data

    // Post-extraction quality checks
    if (!resume.basics.name) {
      warnings.push('Could not extract name from CV')
    }
    if (resume.experience.length === 0) {
      warnings.push('No work experience extracted')
    }
    if (Object.values(resume.skills).flat().length === 0) {
      warnings.push('No skills extracted')
    }

    // Determine parse quality
    let parseQuality: 'good' | 'partial' | 'poor' = 'good'
    if (warnings.length >= 3 || !resume.basics.name || resume.experience.length === 0) {
      parseQuality = 'poor'
    } else if (warnings.length >= 1) {
      parseQuality = 'partial'
    }

    return {
      success: true,
      resume,
      warnings,
      parseQuality,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      warnings,
      parseQuality: 'poor',
    }
  }
}

// ============================================
// PROFILE TO RESUME CONVERSION
// ============================================

/**
 * Convert career_profile database record to ResumeSchema
 * This normalizes the profile data into the standard schema
 */
export function profileToResumeSchema(profile: Record<string, unknown>): ResumeSchema {
  const resume: ResumeSchema = {
    basics: {
      name: String(profile.full_name || ''),
      headline: String(profile.current_role || profile.target_role || ''),
      email: String(profile.email || ''),
      phone: String(profile.phone || ''),
      location: String(profile.location || ''),
      links: [],
    },
    summary: String(profile.professional_summary || profile.bio || ''),
    skills: {
      core: parseSkillsArray(profile.core_skills),
      technical: parseSkillsArray(profile.technical_skills),
      tools: parseSkillsArray(profile.tools),
      cloud: [],
      security: [],
      systems: [],
      support: [],
      soft: parseSkillsArray(profile.soft_skills),
      domain: parseSkillsArray(profile.domain_skills),
    },
    experience: parseExperienceArray(profile.work_experience),
    projects: parseProjectsArray(profile.projects),
    certifications: parseCertificationsArray(profile.certifications),
    education: parseEducationArray(profile.education),
  }

  // Add LinkedIn if present
  if (profile.linkedin_url) {
    resume.basics.links.push(String(profile.linkedin_url))
  }
  if (profile.github_url) {
    resume.basics.links.push(String(profile.github_url))
  }
  if (profile.portfolio_url) {
    resume.basics.links.push(String(profile.portfolio_url))
  }

  return resume
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseSkillsArray(skills: unknown): string[] {
  if (!skills) return []
  if (Array.isArray(skills)) {
    return skills.map(s => String(s).trim()).filter(s => s.length > 0)
  }
  if (typeof skills === 'string') {
    return skills.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0)
  }
  return []
}

function parseExperienceArray(experiences: unknown): ResumeSchema['experience'] {
  if (!experiences || !Array.isArray(experiences)) return []
  
  return experiences.map((exp, index) => ({
    id: `exp_${index + 1}`,
    title: String(exp.title || exp.role || exp.position || ''),
    company: String(exp.company || exp.employer || exp.organization || ''),
    location: String(exp.location || ''),
    start: String(exp.start_date || exp.startDate || exp.start || ''),
    end: String(exp.end_date || exp.endDate || exp.end || ''),
    isCurrent: Boolean(exp.is_current || exp.isCurrent || exp.current),
    bullets: parseBulletsArray(exp.bullets || exp.responsibilities || exp.achievements, index),
  }))
}

function parseBulletsArray(bullets: unknown, expIndex: number): ResumeSchema['experience'][0]['bullets'] {
  if (!bullets) return []
  
  const bulletArray = Array.isArray(bullets) ? bullets : 
    typeof bullets === 'string' ? bullets.split('\n').filter(b => b.trim()) : []
  
  return bulletArray.map((bullet, i) => ({
    id: `b${expIndex}_${i + 1}`,
    text: typeof bullet === 'string' ? bullet.trim() : String(bullet.text || bullet),
    tools: Array.isArray(bullet.tools) ? bullet.tools : [],
    metrics: Array.isArray(bullet.metrics) ? bullet.metrics : extractMetrics(String(bullet.text || bullet)),
    tags: Array.isArray(bullet.tags) ? bullet.tags : [],
  }))
}

function extractMetrics(text: string): string[] {
  const metrics: string[] = []
  
  // Find percentages
  const percentages = text.match(/\d+(\.\d+)?%/g)
  if (percentages) metrics.push(...percentages)
  
  // Find numbers with context
  const numbers = text.match(/\d+\+?\s*(users|clients|employees|tickets|servers|systems|projects|teams?|members?)/gi)
  if (numbers) metrics.push(...numbers)
  
  // Find currency
  const currency = text.match(/[$₦€£]\s*\d+[\d,]*(k|m|K|M)?/g)
  if (currency) metrics.push(...currency)
  
  return [...new Set(metrics)]
}

function parseProjectsArray(projects: unknown): ResumeSchema['projects'] {
  if (!projects || !Array.isArray(projects)) return []
  
  return projects.map(proj => ({
    name: String(proj.name || proj.title || ''),
    description: String(proj.description || proj.summary || ''),
    tools: parseSkillsArray(proj.tools || proj.technologies || proj.stack),
    metrics: [],
    links: parseSkillsArray(proj.links || proj.urls),
  }))
}

function parseCertificationsArray(certs: unknown): ResumeSchema['certifications'] {
  if (!certs || !Array.isArray(certs)) return []
  
  return certs.map(cert => ({
    name: String(cert.name || cert.title || ''),
    issuer: String(cert.issuer || cert.organization || cert.provider || ''),
    date: String(cert.date || cert.year || cert.issued || ''),
  }))
}

function parseEducationArray(education: unknown): ResumeSchema['education'] {
  if (!education || !Array.isArray(education)) return []
  
  return education.map(edu => ({
    school: String(edu.school || edu.institution || edu.university || ''),
    degree: String(edu.degree || edu.qualification || ''),
    field: String(edu.field || edu.major || edu.course || ''),
    start: String(edu.start_date || edu.startDate || edu.start || ''),
    end: String(edu.end_date || edu.endDate || edu.end || edu.year || ''),
  }))
}

// ============================================
// MERGE RESUME DATA
// ============================================

/**
 * Merge resume from profile with extracted CV data
 * Prefers more complete/detailed data from either source
 */
export function mergeResumeData(
  profileResume: ResumeSchema,
  extractedResume: ResumeSchema
): ResumeSchema {
  // Helper to pick longer/more complete value
  const pickBetter = (a: string, b: string): string => {
    if (!a || a.trim().length === 0) return b
    if (!b || b.trim().length === 0) return a
    return a.length >= b.length ? a : b
  }

  // Helper to merge arrays without duplicates
  const mergeArrays = (a: string[], b: string[]): string[] => {
    const normalized = new Set(a.map(s => s.toLowerCase().trim()))
    const merged = [...a]
    for (const item of b) {
      if (!normalized.has(item.toLowerCase().trim())) {
        merged.push(item)
      }
    }
    return merged
  }

  // Merge basics
  const basics = {
    name: pickBetter(profileResume.basics.name, extractedResume.basics.name),
    headline: pickBetter(profileResume.basics.headline, extractedResume.basics.headline),
    email: pickBetter(profileResume.basics.email, extractedResume.basics.email),
    phone: pickBetter(profileResume.basics.phone, extractedResume.basics.phone),
    location: pickBetter(profileResume.basics.location, extractedResume.basics.location),
    links: mergeArrays(profileResume.basics.links, extractedResume.basics.links),
  }

  // Merge summary - prefer profile if substantial, otherwise extracted
  const summary = profileResume.summary.length > 50 
    ? profileResume.summary 
    : pickBetter(profileResume.summary, extractedResume.summary)

  // Merge skills
  const skills = {
    core: mergeArrays(profileResume.skills.core, extractedResume.skills.core),
    technical: mergeArrays(profileResume.skills.technical, extractedResume.skills.technical),
    tools: mergeArrays(profileResume.skills.tools, extractedResume.skills.tools),
    cloud: mergeArrays(profileResume.skills.cloud, extractedResume.skills.cloud),
    security: mergeArrays(profileResume.skills.security, extractedResume.skills.security),
    systems: mergeArrays(profileResume.skills.systems, extractedResume.skills.systems),
    support: mergeArrays(profileResume.skills.support, extractedResume.skills.support),
    soft: mergeArrays(profileResume.skills.soft, extractedResume.skills.soft),
    domain: mergeArrays(profileResume.skills.domain, extractedResume.skills.domain),
  }

  // Merge experience - prefer extracted if it has more detail (bullets with metrics)
  const extractedHasMetrics = extractedResume.experience.some(exp => 
    exp.bullets.some(b => b.metrics.length > 0)
  )
  const experience = extractedHasMetrics && extractedResume.experience.length > 0
    ? extractedResume.experience
    : profileResume.experience.length > 0 
      ? profileResume.experience 
      : extractedResume.experience

  // Merge projects, certifications, education
  const projects = mergeByName(profileResume.projects, extractedResume.projects, 'name')
  const certifications = mergeByName(profileResume.certifications, extractedResume.certifications, 'name')
  // Education: Use CV education if present, else profile. NEVER merge both.
  const education = extractedResume.education.length > 0 
    ? extractedResume.education 
    : profileResume.education

  return {
    basics,
    summary,
    skills,
    experience,
    projects,
    certifications,
    education,
  }
}

function mergeByName<T extends { [key: string]: unknown }>(
  arr1: T[],
  arr2: T[],
  nameKey: keyof T
): T[] {
  const result: T[] = []
  const processed = new Set<string>()
  
  // Helper to normalize names for comparison
  const normalize = (s: string) => s.toLowerCase().trim()
    .replace(/\buniversity\b/gi, 'uni')
    .replace(/\binstitute\b/gi, 'inst')
    .replace(/\bpolytechnic\b/gi, 'poly')
  
  // Helper to pick the better (longer/more complete) item
  const pickBetter = (a: T, b: T): T => {
    const aStr = JSON.stringify(a)
    const bStr = JSON.stringify(b)
    // Prefer the one with more content
    return bStr.length > aStr.length ? b : a
  }
  
  // Process arr1 first
  for (const item of arr1) {
    const name = normalize(String(item[nameKey] || ''))
    if (name && !processed.has(name)) {
      // Check if arr2 has a matching item
      const match = arr2.find(item2 => {
        const name2 = normalize(String(item2[nameKey] || ''))
        return name2 && (name.includes(name2.slice(0, 8)) || name2.includes(name.slice(0, 8)))
      })
      
      if (match) {
        result.push(pickBetter(item, match))
      } else {
        result.push(item)
      }
      processed.add(name)
    }
  }
  
  // Add any from arr2 that weren't matched
  for (const item of arr2) {
    const name = normalize(String(item[nameKey] || ''))
    if (name && !processed.has(name)) {
      const alreadyMatched = result.some(r => {
        const rName = normalize(String(r[nameKey] || ''))
        return rName.includes(name.slice(0, 8)) || name.includes(rName.slice(0, 8))
      })
      if (!alreadyMatched) {
        result.push(item)
        processed.add(name)
      }
    }
  }
  
  return result
}
