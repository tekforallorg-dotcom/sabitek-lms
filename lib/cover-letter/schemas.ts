/**
 * Cover Letter Builder - Schemas and Types
 */

import { z } from 'zod'

// ============================================
// INPUT TYPES
// ============================================

export type CoverLetterTone = 'professional' | 'warm' | 'confident' | 'direct'
export type CoverLetterLength = 'short' | 'standard' | 'detailed'
export type CoverLetterAction = 'build' | 'tailor'

export interface BuildCoverLetterInput {
  profile: Record<string, unknown>
  targetRole: string
  companyName?: string
  tone?: CoverLetterTone
  length?: CoverLetterLength
  jobDescription?: string
  uploadedCVText?: string
  extraInfo?: string
}

export interface TailorCoverLetterInput extends BuildCoverLetterInput {
  oldCoverLetter: string
  whatChanged?: string
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface CoverLetterSections {
  header: string
  opening: string
  value: string
  fit: string
  closing: string
  signature: string
}

export interface CoverLetterInsights {
  matchedKeywords: string[]
  missingKeywords: string[]
  strongestEvidence: string[]
  warnings: string[]
  specificityScore: number
  toneMatch: string
}

export interface CoverLetterDocument {
  id?: string
  targetRole: string
  companyName?: string
  tone: CoverLetterTone
  length: CoverLetterLength
  letterText: string
  sections: CoverLetterSections
  insights?: CoverLetterInsights
  createdAt?: string
}

// ============================================
// PIPELINE TYPES
// ============================================

export interface RoleRequirements {
  responsibilities: string[]
  mustHaveSkills: string[]
  niceToHaveSkills: string[]
  seniorityLevel: string
  industry?: string
  keywords: string[]
}

export interface CandidateEvidence {
  topAchievements: string[]
  relevantProjects: string[]
  toolsAndStack: string[]
  domainExperience: string[]
  leadershipSignals: string[]
  yearsOfExperience: number
  currentRole?: string
  education?: string
}

export interface EvidenceMapping {
  alignmentPoints: string[]
  keywordGaps: string[]
  repositioningStrategy?: string
  strengthScore: number
}

export interface PipelineContext {
  steps: PipelineStep[]
  currentStep: number
  totalTokens: number
  warnings: string[]
}

export interface PipelineStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  error?: string
  data?: unknown
}

// ============================================
// VALIDATION
// ============================================

export const CoverLetterSectionsSchema = z.object({
  header: z.string(),
  opening: z.string(),
  value: z.string(),
  fit: z.string(),
  closing: z.string(),
  signature: z.string(),
})

export const CoverLetterInsightsSchema = z.object({
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  strongestEvidence: z.array(z.string()),
  warnings: z.array(z.string()),
  specificityScore: z.number(),
  toneMatch: z.string(),
})

export const CoverLetterDocumentSchema = z.object({
  targetRole: z.string(),
  companyName: z.string().optional(),
  tone: z.enum(['professional', 'warm', 'confident', 'direct']),
  length: z.enum(['short', 'standard', 'detailed']),
  letterText: z.string(),
  sections: CoverLetterSectionsSchema,
  insights: CoverLetterInsightsSchema.optional(),
})

// ============================================
// LENGTH CONSTRAINTS
// ============================================

export const LENGTH_CONSTRAINTS = {
  short: { min: 180, max: 250, paragraphs: 3 },
  standard: { min: 250, max: 350, paragraphs: 4 },
  detailed: { min: 350, max: 500, paragraphs: 5 },
} as const

// ============================================
// TONE DESCRIPTORS
// ============================================

export const TONE_DESCRIPTORS = {
  professional: {
    adjectives: ['measured', 'formal', 'polished'],
    avoid: ['casual language', 'contractions', 'humor'],
    example: 'I am confident that my experience aligns well with your requirements.',
  },
  warm: {
    adjectives: ['friendly', 'approachable', 'personable'],
    avoid: ['overly formal language', 'stiff phrasing'],
    example: 'I was genuinely excited to see this opportunity, as it perfectly matches my passion for...',
  },
  confident: {
    adjectives: ['assertive', 'direct', 'self-assured'],
    avoid: ['hedging language', 'excessive qualifiers', 'apologetic tone'],
    example: 'My track record of delivering results makes me an excellent fit for this role.',
  },
  direct: {
    adjectives: ['concise', 'straightforward', 'no-nonsense'],
    avoid: ['flowery language', 'unnecessary filler', 'long sentences'],
    example: 'I have 5 years of experience in X. I can start immediately.',
  },
} as const

// ============================================
// QUALITY CHECKS
// ============================================

export interface QualityCheckResult {
  passed: boolean
  score: number
  issues: QualityIssue[]
}

export interface QualityIssue {
  type: 'error' | 'warning'
  category: string
  message: string
  suggestion?: string
}

export function validateCoverLetter(letter: CoverLetterDocument): QualityCheckResult {
  const issues: QualityIssue[] = []
  let score = 100

  // Check length
  const wordCount = letter.letterText.split(/\s+/).length
  const constraints = LENGTH_CONSTRAINTS[letter.length]
  
  if (wordCount < constraints.min) {
    issues.push({
      type: 'warning',
      category: 'length',
      message: `Letter is too short (${wordCount} words, minimum ${constraints.min})`,
      suggestion: 'Add more specific achievements or details',
    })
    score -= 10
  }
  
  if (wordCount > constraints.max * 1.2) {
    issues.push({
      type: 'warning',
      category: 'length',
      message: `Letter is too long (${wordCount} words, maximum ${constraints.max})`,
      suggestion: 'Remove redundant phrases and tighten language',
    })
    score -= 10
  }

  // Check for clichés
  const cliches = [
    'i am excited',
    'dynamic professional',
    'fast learner',
    'results-driven',
    'think outside the box',
    'team player',
    'go-getter',
    'passionate about',
    'leverage my skills',
  ]
  
  const lowerText = letter.letterText.toLowerCase()
  for (const cliche of cliches) {
    if (lowerText.includes(cliche)) {
      issues.push({
        type: 'warning',
        category: 'cliche',
        message: `Contains cliché phrase: "${cliche}"`,
        suggestion: 'Replace with specific, evidence-backed statement',
      })
      score -= 5
    }
  }

  // Check sections exist
  if (!letter.sections.opening || letter.sections.opening.length < 50) {
    issues.push({
      type: 'error',
      category: 'structure',
      message: 'Opening paragraph is missing or too short',
    })
    score -= 15
  }

  if (!letter.sections.value || letter.sections.value.length < 100) {
    issues.push({
      type: 'error',
      category: 'structure',
      message: 'Value proposition paragraph is missing or too short',
    })
    score -= 15
  }

  // Check for specificity (numbers, metrics, company name)
  const hasMetrics = /\d+%|\d+\s*(users|clients|projects|tickets|team|people)/i.test(letter.letterText)
  if (!hasMetrics) {
    issues.push({
      type: 'warning',
      category: 'specificity',
      message: 'No quantifiable achievements found',
      suggestion: 'Add specific metrics like "supported 500+ users" or "reduced time by 30%"',
    })
    score -= 10
  }

  const hasCompanyReference = letter.companyName && letter.letterText.includes(letter.companyName)
  if (letter.companyName && !hasCompanyReference) {
    issues.push({
      type: 'warning',
      category: 'personalization',
      message: 'Company name not mentioned in letter body',
      suggestion: 'Reference the company specifically to show genuine interest',
    })
    score -= 5
  }

  return {
    passed: score >= 70 && !issues.some(i => i.type === 'error'),
    score: Math.max(0, score),
    issues,
  }
}