// lib/sabiquiz/chunker.ts

import { supabase } from '@/lib/supabase'

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Target chunk size in characters (roughly ~250 tokens)
  TARGET_CHUNK_SIZE: 1000,
  
  // Minimum chunk size (don't create tiny chunks)
  MIN_CHUNK_SIZE: 200,
  
  // Maximum chunk size (hard limit)
  MAX_CHUNK_SIZE: 1500,
  
  // Overlap between chunks for context continuity
  OVERLAP_SIZE: 100,
  
  // Sentence ending patterns
  SENTENCE_ENDINGS: /[.!?]\s+/g,
  
  // Paragraph break pattern
  PARAGRAPH_BREAK: /\n\s*\n/g,
}

// ============================================================================
// TYPES
// ============================================================================
export interface TextChunk {
  index: number
  text: string
  tokenCount: number
  startOffset: number
  endOffset: number
}

export interface ChunkRecord {
  id: string
  material_id: string
  chunk_index: number
  text: string
  token_count: number
  created_at: string
}

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

/**
 * Estimate token count from text (rough approximation)
 * Average: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ============================================================================
// TEXT CHUNKING
// ============================================================================

/**
 * Split text into semantic chunks
 * Preserves sentence boundaries and adds overlap for context
 */
export function chunkText(text: string): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const chunks: TextChunk[] = []
  const cleanedText = text.trim()
  
  // First, split by paragraphs
  const paragraphs = cleanedText.split(CONFIG.PARAGRAPH_BREAK).filter(p => p.trim())
  
  let currentChunk = ''
  let currentStartOffset = 0
  let textOffset = 0
  let chunkIndex = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim()
    
    // Skip empty paragraphs
    if (!paragraph) {
      continue
    }

    // If adding this paragraph exceeds max size, finalize current chunk
    if (currentChunk && (currentChunk.length + paragraph.length + 2) > CONFIG.MAX_CHUNK_SIZE) {
      // Save current chunk if it meets minimum size
      if (currentChunk.length >= CONFIG.MIN_CHUNK_SIZE) {
        chunks.push({
          index: chunkIndex++,
          text: currentChunk.trim(),
          tokenCount: estimateTokens(currentChunk),
          startOffset: currentStartOffset,
          endOffset: textOffset,
        })
        
        // Start new chunk with overlap from end of previous
        const overlapText = getOverlapText(currentChunk)
        currentChunk = overlapText + '\n\n' + paragraph
        currentStartOffset = textOffset - overlapText.length
      } else {
        // Chunk too small, keep building
        currentChunk += '\n\n' + paragraph
      }
    } else {
      // Add paragraph to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + paragraph
      } else {
        currentChunk = paragraph
        currentStartOffset = textOffset
      }
    }

    textOffset += paragraph.length + 2 // +2 for paragraph break

    // If current chunk is at target size and we're at a good break point
    if (currentChunk.length >= CONFIG.TARGET_CHUNK_SIZE) {
      // Try to break at sentence boundary
      const breakPoint = findSentenceBreak(currentChunk, CONFIG.TARGET_CHUNK_SIZE)
      
      if (breakPoint > CONFIG.MIN_CHUNK_SIZE) {
        const chunkText = currentChunk.substring(0, breakPoint).trim()
        const remainder = currentChunk.substring(breakPoint).trim()
        
        chunks.push({
          index: chunkIndex++,
          text: chunkText,
          tokenCount: estimateTokens(chunkText),
          startOffset: currentStartOffset,
          endOffset: currentStartOffset + breakPoint,
        })
        
        // Start new chunk with overlap
        const overlapText = getOverlapText(chunkText)
        currentChunk = overlapText + ' ' + remainder
        currentStartOffset = currentStartOffset + breakPoint - overlapText.length
      }
    }
  }

  // Add final chunk if it meets minimum size
  if (currentChunk && currentChunk.length >= CONFIG.MIN_CHUNK_SIZE) {
    chunks.push({
      index: chunkIndex++,
      text: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
      startOffset: currentStartOffset,
      endOffset: cleanedText.length,
    })
  } else if (currentChunk && chunks.length > 0) {
    // Append small remainder to last chunk
    const lastChunk = chunks[chunks.length - 1]
    lastChunk.text += '\n\n' + currentChunk.trim()
    lastChunk.tokenCount = estimateTokens(lastChunk.text)
    lastChunk.endOffset = cleanedText.length
  } else if (currentChunk) {
    // Only chunk, even if small
    chunks.push({
      index: 0,
      text: currentChunk.trim(),
      tokenCount: estimateTokens(currentChunk),
      startOffset: 0,
      endOffset: cleanedText.length,
    })
  }

  return chunks
}

/**
 * Find a good sentence break point near the target position
 */
function findSentenceBreak(text: string, targetPos: number): number {
  // Look for sentence endings near target position
  const searchStart = Math.max(0, targetPos - 200)
  const searchEnd = Math.min(text.length, targetPos + 200)
  const searchText = text.substring(searchStart, searchEnd)
  
  // Find all sentence endings in search range
  const endings: number[] = []
  const regex = /[.!?]\s+/g
  let match
  
  while ((match = regex.exec(searchText)) !== null) {
    endings.push(searchStart + match.index + match[0].length)
  }
  
  // Find the ending closest to target
  if (endings.length === 0) {
    return targetPos
  }
  
  let bestBreak = endings[0]
  let bestDistance = Math.abs(endings[0] - targetPos)
  
  for (const ending of endings) {
    const distance = Math.abs(ending - targetPos)
    if (distance < bestDistance) {
      bestDistance = distance
      bestBreak = ending
    }
  }
  
  return bestBreak
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string): string {
  if (text.length <= CONFIG.OVERLAP_SIZE) {
    return ''
  }
  
  // Try to start overlap at a word boundary
  const overlapStart = text.length - CONFIG.OVERLAP_SIZE
  const spaceIndex = text.indexOf(' ', overlapStart)
  
  if (spaceIndex !== -1 && spaceIndex < text.length - 50) {
    return text.substring(spaceIndex + 1)
  }
  
  return text.substring(overlapStart)
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save chunks to database for a material
 */
export async function saveChunks(materialId: string, chunks: TextChunk[]): Promise<ChunkRecord[]> {
  // First, delete any existing chunks for this material
  await supabase
    .from('material_chunks')
    .delete()
    .eq('material_id', materialId)

  if (chunks.length === 0) {
    return []
  }

  // Insert new chunks
  const records = chunks.map(chunk => ({
    material_id: materialId,
    chunk_index: chunk.index,
    text: chunk.text,
    token_count: chunk.tokenCount,
  }))

  const { data, error } = await supabase
    .from('material_chunks')
    .insert(records)
    .select()

  if (error) {
    console.error('[Chunker] Error saving chunks:', error)
    throw new Error(`Failed to save chunks: ${error.message}`)
  }

  console.log(`[Chunker] Saved ${data.length} chunks for material ${materialId}`)
  return data
}

/**
 * Get chunks for a material
 */
export async function getChunks(materialId: string): Promise<ChunkRecord[]> {
  const { data, error } = await supabase
    .from('material_chunks')
    .select('*')
    .eq('material_id', materialId)
    .order('chunk_index', { ascending: true })

  if (error) {
    console.error('[Chunker] Error fetching chunks:', error)
    throw new Error(`Failed to fetch chunks: ${error.message}`)
  }

  return data || []
}

/**
 * Chunk material text and save to database
 */
export async function chunkAndSaveMaterial(
  materialId: string, 
  text: string
): Promise<ChunkRecord[]> {
  console.log(`[Chunker] Processing material ${materialId}, text length: ${text.length}`)
  
  const chunks = chunkText(text)
  console.log(`[Chunker] Created ${chunks.length} chunks`)
  
  const savedChunks = await saveChunks(materialId, chunks)
  return savedChunks
}

/**
 * Get total token count for a material's chunks
 */
export function getTotalTokens(chunks: TextChunk[] | ChunkRecord[]): number {
  return chunks.reduce((sum, chunk) => {
    if ('tokenCount' in chunk) {
      return sum + chunk.tokenCount
    }
    if ('token_count' in chunk) {
      return sum + (chunk.token_count || 0)
    }
    return sum
  }, 0)
}