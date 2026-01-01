// lib/sabiquiz/validators.ts

/**
 * Question validators for SabiQuiz
 * Supports both legacy Nigerian-context validation and new quality-based validation
 */

// ============================================================================
// TYPES
// ============================================================================

export type QuestionType = 'single_correct' | 'multi_select' | 'best_answer'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Question {
  // Core fields
  question: string
  stem?: string // Alternative field name for question
  options: string[]
  correct_answer: number
  correct_answers?: number[] // For multi-select questions
  rationale?: string
  explanation?: string // Alternative field name for rationale
  difficulty?: DifficultyLevel
  topic?: string
  
  // Extended fields for new pipeline
  question_type?: QuestionType
  quality_score?: number
  source_chunk_ids?: string[]
  mode?: 'school' | 'corporate' | 'certification'
}

/**
 * Database question type (includes all database fields)
 */
export interface DatabaseQuestion extends Question {
  id: string
  material_id: string
  category: string
  level: string
  status: string
  reuse_count: number
  created_by: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface ValidationResult {
  score: number // 0-1
  passed: boolean
  issues: string[]
  checks: ValidationChecks
}

export interface ValidationChecks {
  hasValidStructure: boolean
  hasBalancedOptions: boolean
  hasPlausibleDistractors: boolean
  hasGoodExplanation: boolean
  noGiveaways: boolean
  difficultyAppropriate: boolean
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Structure requirements
  MIN_QUESTION_LENGTH: 15,
  MAX_QUESTION_LENGTH: 500,
  MIN_OPTIONS: 4,
  MAX_OPTIONS: 6,
  MIN_OPTION_LENGTH: 1,
  MAX_OPTION_LENGTH: 200,
  
  // Explanation requirements
  MIN_EXPLANATION_LENGTH: 30,
  
  // Option balance thresholds
  OPTION_LENGTH_VARIANCE_MAX: 2.5, // Max ratio of longest to shortest option
  
  // Quality thresholds
  PASS_THRESHOLD: 0.6,
  HIGH_QUALITY_THRESHOLD: 0.85,
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a single question for quality
 */
export function validateQuestion(question: Question): ValidationResult {
  const issues: string[] = []
  const checks: ValidationChecks = {
    hasValidStructure: true,
    hasBalancedOptions: true,
    hasPlausibleDistractors: true,
    hasGoodExplanation: true,
    noGiveaways: true,
    difficultyAppropriate: true,
  }

  let score = 1.0

  // Get question text (support both field names)
  const questionText = question.question || question.stem || ''
  const explanationText = question.rationale || question.explanation || ''

  // ============================================
  // 1. STRUCTURE VALIDATION
  // ============================================
  
  // Check question text
  if (!questionText || questionText.length < CONFIG.MIN_QUESTION_LENGTH) {
    issues.push('Question text too short')
    score -= 0.25
    checks.hasValidStructure = false
  }
  
  if (questionText.length > CONFIG.MAX_QUESTION_LENGTH) {
    issues.push('Question text too long')
    score -= 0.1
  }

  // Check options array
  if (!question.options || !Array.isArray(question.options)) {
    issues.push('Missing options array')
    score -= 0.5
    checks.hasValidStructure = false
  } else {
    // Check option count
    const optionCount = question.options.length
    if (optionCount < CONFIG.MIN_OPTIONS) {
      issues.push(`Too few options: ${optionCount} (minimum ${CONFIG.MIN_OPTIONS})`)
      score -= 0.3
      checks.hasValidStructure = false
    } else if (optionCount > CONFIG.MAX_OPTIONS) {
      issues.push(`Too many options: ${optionCount} (maximum ${CONFIG.MAX_OPTIONS})`)
      score -= 0.1
    }

    // Check for empty options
    const emptyOptions = question.options.filter(o => !o || o.trim().length === 0)
    if (emptyOptions.length > 0) {
      issues.push('Contains empty options')
      score -= 0.2
      checks.hasValidStructure = false
    }
  }

  // Check correct answer index
  const isMultiSelect = question.question_type === 'multi_select'
  
  if (isMultiSelect) {
    if (!question.correct_answers || !Array.isArray(question.correct_answers)) {
      issues.push('Multi-select question missing correct_answers array')
      score -= 0.4
      checks.hasValidStructure = false
    } else {
      const invalidIndices = question.correct_answers.filter(
        i => i < 0 || i >= (question.options?.length || 0)
      )
      if (invalidIndices.length > 0) {
        issues.push('Invalid correct answer indices for multi-select')
        score -= 0.4
        checks.hasValidStructure = false
      }
    }
  } else {
    if (typeof question.correct_answer !== 'number') {
      issues.push('Missing correct_answer')
      score -= 0.4
      checks.hasValidStructure = false
    } else if (question.correct_answer < 0 || question.correct_answer >= (question.options?.length || 0)) {
      issues.push('Invalid correct answer index')
      score -= 0.4
      checks.hasValidStructure = false
    }
  }

  // ============================================
  // 2. OPTION QUALITY VALIDATION
  // ============================================
  
  if (question.options && question.options.length >= CONFIG.MIN_OPTIONS) {
    // Check for duplicate options
    const lowerOptions = question.options.map(o => (o || '').toLowerCase().trim())
    const uniqueOptions = new Set(lowerOptions)
    if (uniqueOptions.size < question.options.length) {
      issues.push('Duplicate or too-similar options')
      score -= 0.2
      checks.hasPlausibleDistractors = false
    }

    // Check option length balance (anti-giveaway)
    const optionLengths = question.options.map(o => (o || '').length)
    const maxLength = Math.max(...optionLengths)
    const minLength = Math.max(1, Math.min(...optionLengths))
    const lengthRatio = maxLength / minLength

    if (lengthRatio > CONFIG.OPTION_LENGTH_VARIANCE_MAX) {
      issues.push('Option lengths too unbalanced (potential giveaway)')
      score -= 0.15
      checks.hasBalancedOptions = false
    }

    // Check if correct answer is significantly longer than others
    if (!isMultiSelect && typeof question.correct_answer === 'number') {
      const correctLength = optionLengths[question.correct_answer] || 0
      const avgOtherLength = optionLengths
        .filter((_, i) => i !== question.correct_answer)
        .reduce((a, b) => a + b, 0) / (optionLengths.length - 1)
      
      if (correctLength > avgOtherLength * 1.5) {
        issues.push('Correct answer is significantly longer than distractors')
        score -= 0.15
        checks.noGiveaways = false
      }
    }

    // Check for "All of the above" / "None of the above" (discouraged)
    const hasAllNone = question.options.some(o => {
      const lower = (o || '').toLowerCase()
      return lower.includes('all of the above') || 
             lower.includes('none of the above') ||
             lower.includes('all the above') ||
             lower.includes('none the above')
    })
    if (hasAllNone) {
      issues.push('Contains "all/none of the above" option (discouraged)')
      score -= 0.1
    }

    // Check for absolute language in options
    const absoluteTerms = ['always', 'never', 'only', 'must', 'cannot']
    const optionsWithAbsolutes = question.options.filter(o => {
      const lower = (o || '').toLowerCase()
      return absoluteTerms.some(term => lower.includes(term))
    })
    if (optionsWithAbsolutes.length === 1) {
      // Only one option has absolute language - potential giveaway
      issues.push('Single option with absolute language (potential giveaway)')
      score -= 0.1
      checks.noGiveaways = false
    }
  }

  // ============================================
  // 3. EXPLANATION VALIDATION
  // ============================================
  
  if (!explanationText || explanationText.length < CONFIG.MIN_EXPLANATION_LENGTH) {
    issues.push('Explanation too short or missing')
    score -= 0.15
    checks.hasGoodExplanation = false
  } else {
    // Check if explanation is circular (just restates the question)
    const questionWords = new Set(questionText.toLowerCase().split(/\s+/))
    const explanationWords = explanationText.toLowerCase().split(/\s+/)
    const overlap = explanationWords.filter(w => questionWords.has(w)).length
    const overlapRatio = overlap / explanationWords.length
    
    if (overlapRatio > 0.7) {
      issues.push('Explanation appears to be circular')
      score -= 0.1
      checks.hasGoodExplanation = false
    }
  }

  // ============================================
  // 4. DIFFICULTY VALIDATION
  // ============================================
  
  if (question.difficulty) {
    const diff = question.difficulty
    const qLength = questionText.length
    const hasScenario = questionText.includes('scenario') || 
                       questionText.includes('situation') ||
                       questionText.includes('case')
    
    // Basic heuristic checks
    if (diff === 'easy' && qLength > 200 && hasScenario) {
      issues.push('Question marked easy but appears complex')
      score -= 0.05
      checks.difficultyAppropriate = false
    }
    
    if (diff === 'hard' && qLength < 50 && !hasScenario) {
      issues.push('Question marked hard but appears simple')
      score -= 0.05
      checks.difficultyAppropriate = false
    }
  }

  // Ensure score doesn't go negative
  score = Math.max(0, Math.min(1, score))

  return {
    score,
    passed: score >= CONFIG.PASS_THRESHOLD && checks.hasValidStructure,
    issues,
    checks,
  }
}

/**
 * Validate multiple questions
 */
export function validateQuestions(questions: Question[]): {
  overallScore: number
  passedCount: number
  failedCount: number
  highQualityCount: number
  results: ValidationResult[]
} {
  if (!questions || questions.length === 0) {
    return {
      overallScore: 0,
      passedCount: 0,
      failedCount: 0,
      highQualityCount: 0,
      results: [],
    }
  }

  const results = questions.map(validateQuestion)
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.length - passedCount
  const highQualityCount = results.filter(r => r.score >= CONFIG.HIGH_QUALITY_THRESHOLD).length
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  return {
    overallScore,
    passedCount,
    failedCount,
    highQualityCount,
    results,
  }
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/**
 * Calculate a quality score for a question
 */
export function calculateQualityScore(question: Question): number {
  const validation = validateQuestion(question)
  
  let score = validation.score
  
  // Bonus for good structure
  if (validation.checks.hasValidStructure) score += 0.05
  if (validation.checks.hasBalancedOptions) score += 0.05
  if (validation.checks.hasGoodExplanation) score += 0.05
  if (validation.checks.noGiveaways) score += 0.05
  
  // Normalize to 0-1
  return Math.max(0, Math.min(1, score))
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a question is high quality
 */
export function isHighQuality(question: Question): boolean {
  const validation = validateQuestion(question)
  return validation.score >= CONFIG.HIGH_QUALITY_THRESHOLD
}

/**
 * Get question text (handles both field names)
 */
export function getQuestionText(question: Question): string {
  return question.question || question.stem || ''
}

/**
 * Get explanation text (handles both field names)
 */
export function getExplanationText(question: Question): string {
  return question.rationale || question.explanation || ''
}

/**
 * Normalize a question to standard field names
 */
export function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    question: question.question || question.stem || '',
    rationale: question.rationale || question.explanation || '',
    difficulty: question.difficulty || 'medium',
    question_type: question.question_type || 'single_correct',
  }
}