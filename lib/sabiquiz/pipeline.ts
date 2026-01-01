// lib/sabiquiz/pipeline.ts

import { supabase } from '@/lib/supabase'
import { chunkText, saveChunks, getChunks, getTotalTokens, type ChunkRecord } from './chunker'
import { buildContextProfile, getProfileSummary, type ContextProfile, type GenerationMode } from './context-profile'
import { extractObjectives, selectObjectivesForGeneration, type ExtractionResult } from './objective-extractor'
import { buildQuestionGenerationPrompt, buildSimpleGenerationPrompt } from './prompts'
import { generateContent, extractJSON } from './gemini-client'
import { validateQuestion, normalizeQuestion, calculateQualityScore, type Question } from './validators'
import { reviewQuestions, quickReview, checkDuplicates, checkTopicDiversity, type BatchReviewResult } from './reviewer'

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineConfig {
  questionCount: number
  difficultyMix: { easy: number; medium: number; hard: number }
  mode?: GenerationMode
  useAdvancedPipeline: boolean
  useAIReview: boolean
  maxRetries: number
}

export interface PipelineResult {
  success: boolean
  questions: Question[]
  stats: PipelineStats
  errors: string[]
}

export interface PipelineStats {
  pipeline: 'advanced' | 'simple'
  mode: string
  chunksCreated: number
  objectivesExtracted: number
  questionsGenerated: number
  questionsApproved: number
  questionsFixed: number
  questionsRejected: number
  averageQualityScore: number
  topicDiversity: boolean
  duplicatesRemoved: number
  totalTokensProcessed: number
  costEstimateUSD: number
  costEstimateNGN: number
  durationMs: number
}

export interface PipelineProgress {
  stage: 'init' | 'chunking' | 'objectives' | 'generating' | 'reviewing' | 'selecting' | 'complete' | 'error'
  message: string
  percent: number
}

export type ProgressCallback = (progress: PipelineProgress) => void

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PipelineConfig = {
  questionCount: 10,
  difficultyMix: { easy: 3, medium: 5, hard: 2 },
  useAdvancedPipeline: false, // Disabled by default to reduce API calls
  useAIReview: false,
  maxRetries: 2,
}

const COST_PER_1K_TOKENS = 0.0001 // Approximate Gemini cost
const USD_TO_NGN = 1600

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the complete question generation pipeline
 */
export async function runPipeline(
  materialText: string,
  materialId: string,
  category: string,
  level: string,
  config: Partial<PipelineConfig> = {},
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Initialize stats
  const stats: PipelineStats = {
    pipeline: 'simple',
    mode: 'school',
    chunksCreated: 0,
    objectivesExtracted: 0,
    questionsGenerated: 0,
    questionsApproved: 0,
    questionsFixed: 0,
    questionsRejected: 0,
    averageQualityScore: 0,
    topicDiversity: true,
    duplicatesRemoved: 0,
    totalTokensProcessed: 0,
    costEstimateUSD: 0,
    costEstimateNGN: 0,
    durationMs: 0,
  }

  try {
    // Report progress
    reportProgress(onProgress, 'init', 'Initializing pipeline...', 0)

    // Validate input
    if (!materialText || materialText.length < 100) {
      throw new Error('Material text too short. Need at least 100 characters.')
    }

    // Build context profile
    const profile = buildContextProfile({ category, level, mode: finalConfig.mode })
    stats.mode = profile.mode
    console.log(`[Pipeline] ${getProfileSummary(profile)}`)

    // Use simple pipeline by default (single API call)
    // Advanced pipeline is disabled to reduce API usage
    const useAdvanced = finalConfig.useAdvancedPipeline && materialText.length > 5000

    let questions: Question[]

    if (useAdvanced) {
      stats.pipeline = 'advanced'
      questions = await runAdvancedPipeline(
        materialText,
        materialId,
        profile,
        finalConfig,
        stats,
        onProgress
      )
    } else {
      stats.pipeline = 'simple'
      questions = await runSimplePipeline(
        materialText,
        profile,
        finalConfig,
        stats,
        onProgress
      )
    }

    // Review questions
    reportProgress(onProgress, 'reviewing', 'Reviewing question quality...', 70)
    
    let reviewResult: BatchReviewResult
    if (finalConfig.useAIReview) {
      const chunks = await getChunks(materialId).catch(() => [])
      reviewResult = await reviewQuestions(questions, profile, chunks)
    } else {
      reviewResult = quickReview(questions)
    }

    stats.questionsApproved = reviewResult.approved.length
    stats.questionsFixed = reviewResult.fixed.length
    stats.questionsRejected = reviewResult.rejected.length
    stats.averageQualityScore = reviewResult.averageScore

    // Combine approved and fixed questions
    let finalQuestions = [...reviewResult.approved, ...reviewResult.fixed]

    // Remove duplicates
    reportProgress(onProgress, 'selecting', 'Selecting best questions...', 85)
    
    const { unique, duplicates } = checkDuplicates(finalQuestions)
    stats.duplicatesRemoved = duplicates.length
    finalQuestions = unique

    // Check topic diversity
    const diversity = checkTopicDiversity(finalQuestions)
    stats.topicDiversity = diversity.isDiverse

    // Select final questions based on difficulty mix
    finalQuestions = selectFinalQuestions(
      finalQuestions,
      finalConfig.questionCount,
      finalConfig.difficultyMix
    )

    // Calculate costs
    stats.totalTokensProcessed = Math.ceil(materialText.length / 4) + (finalQuestions.length * 500)
    stats.costEstimateUSD = (stats.totalTokensProcessed / 1000) * COST_PER_1K_TOKENS
    stats.costEstimateNGN = stats.costEstimateUSD * USD_TO_NGN
    stats.durationMs = Date.now() - startTime

    reportProgress(onProgress, 'complete', 'Pipeline complete!', 100)

    console.log(`[Pipeline] Complete: ${finalQuestions.length} questions in ${stats.durationMs}ms`)

    return {
      success: finalQuestions.length > 0,
      questions: finalQuestions,
      stats,
      errors,
    }

  } catch (error: any) {
    console.error('[Pipeline] Error:', error)
    errors.push(error.message || 'Unknown error')
    stats.durationMs = Date.now() - startTime

    reportProgress(onProgress, 'error', error.message || 'Pipeline failed', 0)

    return {
      success: false,
      questions: [],
      stats,
      errors,
    }
  }
}

// ============================================================================
// ADVANCED PIPELINE
// ============================================================================

async function runAdvancedPipeline(
  text: string,
  materialId: string,
  profile: ContextProfile,
  config: PipelineConfig,
  stats: PipelineStats,
  onProgress?: ProgressCallback
): Promise<Question[]> {
  // Step 1: Chunk the material
  reportProgress(onProgress, 'chunking', 'Analyzing document structure...', 10)
  
  const chunks = chunkText(text)
  let savedChunks: ChunkRecord[]

  try {
    savedChunks = await saveChunks(materialId, chunks)
    stats.chunksCreated = savedChunks.length
  } catch (error) {
    console.error('[Pipeline] Failed to save chunks:', error)
    // Use in-memory chunks
    savedChunks = chunks.map((c, i) => ({
      id: `temp-${i}`,
      material_id: materialId,
      chunk_index: c.index,
      text: c.text,
      token_count: c.tokenCount,
      created_at: new Date().toISOString(),
    }))
    stats.chunksCreated = savedChunks.length
  }

  console.log(`[Pipeline] Created ${savedChunks.length} chunks`)

  // Step 2: Extract objectives
  reportProgress(onProgress, 'objectives', 'Extracting learning objectives...', 25)

  let extraction: ExtractionResult
  try {
    extraction = await extractObjectives(savedChunks, profile)
    stats.objectivesExtracted = extraction.learning_objectives.length
  } catch (error) {
    console.error('[Pipeline] Objective extraction failed:', error)
    // Fall back to simple pipeline
    return await runSimplePipeline(text, profile, config, stats, onProgress)
  }

  console.log(`[Pipeline] Extracted ${extraction.learning_objectives.length} objectives`)

  // If too few objectives, fall back
  if (extraction.learning_objectives.length < 3) {
    console.log('[Pipeline] Too few objectives, using simple pipeline')
    return await runSimplePipeline(text, profile, config, stats, onProgress)
  }

  // Step 3: Select objectives for generation
  const targetQuestions = Math.ceil(config.questionCount * 1.5) // Generate extra for filtering
  const selectedObjectives = selectObjectivesForGeneration(
    extraction.learning_objectives,
    targetQuestions,
    config.difficultyMix
  )

  // Step 4: Generate questions per objective
  reportProgress(onProgress, 'generating', 'Generating questions...', 40)

  const allQuestions: Question[] = []
  const totalObjectives = selectedObjectives.length

  for (let i = 0; i < selectedObjectives.length; i++) {
    const { objective, difficulty } = selectedObjectives[i]
    
    // Update progress
    const progressPercent = 40 + Math.floor((i / totalObjectives) * 30)
    reportProgress(
      onProgress, 
      'generating', 
      `Generating questions (${i + 1}/${totalObjectives})...`, 
      progressPercent
    )

    try {
      const prompt = buildQuestionGenerationPrompt(profile, objective, savedChunks, difficulty)
      
      const response = await generateContent(
        prompt.systemPrompt + '\n\n' + prompt.userPrompt,
        { temperature: 0.7 }
      )

      const questions = extractJSON<Question[]>(response)

      if (Array.isArray(questions)) {
        // Add metadata to questions
        const enrichedQuestions = questions.map(q => ({
          ...normalizeQuestion(q),
          source_chunk_ids: objective.supporting_chunk_ids,
          mode: profile.mode,
          quality_score: calculateQualityScore(q),
        }))

        allQuestions.push(...enrichedQuestions)
      }

      // Stop if we have enough
      if (allQuestions.length >= targetQuestions) {
        break
      }

    } catch (error) {
      console.error(`[Pipeline] Failed to generate for objective ${objective.id}:`, error)
    }
  }

  stats.questionsGenerated = allQuestions.length
  console.log(`[Pipeline] Generated ${allQuestions.length} questions`)

  return allQuestions
}

// ============================================================================
// SIMPLE PIPELINE
// ============================================================================

async function runSimplePipeline(
  text: string,
  profile: ContextProfile,
  config: PipelineConfig,
  stats: PipelineStats,
  onProgress?: ProgressCallback
): Promise<Question[]> {
  reportProgress(onProgress, 'generating', 'Generating questions...', 40)

  // Truncate text if too long
  const maxLength = 15000
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text

  const prompt = buildSimpleGenerationPrompt(
    profile,
    truncatedText,
    config.questionCount,
    config.difficultyMix
  )

  let lastError: Error | null = null

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await generateContent(
        prompt.systemPrompt + '\n\n' + prompt.userPrompt,
        { temperature: 0.7 }
      )

      const questions = extractJSON<Question[]>(response)

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions generated')
      }

      // Normalize and score questions
      const enrichedQuestions = questions.map(q => ({
        ...normalizeQuestion(q),
        mode: profile.mode,
        quality_score: calculateQualityScore(q),
      }))

      stats.questionsGenerated = enrichedQuestions.length
      console.log(`[Pipeline] Generated ${enrichedQuestions.length} questions (simple)`)

      return enrichedQuestions

    } catch (error: any) {
      lastError = error
      console.error(`[Pipeline] Simple generation attempt ${attempt + 1} failed:`, error.message)
    }
  }

  throw lastError || new Error('Failed to generate questions')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Report progress to callback
 */
function reportProgress(
  callback: ProgressCallback | undefined,
  stage: PipelineProgress['stage'],
  message: string,
  percent: number
): void {
  if (callback) {
    callback({ stage, message, percent })
  }
}

/**
 * Select final questions based on difficulty distribution
 */
function selectFinalQuestions(
  questions: Question[],
  targetCount: number,
  difficultyMix: { easy: number; medium: number; hard: number }
): Question[] {
  // Group by difficulty
  const byDifficulty: Record<string, Question[]> = {
    easy: [],
    medium: [],
    hard: [],
  }

  questions.forEach(q => {
    const diff = q.difficulty || 'medium'
    if (byDifficulty[diff]) {
      byDifficulty[diff].push(q)
    } else {
      byDifficulty['medium'].push(q)
    }
  })

  // Sort each group by quality score
  Object.values(byDifficulty).forEach(group => {
    group.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
  })

  // Select from each difficulty
  const selected: Question[] = []
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']

  difficulties.forEach(diff => {
    const needed = difficultyMix[diff]
    const available = byDifficulty[diff]
    selected.push(...available.slice(0, needed))
  })

  // If we don't have enough, fill from any difficulty
  if (selected.length < targetCount) {
    const remaining = questions
      .filter(q => !selected.includes(q))
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    
    selected.push(...remaining.slice(0, targetCount - selected.length))
  }

  return selected.slice(0, targetCount)
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save pipeline results to database
 */
export async function savePipelineResults(
  result: PipelineResult,
  materialId: string,
  userId: string,
  category: string,
  level: string
): Promise<void> {
  if (!result.success || result.questions.length === 0) {
    throw new Error('No questions to save')
  }

  // Prepare questions for insertion
  const questionsToInsert = result.questions.map(q => ({
    material_id: materialId,
    category,
    level,
    topic: q.topic || null,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    correct_answers: q.correct_answers || null,
    rationale: q.rationale || null,
    difficulty: q.difficulty || 'medium',
    quality_score: q.quality_score || null,
    question_type: q.question_type || 'single_correct',
    source_chunk_ids: q.source_chunk_ids || null,
    mode: q.mode || null,
    status: 'approved',
    created_by: userId,
  }))

  console.log(`[Pipeline] Saving ${questionsToInsert.length} questions...`)

  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .insert(questionsToInsert)
    .select()

  if (error) {
    console.error('[Pipeline] Database error:', error)
    throw new Error(`Failed to save questions: ${error.message}`)
  }

  console.log(`[Pipeline] Saved ${data?.length || 0} questions`)

  // Record generation run
  try {
    await supabase.from('generation_runs').insert({
      user_id: userId,
      material_id: materialId,
      model_used: 'gemini-2.0-flash-lite',
      cost_usd: result.stats.costEstimateUSD,
      questions_generated: result.stats.questionsGenerated,
      questions_approved: result.stats.questionsApproved + result.stats.questionsFixed,
      stats: result.stats,
    })
  } catch (error) {
    console.error('[Pipeline] Failed to record generation run:', error)
  }
}

/**
 * Run pipeline and save results in one call
 */
export async function generateAndSave(
  materialText: string,
  materialId: string,
  userId: string,
  category: string,
  level: string,
  config?: Partial<PipelineConfig>,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const result = await runPipeline(
    materialText,
    materialId,
    category,
    level,
    config,
    onProgress
  )

  if (result.success && result.questions.length > 0) {
    await savePipelineResults(result, materialId, userId, category, level)
  }

  return result
}