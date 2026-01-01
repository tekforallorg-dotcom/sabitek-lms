// lib/sabiquiz/question-generator.ts

import { supabase } from '@/lib/supabase'
import { generateContent, extractJSON } from './gemini-client'
import { validateQuestions, type Question } from './validators'
import { chunkText, saveChunks, getChunks, type ChunkRecord } from './chunker'
import { buildContextProfile, type ContextProfile } from './context-profile'
import { 
  extractObjectives, 
  selectObjectivesForGeneration,
  type LearningObjective,
  type ExtractionResult 
} from './objective-extractor'
import { 
  buildQuestionGenerationPrompt, 
  buildSimpleGenerationPrompt 
} from './prompts'

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationResult {
  questions: Question[]
  totalGenerated: number
  passedValidation: number
  failedValidation: number
  overallQualityScore: number
  costEstimate: number
  pipeline: 'advanced' | 'simple'
  metadata?: {
    chunksCreated: number
    objectivesExtracted: number
    mode: string
  }
}

export interface GenerationOptions {
  questionCount?: number
  difficultyMix?: { easy: number; medium: number; hard: number }
  useAdvancedPipeline?: boolean
  mode?: 'school' | 'corporate' | 'certification'
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  DEFAULT_QUESTION_COUNT: 10,
  MIN_TEXT_LENGTH: 100,
  MAX_TEXT_LENGTH: 50000,
  SIMPLE_PIPELINE_THRESHOLD: 2000, // Use simple pipeline for short texts
  COST_PER_1K_TOKENS: 0.0001, // Approximate cost
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate questions from study material using multi-pass pipeline
 */
export async function generateQuestions(
  materialText: string,
  materialId: string,
  category: string,
  level: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const {
    questionCount = CONFIG.DEFAULT_QUESTION_COUNT,
    difficultyMix = { easy: 3, medium: 5, hard: 2 },
    useAdvancedPipeline = true,
    mode,
  } = options

  // Validate input
  if (!materialText || materialText.length < CONFIG.MIN_TEXT_LENGTH) {
    throw new Error('Material text too short. Need at least 100 characters.')
  }

  // Truncate if too long
  const truncatedText = materialText.length > CONFIG.MAX_TEXT_LENGTH
    ? materialText.substring(0, CONFIG.MAX_TEXT_LENGTH)
    : materialText

  // Build context profile
  const profile = buildContextProfile({
    category,
    level,
    mode,
  })

  console.log(`[Generator] Mode: ${profile.mode}, Domain: ${profile.domain}`)

  // Decide pipeline based on text length and options
  const useAdvanced = useAdvancedPipeline && truncatedText.length > CONFIG.SIMPLE_PIPELINE_THRESHOLD

  if (useAdvanced) {
    return await runAdvancedPipeline(
      truncatedText,
      materialId,
      profile,
      questionCount,
      difficultyMix
    )
  } else {
    return await runSimplePipeline(
      truncatedText,
      materialId,
      profile,
      questionCount,
      difficultyMix
    )
  }
}

// ============================================================================
// ADVANCED PIPELINE (Multi-pass)
// ============================================================================

/**
 * Run advanced multi-pass pipeline
 * 1. Chunk material
 * 2. Extract objectives
 * 3. Generate questions per objective
 * 4. Validate and score
 */
async function runAdvancedPipeline(
  text: string,
  materialId: string,
  profile: ContextProfile,
  questionCount: number,
  difficultyMix: { easy: number; medium: number; hard: number }
): Promise<GenerationResult> {
  console.log('[Generator] Running advanced pipeline...')

  // Step 1: Chunk the material
  console.log('[Generator] Step 1: Chunking material...')
  const chunks = chunkText(text)
  let savedChunks: ChunkRecord[] = []
  
  try {
    savedChunks = await saveChunks(materialId, chunks)
  } catch (error) {
    console.error('[Generator] Failed to save chunks, using in-memory:', error)
    // Create mock chunk records for in-memory processing
    savedChunks = chunks.map((c, i) => ({
      id: `temp-${i}`,
      material_id: materialId,
      chunk_index: c.index,
      text: c.text,
      token_count: c.tokenCount,
      created_at: new Date().toISOString(),
    }))
  }

  console.log(`[Generator] Created ${savedChunks.length} chunks`)

  // Step 2: Extract learning objectives
  console.log('[Generator] Step 2: Extracting objectives...')
  let extraction: ExtractionResult
  
  try {
    extraction = await extractObjectives(savedChunks, profile)
  } catch (error) {
    console.error('[Generator] Objective extraction failed, using simple pipeline:', error)
    return await runSimplePipeline(text, materialId, profile, questionCount, difficultyMix)
  }

  console.log(`[Generator] Extracted ${extraction.learning_objectives.length} objectives`)

  // If too few objectives, fall back to simple pipeline
  if (extraction.learning_objectives.length < 3) {
    console.log('[Generator] Too few objectives, falling back to simple pipeline')
    return await runSimplePipeline(text, materialId, profile, questionCount, difficultyMix)
  }

  // Step 3: Select objectives for generation
  const selectedObjectives = selectObjectivesForGeneration(
    extraction.learning_objectives,
    questionCount,
    difficultyMix
  )

  console.log(`[Generator] Selected ${selectedObjectives.length} objectives for generation`)

  // Step 4: Generate questions per objective
  console.log('[Generator] Step 3: Generating questions...')
  const allQuestions: Question[] = []
  
  // Group objectives to reduce API calls (2 questions per call)
  for (const { objective, difficulty } of selectedObjectives) {
    try {
      const questions = await generateQuestionsForObjective(
        objective,
        difficulty,
        savedChunks,
        profile
      )
      allQuestions.push(...questions)
      
      // Stop if we have enough
      if (allQuestions.length >= questionCount * 1.5) {
        break
      }
    } catch (error) {
      console.error(`[Generator] Failed to generate for objective ${objective.id}:`, error)
    }
  }

  console.log(`[Generator] Generated ${allQuestions.length} raw questions`)

  // Step 5: Validate and score
  console.log('[Generator] Step 4: Validating questions...')
  const validation = validateQuestions(allQuestions)

  // Select best questions up to requested count
  const finalQuestions = selectBestQuestions(allQuestions, questionCount, difficultyMix)

  // Estimate cost
  const tokensUsed = text.length / 4 + allQuestions.length * 500
  const costEstimate = (tokensUsed / 1000) * CONFIG.COST_PER_1K_TOKENS

  return {
    questions: finalQuestions,
    totalGenerated: allQuestions.length,
    passedValidation: validation.passedCount,
    failedValidation: validation.failedCount,
    overallQualityScore: validation.overallScore,
    costEstimate,
    pipeline: 'advanced',
    metadata: {
      chunksCreated: savedChunks.length,
      objectivesExtracted: extraction.learning_objectives.length,
      mode: profile.mode,
    },
  }
}

/**
 * Generate questions for a single objective
 */
async function generateQuestionsForObjective(
  objective: LearningObjective,
  difficulty: 'easy' | 'medium' | 'hard',
  chunks: ChunkRecord[],
  profile: ContextProfile
): Promise<Question[]> {
  const prompt = buildQuestionGenerationPrompt(profile, objective, chunks, difficulty)

  const response = await generateContent(
    prompt.systemPrompt + '\n\n' + prompt.userPrompt,
    { temperature: 0.7 }
  )

  try {
    const parsed = extractJSON<Question[]>(response)
    
    if (!Array.isArray(parsed)) {
      return []
    }

    // Add source chunk IDs to questions
    return parsed.map(q => ({
      ...q,
      source_chunk_ids: objective.supporting_chunk_ids,
    }))
  } catch (error) {
    console.error('[Generator] Failed to parse questions:', error)
    return []
  }
}

// ============================================================================
// SIMPLE PIPELINE (Single-pass, fallback)
// ============================================================================

/**
 * Run simple single-pass pipeline (for short texts or fallback)
 */
async function runSimplePipeline(
  text: string,
  materialId: string,
  profile: ContextProfile,
  questionCount: number,
  difficultyMix: { easy: number; medium: number; hard: number }
): Promise<GenerationResult> {
  console.log('[Generator] Running simple pipeline...')

  const prompt = buildSimpleGenerationPrompt(profile, text, questionCount, difficultyMix)

  const response = await generateContent(
    prompt.systemPrompt + '\n\n' + prompt.userPrompt,
    { temperature: 0.7 }
  )

  const parsed = extractJSON<Question[]>(response)

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No questions generated')
  }

  // Validate questions
  const validation = validateQuestions(parsed)

  // Estimate cost
  const tokensUsed = text.length / 4 + parsed.length * 500
  const costEstimate = (tokensUsed / 1000) * CONFIG.COST_PER_1K_TOKENS

  return {
    questions: parsed,
    totalGenerated: parsed.length,
    passedValidation: validation.passedCount,
    failedValidation: validation.failedCount,
    overallQualityScore: validation.overallScore,
    costEstimate,
    pipeline: 'simple',
  }
}

// ============================================================================
// QUESTION SELECTION
// ============================================================================

/**
 * Select best questions based on quality and difficulty distribution
 */
function selectBestQuestions(
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

  // Select from each difficulty
  const selected: Question[] = []

  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
  
  difficulties.forEach(diff => {
    const needed = difficultyMix[diff]
    const available = byDifficulty[diff]
    
    // Sort by quality_score if available
    available.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    
    selected.push(...available.slice(0, needed))
  })

  // If we don't have enough, fill from any difficulty
  if (selected.length < targetCount) {
    const remaining = questions.filter(q => !selected.includes(q))
    selected.push(...remaining.slice(0, targetCount - selected.length))
  }

  return selected.slice(0, targetCount)
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save generated questions to database
 */
export async function saveQuestions(
  questions: Question[],
  materialId: string,
  userId: string,
  category: string,
  level: string
): Promise<void> {
  const questionsToInsert = questions.map(q => ({
    material_id: materialId,
    category,
    level,
    topic: q.topic || null,
    question: q.question || q.stem, // Support both field names
    options: q.options,
    correct_answer: q.correct_answer,
    correct_answers: q.correct_answers || null, // For multi-select
    rationale: q.rationale || q.explanation || null,
    difficulty: q.difficulty || 'medium',
    quality_score: q.quality_score || null,
    question_type: q.question_type || 'single_correct',
    source_chunk_ids: q.source_chunk_ids || null,
    mode: q.mode || null,
    status: 'approved',
    created_by: userId,
  }))

  console.log(`[Generator] Saving ${questionsToInsert.length} questions...`)

  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .insert(questionsToInsert)
    .select()

  if (error) {
    console.error('[Generator] Database error:', error)
    throw new Error(`Failed to save questions: ${error.message}`)
  }

  console.log(`[Generator] Saved ${data?.length || 0} questions`)
}

/**
 * Generate and save questions in one call
 */
export async function generateAndSaveQuestions(
  materialText: string,
  materialId: string,
  userId: string,
  category: string,
  level: string,
  options?: GenerationOptions
): Promise<GenerationResult> {
  const result = await generateQuestions(
    materialText,
    materialId,
    category,
    level,
    options
  )

  await saveQuestions(result.questions, materialId, userId, category, level)

  return result
}

/**
 * Get questions for a material
 */
export async function getQuestionsForMaterial(materialId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Generator] Database error:', error)
    throw new Error('Failed to fetch questions')
  }

  return data || []
}

/**
 * Record a generation run for cost tracking
 */
export async function recordGenerationRun(
  userId: string,
  materialId: string,
  result: GenerationResult
): Promise<void> {
  try {
    await supabase.from('generation_runs').insert({
      user_id: userId,
      material_id: materialId,
      model_used: 'gemini-2.0-flash-lite',
      cost_usd: result.costEstimate,
      questions_generated: result.totalGenerated,
      questions_approved: result.passedValidation,
      stats: {
        pipeline: result.pipeline,
        quality_score: result.overallQualityScore,
        metadata: result.metadata,
      },
    })
  } catch (error) {
    console.error('[Generator] Failed to record run:', error)
    // Non-fatal, don't throw
  }
}