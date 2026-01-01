// lib/sabiquiz/reviewer.ts

import { generateContent, extractJSON } from './gemini-client'
import { buildReviewPrompt } from './prompts'
import { 
  validateQuestion, 
  calculateQualityScore, 
  normalizeQuestion,
  type Question, 
  type ValidationResult 
} from './validators'
import type { ContextProfile } from './context-profile'
import type { ChunkRecord } from './chunker'

// ============================================================================
// TYPES
// ============================================================================

export type ReviewStatus = 'approved' | 'fixed' | 'rejected'

export interface ReviewResult {
  status: ReviewStatus
  question: Question
  originalScore: number
  finalScore: number
  fixes_applied?: string[]
  rejection_reason?: string
  validation: ValidationResult
}

export interface BatchReviewResult {
  approved: Question[]
  fixed: Question[]
  rejected: Question[]
  totalReviewed: number
  approvalRate: number
  averageScore: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Score thresholds
  AUTO_APPROVE_THRESHOLD: 0.85, // Auto-approve high quality
  REVIEW_THRESHOLD: 0.6,        // Below this, try to fix
  REJECT_THRESHOLD: 0.4,        // Below this, reject outright
  
  // Repair limits
  MAX_REPAIR_ATTEMPTS: 2,
  
  // Batch processing
  BATCH_SIZE: 5, // Review 5 questions at a time
}

// ============================================================================
// SINGLE QUESTION REVIEW
// ============================================================================

/**
 * Review a single question and decide: approve, fix, or reject
 */
export async function reviewQuestion(
  question: Question,
  profile: ContextProfile,
  sourceChunks: ChunkRecord[]
): Promise<ReviewResult> {
  // Normalize the question first
  const normalized = normalizeQuestion(question)
  
  // Initial validation
  const initialValidation = validateQuestion(normalized)
  const initialScore = calculateQualityScore(normalized)

  // Auto-approve if high quality
  if (initialScore >= CONFIG.AUTO_APPROVE_THRESHOLD && initialValidation.passed) {
    console.log(`[Reviewer] Auto-approved (score: ${initialScore.toFixed(2)})`)
    return {
      status: 'approved',
      question: { ...normalized, quality_score: initialScore },
      originalScore: initialScore,
      finalScore: initialScore,
      validation: initialValidation,
    }
  }

  // Auto-reject if too low quality
  if (initialScore < CONFIG.REJECT_THRESHOLD) {
    console.log(`[Reviewer] Auto-rejected (score: ${initialScore.toFixed(2)})`)
    return {
      status: 'rejected',
      question: normalized,
      originalScore: initialScore,
      finalScore: initialScore,
      rejection_reason: `Quality score too low: ${initialScore.toFixed(2)}. Issues: ${initialValidation.issues.join(', ')}`,
      validation: initialValidation,
    }
  }

  // Try to fix if in middle range
  if (initialScore < CONFIG.AUTO_APPROVE_THRESHOLD) {
    console.log(`[Reviewer] Attempting repair (score: ${initialScore.toFixed(2)})`)
    return await attemptRepair(normalized, profile, sourceChunks, initialScore, initialValidation)
  }

  // Default: approve with current score
  return {
    status: 'approved',
    question: { ...normalized, quality_score: initialScore },
    originalScore: initialScore,
    finalScore: initialScore,
    validation: initialValidation,
  }
}

/**
 * Attempt to repair a question using AI
 */
async function attemptRepair(
  question: Question,
  profile: ContextProfile,
  sourceChunks: ChunkRecord[],
  originalScore: number,
  originalValidation: ValidationResult
): Promise<ReviewResult> {
  let currentQuestion = question
  let currentScore = originalScore
  let fixesApplied: string[] = []

  for (let attempt = 0; attempt < CONFIG.MAX_REPAIR_ATTEMPTS; attempt++) {
    try {
      // Build repair prompt
      const prompt = buildReviewPrompt(profile, currentQuestion, sourceChunks)
      
      const response = await generateContent(
        prompt.systemPrompt + '\n\n' + prompt.userPrompt,
        { temperature: 0.3 } // Lower temperature for more consistent fixes
      )

      const result = extractJSON<{
        status: 'approved' | 'fix' | 'reject'
        question?: Question
        fixes_applied?: string[]
        reason?: string
      }>(response)

      if (result.status === 'approved' && result.question) {
        // AI approved - validate the returned question
        const fixed = normalizeQuestion(result.question)
        const newScore = calculateQualityScore(fixed)
        
        if (newScore > currentScore) {
          currentQuestion = fixed
          currentScore = newScore
          fixesApplied.push(...(result.fixes_applied || ['AI improvements']))
        }
        
        break
      } else if (result.status === 'fix' && result.question) {
        // AI made fixes - apply and continue
        const fixed = normalizeQuestion(result.question)
        const newValidation = validateQuestion(fixed)
        const newScore = calculateQualityScore(fixed)
        
        if (newScore > currentScore) {
          currentQuestion = fixed
          currentScore = newScore
          fixesApplied.push(...(result.fixes_applied || ['AI fixes']))
          
          // If now high quality, stop
          if (newScore >= CONFIG.AUTO_APPROVE_THRESHOLD) {
            break
          }
        } else {
          // Fixes didn't improve, stop
          break
        }
      } else if (result.status === 'reject') {
        // AI says unfixable
        return {
          status: 'rejected',
          question: currentQuestion,
          originalScore,
          finalScore: currentScore,
          rejection_reason: result.reason || 'AI reviewer determined question is unfixable',
          validation: originalValidation,
        }
      }
    } catch (error) {
      console.error(`[Reviewer] Repair attempt ${attempt + 1} failed:`, error)
    }
  }

  // Determine final status
  const finalValidation = validateQuestion(currentQuestion)
  
  if (currentScore >= CONFIG.REVIEW_THRESHOLD && finalValidation.passed) {
    return {
      status: fixesApplied.length > 0 ? 'fixed' : 'approved',
      question: { ...currentQuestion, quality_score: currentScore },
      originalScore,
      finalScore: currentScore,
      fixes_applied: fixesApplied.length > 0 ? fixesApplied : undefined,
      validation: finalValidation,
    }
  }

  return {
    status: 'rejected',
    question: currentQuestion,
    originalScore,
    finalScore: currentScore,
    rejection_reason: `Could not fix to acceptable quality. Final score: ${currentScore.toFixed(2)}`,
    validation: finalValidation,
  }
}

// ============================================================================
// BATCH REVIEW
// ============================================================================

/**
 * Review multiple questions in batch
 */
export async function reviewQuestions(
  questions: Question[],
  profile: ContextProfile,
  sourceChunks: ChunkRecord[]
): Promise<BatchReviewResult> {
  const approved: Question[] = []
  const fixed: Question[] = []
  const rejected: Question[] = []
  let totalScore = 0

  console.log(`[Reviewer] Reviewing ${questions.length} questions...`)

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    
    try {
      const result = await reviewQuestion(question, profile, sourceChunks)
      totalScore += result.finalScore

      switch (result.status) {
        case 'approved':
          approved.push(result.question)
          break
        case 'fixed':
          fixed.push(result.question)
          console.log(`[Reviewer] Fixed Q${i + 1}: ${result.fixes_applied?.join(', ')}`)
          break
        case 'rejected':
          rejected.push(result.question)
          console.log(`[Reviewer] Rejected Q${i + 1}: ${result.rejection_reason}`)
          break
      }
    } catch (error) {
      console.error(`[Reviewer] Failed to review Q${i + 1}:`, error)
      // If review fails, use basic validation
      const validation = validateQuestion(question)
      if (validation.passed) {
        approved.push({ ...question, quality_score: validation.score })
      } else {
        rejected.push(question)
      }
    }
  }

  const totalReviewed = questions.length
  const approvalRate = (approved.length + fixed.length) / totalReviewed
  const averageScore = totalReviewed > 0 ? totalScore / totalReviewed : 0

  console.log(`[Reviewer] Complete: ${approved.length} approved, ${fixed.length} fixed, ${rejected.length} rejected`)

  return {
    approved,
    fixed,
    rejected,
    totalReviewed,
    approvalRate,
    averageScore,
  }
}

// ============================================================================
// QUICK VALIDATION (NO AI)
// ============================================================================

/**
 * Quick validation without AI review (for fast processing)
 */
export function quickReview(questions: Question[]): BatchReviewResult {
  const approved: Question[] = []
  const fixed: Question[] = []
  const rejected: Question[] = []
  let totalScore = 0

  for (const question of questions) {
    const normalized = normalizeQuestion(question)
    const validation = validateQuestion(normalized)
    const score = calculateQualityScore(normalized)
    totalScore += score

    if (validation.passed && score >= CONFIG.REVIEW_THRESHOLD) {
      approved.push({ ...normalized, quality_score: score })
    } else if (score >= CONFIG.REJECT_THRESHOLD) {
      // Attempt basic fixes
      const fixed_q = applyBasicFixes(normalized)
      const newValidation = validateQuestion(fixed_q)
      
      if (newValidation.passed) {
        fixed.push({ ...fixed_q, quality_score: calculateQualityScore(fixed_q) })
      } else {
        rejected.push(normalized)
      }
    } else {
      rejected.push(normalized)
    }
  }

  const totalReviewed = questions.length
  const approvalRate = (approved.length + fixed.length) / totalReviewed
  const averageScore = totalReviewed > 0 ? totalScore / totalReviewed : 0

  return {
    approved,
    fixed,
    rejected,
    totalReviewed,
    approvalRate,
    averageScore,
  }
}

/**
 * Apply basic programmatic fixes to a question
 */
function applyBasicFixes(question: Question): Question {
  const fixed = { ...question }

  // Fix 1: Trim whitespace from all text fields
  fixed.question = (fixed.question || '').trim()
  fixed.rationale = (fixed.rationale || '').trim()
  fixed.options = (fixed.options || []).map(o => (o || '').trim())

  // Fix 2: Ensure question ends with question mark if it's a question
  if (fixed.question && !fixed.question.match(/[?.:!]$/)) {
    if (fixed.question.toLowerCase().startsWith('what') ||
        fixed.question.toLowerCase().startsWith('which') ||
        fixed.question.toLowerCase().startsWith('who') ||
        fixed.question.toLowerCase().startsWith('where') ||
        fixed.question.toLowerCase().startsWith('when') ||
        fixed.question.toLowerCase().startsWith('why') ||
        fixed.question.toLowerCase().startsWith('how')) {
      fixed.question += '?'
    }
  }

  // Fix 3: Capitalize first letter of options
  fixed.options = fixed.options.map(o => {
    if (o && o.length > 0) {
      return o.charAt(0).toUpperCase() + o.slice(1)
    }
    return o
  })

  // Fix 4: Set default difficulty if missing
  if (!fixed.difficulty) {
    fixed.difficulty = 'medium'
  }

  // Fix 5: Set default question type if missing
  if (!fixed.question_type) {
    fixed.question_type = 'single_correct'
  }

  return fixed
}

// ============================================================================
// DIVERSITY CHECK
// ============================================================================

/**
 * Check for duplicate or near-duplicate questions
 */
export function checkDuplicates(questions: Question[]): {
  unique: Question[]
  duplicates: Question[]
} {
  const unique: Question[] = []
  const duplicates: Question[] = []
  const seen = new Set<string>()

  for (const question of questions) {
    // Create a normalized key for comparison
    const key = normalizeForComparison(question.question || question.stem || '')
    
    if (seen.has(key)) {
      duplicates.push(question)
    } else {
      seen.add(key)
      unique.push(question)
    }
  }

  return { unique, duplicates }
}

/**
 * Normalize text for comparison (remove punctuation, lowercase, etc.)
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100) // First 100 chars for comparison
}

/**
 * Check topic diversity in a set of questions
 */
export function checkTopicDiversity(questions: Question[]): {
  topics: Record<string, number>
  isDiverse: boolean
  dominantTopic?: string
} {
  const topics: Record<string, number> = {}

  for (const question of questions) {
    const topic = question.topic || 'Unknown'
    topics[topic] = (topics[topic] || 0) + 1
  }

  // Check if any topic dominates (>50% of questions)
  const total = questions.length
  let dominantTopic: string | undefined
  let isDiverse = true

  for (const [topic, count] of Object.entries(topics)) {
    if (count > total * 0.5) {
      isDiverse = false
      dominantTopic = topic
      break
    }
  }

  return { topics, isDiverse, dominantTopic }
}