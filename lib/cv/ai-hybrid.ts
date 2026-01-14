/**
 * Hybrid AI System for CV Generation
 * 
 * Strategy:
 * - Claude Haiku: Generation tasks (summary, skills, experience) - better quality
 * - DeepSeek: Extraction tasks (resume parsing, JD parsing) - cheaper
 * - Fallback: If Claude fails, fall back to DeepSeek
 */

import { callClaude, callClaudeJSON, CLAUDE_CV_PROMPTS } from '@/lib/advisor/ai/claude'
import { analyzeRoleDiff, type RoleDiff, getVerbsForLevel } from './tone'
import type { ResumeSchema, JobSchema } from './schemas'
import { computeYearsExperience, yearsPhrase } from './years'
import { 
  getBulletPolicy, 
  getBulletExpansionInstructions,
  getFormatConfig,
  type CVFormat,
} from './bulletPolicy'
import {
  HAIKU_SUMMARY_SYSTEM,
  HAIKU_SUMMARY_USER,
  HAIKU_SKILLS_SYSTEM,
  HAIKU_SKILLS_USER,
  HAIKU_BULLETS_SYSTEM,
  HAIKU_BULLETS_USER,
  EXPERIENCE_LEVEL_POLICY,
  buildPrompt,
  getExperienceLevelPolicyString,
  getBulletRequirements,
} from './prompts-v2'

// Configuration
export const AI_CONFIG = {
  // Which AI to use for each task
  tasks: {
    extraction: 'deepseek' as const,  // Cheaper for parsing
    generation: 'claude' as const,     // Better for writing
    scoring: 'deepseek' as const,      // Simple evaluation
  },
  // DeepSeek config (fallback)
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
  },
  // Claude config
  claude: {
    model: 'haiku' as const,
    maxRetries: 2,
  },
}

/**
 * Call DeepSeek API (for extraction and fallback)
 */
export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number = 0.7
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  const response = await fetch(AI_CONFIG.deepseek.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.deepseek.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  }
}

/**
 * Generate CV summary using Claude (with DeepSeek fallback)
 * Uses elite prompts with strict groundedness rules
 */
export async function generateSummary(
  resume: ResumeSchema,
  targetRole: string,
  level: string,
  keywords: string[],
  roleDiff?: RoleDiff,
  format?: CVFormat | string
): Promise<{ summary: string; tokens: number; provider: string }> {
  // Compute years from resume dates (NOT hardcoded)
  const yearsNum = computeYearsExperience(resume.experience)
  const yearsDisplay = yearsNum ? `${Math.floor(yearsNum)}` : null
  
  // Get experience level policy
  const levelPolicy = getExperienceLevelPolicyString(level)
  
  // Build resume evidence (general industry terms, not specific tools)
  const resumeEvidence = {
    name: resume.basics.name,
    recent_role: resume.experience[0]?.title || 'N/A',
    recent_company: resume.experience[0]?.company || 'N/A',
    core_skills: resume.skills.core.slice(0, 8),
    technical_skills: resume.skills.technical.slice(0, 8),
    key_achievements: resume.experience.slice(0, 2).flatMap(exp => 
      exp.bullets.slice(0, 2).map(b => b.text)
    ),
  }

  // Build the prompt using template
  const userPrompt = buildPrompt(HAIKU_SUMMARY_USER, {
    target_role: targetRole,
    experience_level: level,
    years_of_experience: yearsDisplay,
    keywords: keywords.slice(0, 8),
    experience_level_policy: levelPolicy,
    resume_evidence: resumeEvidence,
  })

  try {
    // Try Claude first with elite prompt
    const result = await callClaude({
      systemPrompt: HAIKU_SUMMARY_SYSTEM,
      userPrompt,
      maxTokens: 400,
      temperature: 0.6, // Slightly lower for more consistency
      model: 'haiku',
    })
    
    // Parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.summary) {
          return {
            summary: parsed.summary.trim(),
            tokens: result.tokens.total,
            provider: 'claude',
          }
        }
      } catch {
        // If JSON parsing fails, use content directly
      }
    }
    
    // If not JSON, use content directly (cleaned)
    return {
      summary: result.content.replace(/```json|```|\{|\}/g, '').replace(/"summary":\s*"/g, '').replace(/"$/g, '').trim(),
      tokens: result.tokens.total,
      provider: 'claude',
    }
  } catch (error) {
    console.warn('Claude failed for summary, falling back to DeepSeek:', error)
    
    // Fallback to DeepSeek
    const result = await callDeepSeek(
      HAIKU_SUMMARY_SYSTEM,
      userPrompt,
      400,
      0.6
    )
    
    // Parse response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.summary) {
          return {
            summary: parsed.summary.trim(),
            tokens: result.tokens,
            provider: 'deepseek',
          }
        }
      } catch {
        // Use content directly
      }
    }
    
    return {
      summary: result.content.replace(/```json|```|\{|\}/g, '').replace(/"summary":\s*"/g, '').replace(/"$/g, '').trim(),
      tokens: result.tokens,
      provider: 'deepseek',
    }
  }
}

/**
 * Generate optimized skills using Claude (with DeepSeek fallback)
 * Uses elite prompts - only includes skills from evidence
 */
export async function generateSkills(
  resume: ResumeSchema,
  targetRole: string,
  jdKeywords: string[],
  roleDiff?: RoleDiff,
  level?: string
): Promise<{ skills: Array<{ label: string; items: string[] }>; tokens: number; provider: string }> {
  // Build resume skills evidence
  const resumeSkills = {
    core: resume.skills.core,
    technical: resume.skills.technical,
    tools: resume.skills.tools,
  }
  
  // Build resume experience for implied skills
  const resumeExperience = resume.experience.slice(0, 3).map(exp => ({
    title: exp.title,
    bullets: exp.bullets.slice(0, 4).map(b => b.text),
  }))

  const userPrompt = buildPrompt(HAIKU_SKILLS_USER, {
    target_role: targetRole,
    experience_level: level || 'mid',
    jd_keywords: jdKeywords.slice(0, 20),
    resume_skills: resumeSkills,
    resume_experience: resumeExperience,
  })

  try {
    const result = await callClaude({
      systemPrompt: HAIKU_SKILLS_SYSTEM,
      userPrompt,
      maxTokens: 800,
      temperature: 0.3,
      model: 'haiku',
    })

    // Parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.skills) {
          // Convert to array format
          const skillsArray = [
            { label: 'Core Skills', items: parsed.skills.core || [] },
            { label: 'Technical Skills', items: parsed.skills.technical || [] },
            { label: 'Tools & Technologies', items: parsed.skills.tools || [] },
          ]
          // Add soft skills if present
          if (parsed.skills.soft?.length) {
            skillsArray.push({ label: 'Soft Skills', items: parsed.skills.soft })
          }
          return {
            skills: skillsArray.filter(s => s.items.length > 0),
            tokens: result.tokens.total,
            provider: 'claude',
          }
        }
      } catch {
        // Try array format
      }
    }
    
    // Try array format
    const arrayMatch = result.content.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      try {
        const skills = JSON.parse(arrayMatch[0])
        return { skills, tokens: result.tokens.total, provider: 'claude' }
      } catch {
        // Fallback
      }
    }

    throw new Error('Invalid skills format')
  } catch (error) {
    console.warn('Claude failed for skills, falling back to DeepSeek:', error)
    
    const result = await callDeepSeek(
      HAIKU_SKILLS_SYSTEM,
      userPrompt,
      800,
      0.3
    )

    // Parse DeepSeek response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.skills) {
          const skillsArray = [
            { label: 'Core Skills', items: parsed.skills.core || [] },
            { label: 'Technical Skills', items: parsed.skills.technical || [] },
            { label: 'Tools & Technologies', items: parsed.skills.tools || [] },
          ]
          return {
            skills: skillsArray.filter(s => s.items.length > 0),
            tokens: result.tokens,
            provider: 'deepseek',
          }
        }
      } catch {
        // Try array
      }
    }
    
    const arrayMatch = result.content.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      try {
        const skills = JSON.parse(arrayMatch[0])
        return { skills, tokens: result.tokens, provider: 'deepseek' }
      } catch {
        // Fallback
      }
    }

    // Fallback to original skills (cleaned)
    return {
      skills: [
        { label: 'Core Skills', items: resume.skills.core.slice(0, 10) },
        { label: 'Technical Skills', items: resume.skills.technical.slice(0, 10) },
        { label: 'Tools & Technologies', items: resume.skills.tools.slice(0, 8) },
      ],
      tokens: result.tokens,
      provider: 'fallback',
    }
  }
}

/**
 * Enhance experience bullets using Claude (with DeepSeek fallback)
 * Uses elite prompts with strict verb policies and no hallucination
 */
export async function enhanceExperience(
  experience: ResumeSchema['experience'],
  targetRole: string,
  jdKeywords: string[],
  roleDiff?: RoleDiff,
  evidenceMap?: { best_experiences: string[] },
  level?: string,
  format?: CVFormat | string
): Promise<{ 
  experience: Array<{
    title: string
    company: string
    location: string
    duration: string
    bullets: Array<{ text: string; isRewritten: boolean; evidenceIds: string[] }>
  }>
  tokens: number
  provider: string 
}> {
  // Get experience level and verb policy
  const expLevel = level || roleDiff?.targetToneLevel || 'mid'
  const levelPolicy = EXPERIENCE_LEVEL_POLICY[expLevel as keyof typeof EXPERIENCE_LEVEL_POLICY] || EXPERIENCE_LEVEL_POLICY.mid
  
  // Get bullet requirements for format
  const bulletReqs = getBulletRequirements(format || 'ATS-2page')
  
  // Process each experience entry
  const enhancedExperiences: Array<{
    title: string
    company: string
    location: string
    duration: string
    bullets: Array<{ text: string; isRewritten: boolean; evidenceIds: string[] }>
  }> = []
  
  let totalTokens = 0

  for (const exp of experience) {
    // Build original bullets list
    const originalBullets = exp.bullets.map(b => `- ${b.text}`).join('\n')
    
    const userPrompt = buildPrompt(HAIKU_BULLETS_USER, {
      target_role: targetRole,
      experience_level: expLevel,
      cv_format: format || 'ATS-2page',
      min_bullets: bulletReqs.min,
      max_bullets: bulletReqs.max,
      company: exp.company,
      role: exp.title,
      start: exp.start,
      end: exp.isCurrent ? 'Present' : exp.end,
      original_bullets: originalBullets,
      allowed_verbs: levelPolicy.allowedVerbs.join(', '),
      forbidden_verbs: levelPolicy.forbiddenVerbs.join(', '),
      jd_keywords: jdKeywords.slice(0, 15).join(', '),
    })

    try {
      const result = await callClaude({
        systemPrompt: HAIKU_BULLETS_SYSTEM,
        userPrompt,
        maxTokens: 1500,
        temperature: 0.6,
        model: 'haiku',
      })
      
      totalTokens += result.tokens.total

      // Parse JSON response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.bullets && Array.isArray(parsed.bullets)) {
            enhancedExperiences.push({
              title: exp.title,
              company: exp.company,
              location: exp.location,
              duration: `${exp.start} - ${exp.isCurrent ? 'Present' : exp.end}`,
              bullets: parsed.bullets.map((b: { text: string; is_rewritten?: boolean; groundedness?: string }) => ({
                text: b.text,
                isRewritten: b.is_rewritten !== false,
                evidenceIds: [],
              })),
            })
            continue
          }
        } catch {
          // Try fallback parsing
        }
      }
      
      // Fallback: use original bullets
      enhancedExperiences.push({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        duration: `${exp.start} - ${exp.isCurrent ? 'Present' : exp.end}`,
        bullets: exp.bullets.map(b => ({ text: b.text, isRewritten: false, evidenceIds: [] })),
      })
      
    } catch (error) {
      console.warn(`Claude failed for experience ${exp.title}, using original:`, error)
      
      // Use original bullets
      enhancedExperiences.push({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        duration: `${exp.start} - ${exp.isCurrent ? 'Present' : exp.end}`,
        bullets: exp.bullets.map(b => ({ text: b.text, isRewritten: false, evidenceIds: [] })),
      })
    }
  }

  return {
    experience: enhancedExperiences,
    tokens: totalTokens,
    provider: 'claude',
  }
}
/**
 * Fix CV issues using Claude
 */
export async function fixCVIssues(
  cv: unknown,
  issues: string[],
  resume: ResumeSchema,
  jd?: JobSchema
): Promise<{ fixed: unknown; tokens: number; provider: string } | null> {
  const userPrompt = `
Fix these issues in the CV:

ISSUES:
${issues.map(i => `- ${i}`).join('\n')}

CURRENT CV JSON:
${JSON.stringify(cv, null, 2)}

SOURCE RESUME (for fact-checking):
${JSON.stringify({
  name: resume.basics.name,
  experience: resume.experience.slice(0, 2).map(e => ({
    title: e.title,
    company: e.company,
    bullets: e.bullets.slice(0, 3),
  })),
}, null, 2)}

Return the corrected CV in the same JSON format.`

  try {
    const result = await callClaudeJSON({
      systemPrompt: CLAUDE_CV_PROMPTS.fixPass,
      userPrompt,
      maxTokens: 3000,
      temperature: 0.3,
      model: 'haiku',
    })

    if (result.data) {
      return {
        fixed: result.data,
        tokens: result.tokens.total,
        provider: 'claude',
      }
    }
    return null
  } catch (error) {
    console.warn('Claude fix-pass failed:', error)
    return null
  }
}

/**
 * Generate missing metrics questions
 */
export function generateMissingMetricsQuestions(
  experience: ResumeSchema['experience']
): string[] {
  const questions: string[] = []
  
  // Check each experience for missing metrics
  for (const exp of experience.slice(0, 2)) {
    const bulletsWithoutMetrics = exp.bullets.filter(b => {
      const text = b.text.toLowerCase()
      // Check for numbers, percentages, dollar amounts
      return !/\d+%|\$\d|million|thousand|\d+ (users|customers|tickets|projects|team members)/i.test(text)
    })

    if (bulletsWithoutMetrics.length > 2) {
      // Generate questions based on the role
      const title = exp.title.toLowerCase()
      
      if (title.includes('support') || title.includes('helpdesk')) {
        questions.push(`At ${exp.company}, approximately how many support tickets did you handle weekly/monthly?`)
        questions.push(`What was your average ticket resolution time or first-call resolution rate?`)
      } else if (title.includes('developer') || title.includes('engineer')) {
        questions.push(`At ${exp.company}, how many users/customers did your work impact?`)
        questions.push(`Did you improve any metrics (performance, load time, error rate)?`)
      } else if (title.includes('manager') || title.includes('lead')) {
        questions.push(`At ${exp.company}, how many team members did you manage?`)
        questions.push(`What budget or revenue were you responsible for?`)
      } else {
        questions.push(`At ${exp.company}, can you quantify any achievements (%, $, numbers)?`)
      }
    }
  }

  return [...new Set(questions)].slice(0, 3)
}

export default {
  generateSummary,
  generateSkills,
  enhanceExperience,
  fixCVIssues,
  generateMissingMetricsQuestions,
  callDeepSeek,
}