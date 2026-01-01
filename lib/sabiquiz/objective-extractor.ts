// lib/sabiquiz/objective-extractor.ts

import { generateContent, extractJSON } from './gemini-client'
import { buildObjectiveExtractionPrompt } from './prompts'
import { buildContextProfile, type ContextProfile } from './context-profile'
import type { ChunkRecord } from './chunker'

// ============================================================================
// TYPES
// ============================================================================

export interface LearningObjective {
  id: string
  objective: string
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  supporting_chunk_ids: string[]
  key_concepts: string[]
}

export interface KeyTerm {
  term: string
  definition: string
  chunk_id: string
}

export interface TopicMap {
  [topic: string]: string[] // topic name -> chunk IDs
}

export interface ExtractionResult {
  learning_objectives: LearningObjective[]
  key_terms: KeyTerm[]
  topic_map: TopicMap
  extraction_metadata: {
    total_objectives: number
    total_terms: number
    total_topics: number
    chunks_processed: number
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  MIN_OBJECTIVES: 5,
  MAX_OBJECTIVES: 25,
  MIN_TERMS: 10,
  MAX_TERMS: 60,
  MAX_CHUNKS_PER_CALL: 10, // Limit chunks to avoid context overflow
  MAX_RETRIES: 2,
}

// ============================================================================
// OBJECTIVE EXTRACTION
// ============================================================================

/**
 * Extract learning objectives from material chunks
 */
export async function extractObjectives(
  chunks: ChunkRecord[],
  profile: ContextProfile
): Promise<ExtractionResult> {
  console.log(`[Objectives] Extracting from ${chunks.length} chunks`)

  // If too many chunks, batch them
  if (chunks.length > CONFIG.MAX_CHUNKS_PER_CALL) {
    return await extractObjectivesBatched(chunks, profile)
  }

  const prompt = buildObjectiveExtractionPrompt(profile, chunks)
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await generateContent(
        prompt.userPrompt,
        { temperature: 0.3 } // Lower temperature for more consistent extraction
      )

      const result = extractJSON<ExtractionResult>(response)
      
      // Validate the extraction
      const validated = validateExtraction(result, chunks)
      
      console.log(`[Objectives] Extracted ${validated.learning_objectives.length} objectives, ${validated.key_terms.length} terms`)
      
      return validated

    } catch (error: any) {
      lastError = error
      console.error(`[Objectives] Attempt ${attempt + 1} failed:`, error.message)
    }
  }

  // If all retries failed, return minimal result
  console.error('[Objectives] All extraction attempts failed, using fallback')
  return createFallbackExtraction(chunks, profile)
}

/**
 * Extract objectives in batches for large documents
 */
async function extractObjectivesBatched(
  chunks: ChunkRecord[],
  profile: ContextProfile
): Promise<ExtractionResult> {
  console.log(`[Objectives] Batching ${chunks.length} chunks`)

  const batchSize = CONFIG.MAX_CHUNKS_PER_CALL
  const batches: ChunkRecord[][] = []
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize))
  }

  const allObjectives: LearningObjective[] = []
  const allTerms: KeyTerm[] = []
  const mergedTopicMap: TopicMap = {}

  for (let i = 0; i < batches.length; i++) {
    console.log(`[Objectives] Processing batch ${i + 1}/${batches.length}`)
    
    try {
      const batchResult = await extractObjectives(batches[i], profile)
      
      // Merge objectives (with unique IDs)
      batchResult.learning_objectives.forEach((obj, idx) => {
        allObjectives.push({
          ...obj,
          id: `OBJ_${allObjectives.length + 1}`,
        })
      })
      
      // Merge terms (dedupe by term name)
      batchResult.key_terms.forEach(term => {
        if (!allTerms.some(t => t.term.toLowerCase() === term.term.toLowerCase())) {
          allTerms.push(term)
        }
      })
      
      // Merge topic map
      for (const [topic, chunkIds] of Object.entries(batchResult.topic_map)) {
        if (!mergedTopicMap[topic]) {
          mergedTopicMap[topic] = []
        }
        mergedTopicMap[topic].push(...chunkIds)
      }
      
    } catch (error) {
      console.error(`[Objectives] Batch ${i + 1} failed:`, error)
    }
  }

  // Deduplicate and limit objectives
  const uniqueObjectives = deduplicateObjectives(allObjectives)
  const limitedObjectives = uniqueObjectives.slice(0, CONFIG.MAX_OBJECTIVES)
  const limitedTerms = allTerms.slice(0, CONFIG.MAX_TERMS)

  return {
    learning_objectives: limitedObjectives,
    key_terms: limitedTerms,
    topic_map: mergedTopicMap,
    extraction_metadata: {
      total_objectives: limitedObjectives.length,
      total_terms: limitedTerms.length,
      total_topics: Object.keys(mergedTopicMap).length,
      chunks_processed: chunks.length,
    },
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate and clean extraction result
 */
function validateExtraction(
  result: any,
  chunks: ChunkRecord[]
): ExtractionResult {
  const chunkIds = new Set(chunks.map(c => c.id))
  
  // Validate objectives
  const validObjectives: LearningObjective[] = []
  
  if (Array.isArray(result.learning_objectives)) {
    result.learning_objectives.forEach((obj: any, index: number) => {
      if (obj.objective && typeof obj.objective === 'string') {
        // Filter to valid chunk IDs only
        const validChunkIds = (obj.supporting_chunk_ids || [])
          .filter((id: string) => chunkIds.has(id))
        
        // If no valid chunks, assign to first chunk
        const finalChunkIds = validChunkIds.length > 0 
          ? validChunkIds 
          : [chunks[0]?.id].filter(Boolean)

        validObjectives.push({
          id: obj.id || `OBJ_${index + 1}`,
          objective: obj.objective.trim(),
          bloom_level: validateBloomLevel(obj.bloom_level),
          supporting_chunk_ids: finalChunkIds,
          key_concepts: Array.isArray(obj.key_concepts) 
            ? obj.key_concepts.filter((c: any) => typeof c === 'string')
            : [],
        })
      }
    })
  }

  // Validate terms
  const validTerms: KeyTerm[] = []
  
  if (Array.isArray(result.key_terms)) {
    result.key_terms.forEach((term: any) => {
      if (term.term && typeof term.term === 'string') {
        validTerms.push({
          term: term.term.trim(),
          definition: (term.definition || '').trim(),
          chunk_id: chunkIds.has(term.chunk_id) ? term.chunk_id : chunks[0]?.id || '',
        })
      }
    })
  }

  // Validate topic map
  const validTopicMap: TopicMap = {}
  
  if (result.topic_map && typeof result.topic_map === 'object') {
    for (const [topic, ids] of Object.entries(result.topic_map)) {
      if (Array.isArray(ids)) {
        const validIds = (ids as string[]).filter(id => chunkIds.has(id))
        if (validIds.length > 0) {
          validTopicMap[topic] = validIds
        }
      }
    }
  }

  return {
    learning_objectives: validObjectives,
    key_terms: validTerms,
    topic_map: validTopicMap,
    extraction_metadata: {
      total_objectives: validObjectives.length,
      total_terms: validTerms.length,
      total_topics: Object.keys(validTopicMap).length,
      chunks_processed: chunks.length,
    },
  }
}

/**
 * Validate Bloom's taxonomy level
 */
function validateBloomLevel(level: any): LearningObjective['bloom_level'] {
  const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
  if (typeof level === 'string' && validLevels.includes(level.toLowerCase())) {
    return level.toLowerCase() as LearningObjective['bloom_level']
  }
  return 'understand' // Default
}

/**
 * Deduplicate objectives by similarity
 */
function deduplicateObjectives(objectives: LearningObjective[]): LearningObjective[] {
  const unique: LearningObjective[] = []
  
  for (const obj of objectives) {
    const isDuplicate = unique.some(existing => {
      // Simple similarity check - could use embeddings for better deduplication
      const existingWords = new Set(existing.objective.toLowerCase().split(/\s+/))
      const newWords = obj.objective.toLowerCase().split(/\s+/)
      const overlap = newWords.filter(w => existingWords.has(w)).length
      const similarity = overlap / Math.max(existingWords.size, newWords.length)
      return similarity > 0.7 // 70% word overlap = duplicate
    })
    
    if (!isDuplicate) {
      unique.push(obj)
    }
  }
  
  return unique
}

// ============================================================================
// FALLBACK
// ============================================================================

/**
 * Create fallback extraction when AI fails
 */
function createFallbackExtraction(
  chunks: ChunkRecord[],
  profile: ContextProfile
): ExtractionResult {
  // Create basic objectives from chunk content
  const objectives: LearningObjective[] = chunks.slice(0, 10).map((chunk, index) => {
    // Extract first sentence as a rough objective
    const firstSentence = chunk.text.split(/[.!?]/)[0]?.trim() || 'Understand key concepts'
    
    return {
      id: `OBJ_${index + 1}`,
      objective: `Understand: ${firstSentence.substring(0, 100)}...`,
      bloom_level: 'understand' as const,
      supporting_chunk_ids: [chunk.id],
      key_concepts: extractKeywords(chunk.text).slice(0, 3),
    }
  })

  return {
    learning_objectives: objectives,
    key_terms: [],
    topic_map: {},
    extraction_metadata: {
      total_objectives: objectives.length,
      total_terms: 0,
      total_topics: 0,
      chunks_processed: chunks.length,
    },
  }
}

/**
 * Simple keyword extraction (fallback)
 */
function extractKeywords(text: string): string[] {
  // Extract capitalized phrases and repeated words
  const words = text.split(/\s+/)
  const wordCounts = new Map<string, number>()
  
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '')
    if (clean.length > 4) {
      wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1)
    }
  })
  
  // Return most frequent words
  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

// ============================================================================
// OBJECTIVE SELECTION
// ============================================================================

/**
 * Select objectives for question generation based on difficulty distribution
 */
export function selectObjectivesForGeneration(
  objectives: LearningObjective[],
  questionCount: number,
  difficultyMix: { easy: number; medium: number; hard: number }
): { objective: LearningObjective; difficulty: 'easy' | 'medium' | 'hard' }[] {
  const selected: { objective: LearningObjective; difficulty: 'easy' | 'medium' | 'hard' }[] = []
  
  // Map Bloom levels to difficulty
  const bloomToDifficulty: Record<string, 'easy' | 'medium' | 'hard'> = {
    remember: 'easy',
    understand: 'easy',
    apply: 'medium',
    analyze: 'medium',
    evaluate: 'hard',
    create: 'hard',
  }

  // Group objectives by suggested difficulty
  const byDifficulty: Record<string, LearningObjective[]> = {
    easy: [],
    medium: [],
    hard: [],
  }

  objectives.forEach(obj => {
    const diff = bloomToDifficulty[obj.bloom_level] || 'medium'
    byDifficulty[diff].push(obj)
  })

  // Select objectives for each difficulty
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
  
  difficulties.forEach(diff => {
    const needed = difficultyMix[diff]
    const available = byDifficulty[diff]
    
    // If not enough objectives for this difficulty, borrow from others
    let pool = [...available]
    if (pool.length < needed) {
      const others = objectives.filter(o => !pool.includes(o))
      pool = [...pool, ...others]
    }
    
    // Select objectives (round-robin if needed)
    for (let i = 0; i < needed && pool.length > 0; i++) {
      const idx = i % pool.length
      selected.push({
        objective: pool[idx],
        difficulty: diff,
      })
    }
  })

  return selected.slice(0, questionCount)
}