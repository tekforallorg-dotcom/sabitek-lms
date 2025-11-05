// lib/sabiquiz/validators.ts

/**
 * Nigerian-specific quality validators
 * Ensures questions use local context, names, currency, etc.
 */

// Forbidden Western-centric terms
const FORBIDDEN_TERMS = [
  'snow', 'winter', 'subway', 'thanksgiving', 'halloween',
  'john', 'mary', 'tom', 'sarah', 'london', 'paris', 'new york',
  '$', '£', '€', 'miles', 'feet', 'pounds', 'fahrenheit',
  'soccer', 'mom', 'honor', 'color', // American spellings
]

// Required Nigerian context
const NIGERIAN_NAMES = [
  'chidi', 'amina', 'tunde', 'ngozi', 'ibrahim', 'fatima',
  'emeka', 'zainab', 'ade', 'hauwa', 'uche', 'aisha',
  'bola', 'yusuf', 'adamu', 'blessing', 'chinwe', 'musa',
]

const NIGERIAN_CITIES = [
  'lagos', 'kano', 'abuja', 'port harcourt', 'ibadan',
  'benin city', 'enugu', 'jos', 'kaduna', 'calabar',
]

const NIGERIAN_FOODS = [
  'jollof', 'suya', 'eba', 'amala', 'pounded yam',
  'egusi', 'ogbono', 'akara', 'moi moi', 'fufu',
]

export interface ValidationResult {
  score: number // 0-1
  passed: boolean
  issues: string[]
}

export interface Question {
  question: string
  options: string[]
  correct_answer: number
  rationale: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
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
  quality_score?: number
  reuse_count: number
  created_by: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

/**
 * Validate a single question for Nigerian context
 */
export function validateQuestion(question: Question): ValidationResult {
  const issues: string[] = []
  let score = 1.0

  const allText = [
    question.question,
    ...question.options,
    question.rationale,
  ].join(' ').toLowerCase()

  // 1. Check for forbidden Western terms
  const foundForbidden = FORBIDDEN_TERMS.filter(term => 
    allText.includes(term.toLowerCase())
  )
  if (foundForbidden.length > 0) {
    issues.push(`Contains Western terms: ${foundForbidden.join(', ')}`)
    score -= 0.3
  }

  // 2. Check for Nigerian context (names, cities, or foods)
  const hasNigerianContext = 
    NIGERIAN_NAMES.some(name => allText.includes(name)) ||
    NIGERIAN_CITIES.some(city => allText.includes(city)) ||
    NIGERIAN_FOODS.some(food => allText.includes(food))

  if (!hasNigerianContext && allText.includes('person')) {
    issues.push('Uses generic names instead of Nigerian names')
    score -= 0.2
  }

  // 3. Check currency
  if (allText.includes('$') || allText.includes('dollar')) {
    issues.push('Uses dollars ($) instead of Naira (₦)')
    score -= 0.2
  }

  // 4. Check units
  if (allText.includes('mile') || allText.includes('feet')) {
    issues.push('Uses imperial units instead of metric')
    score -= 0.1
  }

  // 5. Verify question structure
  if (!question.question || question.question.length < 10) {
    issues.push('Question text too short')
    score -= 0.2
  }

  if (question.options.length !== 4) {
    issues.push(`Must have 4 options, found ${question.options.length}`)
    score -= 0.3
  }

  if (question.correct_answer < 0 || question.correct_answer > 3) {
    issues.push('Invalid correct answer index')
    score -= 0.5
  }

  // 6. Check for duplicate or too-similar options
  const uniqueOptions = new Set(question.options.map(o => o.toLowerCase()))
  if (uniqueOptions.size < question.options.length) {
    issues.push('Duplicate or too-similar answer options')
    score -= 0.2
  }

  // 7. Check rationale quality
  if (!question.rationale || question.rationale.length < 20) {
    issues.push('Rationale too short or missing')
    score -= 0.1
  }

  // Ensure score doesn't go negative
  score = Math.max(0, score)

  return {
    score,
    passed: score >= 0.75 && issues.length === 0,
    issues,
  }
}

/**
 * Validate multiple questions
 */
export function validateQuestions(questions: Question[]): {
  overallScore: number
  passedCount: number
  failedCount: number
  results: ValidationResult[]
} {
  const results = questions.map(validateQuestion)
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.length - passedCount
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  return {
    overallScore,
    passedCount,
    failedCount,
    results,
  }
}

/**
 * Check if text contains proper Nigerian context
 */
export function hasNigerianContext(text: string): boolean {
  const lower = text.toLowerCase()
  
  return (
    NIGERIAN_NAMES.some(name => lower.includes(name)) ||
    NIGERIAN_CITIES.some(city => lower.includes(city)) ||
    NIGERIAN_FOODS.some(food => lower.includes(food)) ||
    lower.includes('naira') ||
    lower.includes('₦')
  )
}