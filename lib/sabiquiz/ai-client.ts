// lib/sabiquiz/ai-client.ts
import { createHash } from 'crypto'
import { AIError, generateText } from '@/lib/ai'

/**
 * Text generation for the quiz pipeline.
 *
 * Gemini answers first and DeepSeek takes over if Gemini cannot. Model ids,
 * retries, per-user limits and usage metering all live in lib/ai; this file
 * only adds a short-lived cache and the quiz-specific error wording.
 */

const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_SIZE = 50

interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  skipCache?: boolean
}

// In-memory and per server instance: it only saves a repeat call when the
// same prompt is sent twice within a few minutes.
const responseCache = new Map<string, { response: string; timestamp: number }>()

function cacheKey(prompt: string, options: GenerationOptions): string {
  return createHash('sha256')
    .update(`${options.temperature ?? ''}|${options.maxTokens ?? ''}|${prompt}`)
    .digest('hex')
}

function getCachedResponse(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }
  return entry.response
}

function cacheResponse(key: string, response: string): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldest = Array.from(responseCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) responseCache.delete(oldest[0])
  }
  responseCache.set(key, { response, timestamp: Date.now() })
}

/**
 * Generate text for a prompt. Flow: Gemini, then DeepSeek if Gemini fails.
 */
export async function generateContent(prompt: string, options: GenerationOptions = {}): Promise<string> {
  const key = cacheKey(prompt, options)
  if (!options.skipCache) {
    const cached = getCachedResponse(key)
    if (cached) return cached
  }

  const request = {
    prompt,
    maxTokens: options.maxTokens ?? 8192,
    temperature: options.temperature ?? 0.7,
  }

  let lastError: unknown = null

  for (const provider of ['gemini', 'deepseek'] as const) {
    try {
      // One try per provider: fail fast and move on to the next.
      const result = await generateText({ ...request, provider, attempts: 1 })
      cacheResponse(key, result.text)
      return result.text
    } catch (error) {
      lastError = error
      // Material that the safety filter rejects is not retried elsewhere.
      if (error instanceof AIError && error.kind === 'blocked') {
        throw new Error('Content was blocked by safety filters. Try different study material.')
      }
    }
  }

  console.error('[AI] All providers failed. Last error:', lastError instanceof Error ? lastError.message : lastError)

  if (lastError instanceof AIError && lastError.status === 429) {
    throw new Error('Our AI service is currently at capacity. Please try again in a few minutes.')
  }
  if (lastError instanceof AIError && (lastError.kind === 'not_configured' || lastError.status === 401 || lastError.status === 403)) {
    throw new Error('AI service configuration error. Please contact support.')
  }
  throw new Error('Unable to generate questions at this time. Please try again later or use a smaller document.')
}

/**
 * Extract JSON from AI response
 */
export function extractJSON<T>(response: string): T {
  try {
    let cleaned = response.trim()

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Try to find JSON object or array
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[AI] JSON parsing error:', error)
    console.error('[AI] Response preview:', response.substring(0, 500))
    throw new Error('Failed to process AI response. Please try again.')
  }
}
