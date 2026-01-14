/**
 * Role Diff & Tone Shift Logic
 * 
 * Analyzes compatibility between resume and target JD:
 * - Role compatibility scoring
 * - Tone level detection (entry/mid/senior)
 * - Tone shift recommendations
 * - Keyword alignment suggestions
 */

import type { ResumeSchema, JobSchema } from './schemas'

// Tone level definitions
export type ToneLevel = 'entry' | 'mid' | 'senior' | 'executive'

export interface RoleDiff {
  targetRole: string
  resumeRoleFocus: string
  compatibilityScore: number // 0-1
  toneShift: 'downshift' | 'same' | 'upshift'
  resumeToneLevel: ToneLevel
  targetToneLevel: ToneLevel
  suggestedChanges: {
    remove: string[] // Phrases to tone down/remove
    add: string[]    // Phrases to add/emphasize
  }
  keywordGaps: string[]
  warnings: string[]
}

// Senior-level words to avoid for entry/mid roles
const SENIOR_WORDS = [
  'strategic', 'spearheaded', 'architected', 'transformed',
  'cross-functional leadership', 'roadmap ownership', 'executive',
  'enterprise-wide', 'global initiative', 'board-level',
  'organizational change', 'digital transformation', 'C-suite',
  'P&L responsibility', 'budget ownership', 'strategic vision',
]

// Entry-level words that may seem weak for senior roles
const ENTRY_WORDS = [
  'assisted', 'helped', 'supported', 'participated',
  'worked on', 'was involved in', 'contributed to',
  'learned', 'familiar with', 'exposed to',
]

// Strong action verbs by level
const VERBS_BY_LEVEL: Record<ToneLevel, string[]> = {
  entry: [
    'Assisted', 'Supported', 'Contributed', 'Collaborated',
    'Completed', 'Executed', 'Performed', 'Maintained',
  ],
  mid: [
    'Managed', 'Led', 'Developed', 'Implemented',
    'Improved', 'Optimized', 'Delivered', 'Coordinated',
  ],
  senior: [
    'Spearheaded', 'Architected', 'Transformed', 'Pioneered',
    'Orchestrated', 'Drove', 'Championed', 'Established',
  ],
  executive: [
    'Envisioned', 'Directed', 'Governed', 'Founded',
    'Revolutionized', 'Scaled', 'Steered', 'Shaped',
  ],
}

// Keywords that indicate seniority level in JDs
const LEVEL_INDICATORS = {
  entry: [
    'entry-level', 'junior', 'associate', 'trainee',
    '0-2 years', '1-2 years', 'graduate', 'intern',
    'no experience required', 'will train',
  ],
  mid: [
    'mid-level', '3-5 years', '2-5 years', '3+ years',
    'experienced', 'professional', 'specialist',
  ],
  senior: [
    'senior', 'lead', 'principal', '5+ years', '7+ years',
    '5-10 years', 'expert', 'architect', 'head of',
  ],
  executive: [
    'director', 'VP', 'vice president', 'chief', 'CTO', 'CIO',
    'executive', '10+ years', '15+ years', 'C-level',
  ],
}

/**
 * Detect tone level from text content
 */
export function detectToneLevel(text: string): ToneLevel {
  const textLower = text.toLowerCase()
  
  const scores = {
    entry: 0,
    mid: 0,
    senior: 0,
    executive: 0,
  }
  
  // Check level indicators
  for (const [level, indicators] of Object.entries(LEVEL_INDICATORS)) {
    for (const indicator of indicators) {
      if (textLower.includes(indicator.toLowerCase())) {
        scores[level as ToneLevel] += 2
      }
    }
  }
  
  // Check verb usage
  for (const [level, verbs] of Object.entries(VERBS_BY_LEVEL)) {
    for (const verb of verbs) {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        scores[level as ToneLevel] += matches.length
      }
    }
  }
  
  // Check senior words
  for (const word of SENIOR_WORDS) {
    if (textLower.includes(word.toLowerCase())) {
      scores.senior += 1
      scores.executive += 1
    }
  }
  
  // Check entry words
  for (const word of ENTRY_WORDS) {
    if (textLower.includes(word.toLowerCase())) {
      scores.entry += 1
    }
  }
  
  // Find highest score
  let maxLevel: ToneLevel = 'mid'
  let maxScore = scores.mid
  
  for (const [level, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxLevel = level as ToneLevel
    }
  }
  
  return maxLevel
}

/**
 * Detect tone level from job description
 */
export function detectJDToneLevel(jd: JobSchema): ToneLevel {
  // Use explicit level if provided
  if (jd.level) {
    const levelMap: Record<string, ToneLevel> = {
      entry: 'entry',
      mid: 'mid',
      senior: 'senior',
      lead: 'senior',
      executive: 'executive',
    }
    if (levelMap[jd.level]) {
      return levelMap[jd.level]
    }
  }
  
  // Analyze JD text
  const jdText = [
    jd.role_title,
    ...jd.responsibilities,
    ...jd.must_have,
    ...jd.nice_to_have,
  ].join(' ')
  
  return detectToneLevel(jdText)
}

/**
 * Detect tone level from resume
 */
export function detectResumeToneLevel(resume: ResumeSchema): ToneLevel {
  const resumeText = [
    resume.basics.headline || '',
    resume.summary,
    ...resume.experience.flatMap(exp => [
      exp.title,
      ...exp.bullets.map(b => b.text),
    ]),
  ].join(' ')
  
  return resumeText ? detectToneLevel(resumeText) : 'mid'
}

/**
 * Calculate role compatibility score
 */
export function calculateCompatibility(
  resume: ResumeSchema,
  jd: JobSchema
): number {
  let score = 0
  let totalWeight = 0
  
  // Skill overlap (weight: 40%)
  const resumeSkills = new Set([
    ...resume.skills.core,
    ...resume.skills.technical,
    ...resume.skills.tools,
  ].map(s => s.toLowerCase()))
  
  const jdSkills = new Set([
    ...jd.must_have,
    ...jd.nice_to_have,
    ...jd.tools_stack,
    ...jd.keywords_top_25,
  ].map(s => s.toLowerCase()))
  
  let skillMatches = 0
  for (const skill of jdSkills) {
    for (const resumeSkill of resumeSkills) {
      if (resumeSkill.includes(skill) || skill.includes(resumeSkill)) {
        skillMatches++
        break
      }
    }
  }
  
  const skillScore = jdSkills.size > 0 ? skillMatches / jdSkills.size : 0
  score += skillScore * 40
  totalWeight += 40
  
  // Title/role similarity (weight: 30%)
  const resumeTitles = resume.experience.map(e => e.title.toLowerCase())
  const targetTitle = jd.role_title.toLowerCase()
  
  let titleScore = 0
  for (const title of resumeTitles) {
    // Check for word overlap
    const titleWords = title.split(/\s+/)
    const targetWords = targetTitle.split(/\s+/)
    const overlap = titleWords.filter(w => 
      targetWords.some(tw => tw.includes(w) || w.includes(tw))
    ).length
    titleScore = Math.max(titleScore, overlap / Math.max(targetWords.length, 1))
  }
  
  score += titleScore * 30
  totalWeight += 30
  
  // Industry alignment (weight: 15%)
  // Simplified - check if resume mentions industry
  if (jd.industry) {
    const resumeText = JSON.stringify(resume).toLowerCase()
    const industryMatch = resumeText.includes(jd.industry.toLowerCase())
    score += industryMatch ? 15 : 5
  } else {
    score += 10 // Neutral if no industry specified
  }
  totalWeight += 15
  
  // Experience level match (weight: 15%)
  const resumeLevel = detectResumeToneLevel(resume)
  const jdLevel = detectJDToneLevel(jd)
  
  const levelOrder: ToneLevel[] = ['entry', 'mid', 'senior', 'executive']
  const resumeIdx = levelOrder.indexOf(resumeLevel)
  const jdIdx = levelOrder.indexOf(jdLevel)
  const levelDiff = Math.abs(resumeIdx - jdIdx)
  
  const levelScore = levelDiff === 0 ? 15 : levelDiff === 1 ? 10 : 5
  score += levelScore
  totalWeight += 15
  
  return Math.min(1, score / totalWeight)
}

/**
 * Determine tone shift needed
 */
export function determineToneShift(
  resumeLevel: ToneLevel,
  targetLevel: ToneLevel
): 'downshift' | 'same' | 'upshift' {
  const levelOrder: ToneLevel[] = ['entry', 'mid', 'senior', 'executive']
  const resumeIdx = levelOrder.indexOf(resumeLevel)
  const targetIdx = levelOrder.indexOf(targetLevel)
  
  if (resumeIdx > targetIdx) return 'downshift'
  if (resumeIdx < targetIdx) return 'upshift'
  return 'same'
}

/**
 * Get phrases to add/remove based on tone shift
 */
export function getToneShiftSuggestions(
  toneShift: 'downshift' | 'same' | 'upshift',
  targetLevel: ToneLevel
): { remove: string[]; add: string[] } {
  if (toneShift === 'same') {
    return { remove: [], add: [] }
  }
  
  if (toneShift === 'downshift') {
    return {
      remove: SENIOR_WORDS.slice(0, 10),
      add: VERBS_BY_LEVEL[targetLevel] || VERBS_BY_LEVEL.mid,
    }
  }
  
  // Upshift
  return {
    remove: ENTRY_WORDS,
    add: VERBS_BY_LEVEL[targetLevel] || VERBS_BY_LEVEL.senior,
  }
}

/**
 * Identify keyword gaps between resume and JD
 */
export function identifyKeywordGaps(
  resume: ResumeSchema,
  jd: JobSchema
): string[] {
  const resumeText = JSON.stringify(resume).toLowerCase()
  
  const jdKeywords = [
    ...jd.must_have,
    ...jd.keywords_top_25,
    ...jd.tools_stack,
  ]
  
  const missing: string[] = []
  
  for (const keyword of jdKeywords) {
    const keywordLower = keyword.toLowerCase()
    // Check for exact match or partial match
    if (!resumeText.includes(keywordLower)) {
      // Check for common variations
      const variations = [
        keywordLower,
        keywordLower.replace(/-/g, ' '),
        keywordLower.replace(/\s+/g, ''),
      ]
      
      const hasMatch = variations.some(v => resumeText.includes(v))
      if (!hasMatch) {
        missing.push(keyword)
      }
    }
  }
  
  // Dedupe and limit
  return [...new Set(missing)].slice(0, 15)
}

/**
 * Main function: Analyze role compatibility and generate diff
 */
export function analyzeRoleDiff(
  resume: ResumeSchema,
  jd: JobSchema
): RoleDiff {
  const resumeToneLevel = detectResumeToneLevel(resume)
  const targetToneLevel = detectJDToneLevel(jd)
  const compatibilityScore = calculateCompatibility(resume, jd)
  const toneShift = determineToneShift(resumeToneLevel, targetToneLevel)
  const suggestions = getToneShiftSuggestions(toneShift, targetToneLevel)
  const keywordGaps = identifyKeywordGaps(resume, jd)
  
  // Generate warnings
  const warnings: string[] = []
  
  if (compatibilityScore < 0.4) {
    warnings.push('Low role compatibility - significant tailoring needed')
  }
  
  if (toneShift === 'downshift') {
    warnings.push('Resume tone is more senior than target - avoid over-qualification signals')
  }
  
  if (toneShift === 'upshift') {
    warnings.push('Target role is more senior - emphasize leadership and impact')
  }
  
  if (keywordGaps.length > 10) {
    warnings.push('Many missing keywords - may need to highlight transferable skills')
  }
  
  // Determine resume role focus from most recent title
  const resumeRoleFocus = resume.experience[0]?.title || 'Unknown'
  
  return {
    targetRole: jd.role_title,
    resumeRoleFocus,
    compatibilityScore,
    toneShift,
    resumeToneLevel,
    targetToneLevel,
    suggestedChanges: suggestions,
    keywordGaps,
    warnings,
  }
}

/**
 * Get appropriate verbs for target level
 */
export function getVerbsForLevel(level: ToneLevel): string[] {
  return VERBS_BY_LEVEL[level] || VERBS_BY_LEVEL.mid
}

/**
 * Check if a bullet should be rewritten based on tone
 */
export function shouldRewriteBullet(
  bulletText: string,
  targetLevel: ToneLevel,
  toneShift: 'downshift' | 'same' | 'upshift'
): { rewrite: boolean; reason?: string } {
  const textLower = bulletText.toLowerCase()
  
  // Check for tone mismatches
  if (toneShift === 'downshift') {
    for (const word of SENIOR_WORDS) {
      if (textLower.includes(word.toLowerCase())) {
        return { rewrite: true, reason: `Contains senior-level language: "${word}"` }
      }
    }
  }
  
  if (toneShift === 'upshift') {
    for (const word of ENTRY_WORDS) {
      if (textLower.includes(word.toLowerCase())) {
        return { rewrite: true, reason: `Contains weak/entry-level language: "${word}"` }
      }
    }
  }
  
  // Check if starts with weak verb
  const firstWord = bulletText.split(/\s+/)[0]
  if (ENTRY_WORDS.some(w => w.toLowerCase() === firstWord.toLowerCase())) {
    return { rewrite: true, reason: 'Starts with weak action verb' }
  }
  
  return { rewrite: false }
}

export default {
  analyzeRoleDiff,
  detectToneLevel,
  detectJDToneLevel,
  detectResumeToneLevel,
  calculateCompatibility,
  determineToneShift,
  getToneShiftSuggestions,
  identifyKeywordGaps,
  getVerbsForLevel,
  shouldRewriteBullet,
}