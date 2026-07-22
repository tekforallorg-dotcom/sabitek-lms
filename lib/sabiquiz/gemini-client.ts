// lib/sabiquiz/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Retry settings
  MAX_RETRIES: 1,  // Fail fast, move to next provider
  
  // Rate limiting (per user/session) - GENEROUS LIMITS
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_TOKENS_PER_DAY: 500000,
  
  // Cache settings
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50,
  
  // Primary model
  GEMINI_MODEL: 'gemini-2.5-flash-lite',
}

// ============================================================================
// API KEYS
// ============================================================================
// Server-only names: NEXT_PUBLIC_* variants are banned here because Next.js
// exposes them to the browser (the July 2026 Gemini key abuse came from that).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

// ============================================================================
// TYPES
// ============================================================================
interface RateLimitState {
  requests: number[]
  tokensUsed: number
  lastReset: number
}

interface CacheEntry {
  response: string
  timestamp: number
  promptHash: string
}

interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  skipCache?: boolean
  userId?: string
}

// ============================================================================
// STATE (In-memory - use Redis for production multi-instance)
// ============================================================================
const rateLimitState: Map<string, RateLimitState> = new Map()
const responseCache: Map<string, CacheEntry> = new Map()

// ============================================================================
// INITIALIZATION
// ============================================================================
let genAI: GoogleGenerativeAI | null = null

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in environment variables')
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  }
  return genAI
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check and update rate limit for a user
 */
function checkRateLimit(userId: string = 'default'): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const oneDayAgo = now - 86400000
  
  let state = rateLimitState.get(userId)
  
  if (!state || state.lastReset < oneDayAgo) {
    // Reset daily counters
    state = {
      requests: [],
      tokensUsed: 0,
      lastReset: now
    }
    rateLimitState.set(userId, state)
  }
  
  // Clean old requests
  state.requests = state.requests.filter(t => t > oneMinuteAgo)
  
  // Check requests per minute
  if (state.requests.length >= CONFIG.MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = state.requests[0]
    const retryAfterMs = oldestRequest + 60000 - now
    return { allowed: false, retryAfterMs }
  }
  
  // Check daily token limit
  if (state.tokensUsed >= CONFIG.MAX_TOKENS_PER_DAY) {
    return { allowed: false, retryAfterMs: state.lastReset + 86400000 - now }
  }
  
  return { allowed: true }
}

/**
 * Record a request for rate limiting
 */
function recordRequest(userId: string = 'default', tokensUsed: number = 0): void {
  const state = rateLimitState.get(userId)
  if (state) {
    state.requests.push(Date.now())
    state.tokensUsed += tokensUsed
  }
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Generate a simple hash for cache key
 */
function hashPrompt(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

/**
 * Get cached response if valid
 */
function getCachedResponse(prompt: string): string | null {
  const hash = hashPrompt(prompt)
  const entry = responseCache.get(hash)
  
  if (!entry) return null
  
  // Check if expired
  if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL_MS) {
    responseCache.delete(hash)
    return null
  }
  
  console.log('[AI] Cache hit')
  return entry.response
}

/**
 * Store response in cache
 */
function cacheResponse(prompt: string, response: string): void {
  const hash = hashPrompt(prompt)
  
  // Evict oldest entries if cache is full
  if (responseCache.size >= CONFIG.MAX_CACHE_SIZE) {
    const oldest = Array.from(responseCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
    if (oldest) {
      responseCache.delete(oldest[0])
    }
  }
  
  responseCache.set(hash, {
    response,
    timestamp: Date.now(),
    promptHash: hash
  })
}

// ============================================================================
// GEMINI API
// ============================================================================

/**
 * Call Gemini API
 */
async function callGemini(
  prompt: string, 
  options: GenerationOptions = {}
): Promise<string> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: CONFIG.GEMINI_MODEL })
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: options.maxTokens ?? 8192,
    },
  })
  
  const response = await result.response
  return response.text()
}

// ============================================================================
// DEEPSEEK FALLBACK
// ============================================================================

/**
 * Call DeepSeek API as fallback
 */
async function callDeepSeek(
  prompt: string,
  options: GenerationOptions = {}
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured')
  }
  
  console.log('[AI] Calling DeepSeek API...')
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8192,
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || response.statusText)
  }
  
  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate content with automatic fallback to DeepSeek
 * Flow: Gemini -> DeepSeek (if Gemini fails)
 */
export async function generateContent(
  prompt: string, 
  options: GenerationOptions = {}
): Promise<string> {
  const userId = options.userId || 'default'
  
  // Check rate limit
  const rateLimitCheck = checkRateLimit(userId)
  if (!rateLimitCheck.allowed) {
    const waitMinutes = Math.ceil((rateLimitCheck.retryAfterMs || 60000) / 60000)
    throw new Error(
      `You've made too many requests. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} and try again.`
    )
  }
  
  // Check cache
  if (!options.skipCache) {
    const cached = getCachedResponse(prompt)
    if (cached) {
      return cached
    }
  }
  
  let lastError: Error | null = null
  
  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      console.log('[AI] Trying Gemini...')
      const response = await callGemini(prompt, options)
      
      // Success - record and cache
      recordRequest(userId, prompt.length + response.length)
      cacheResponse(prompt, response)
      
      console.log('[AI] Gemini success')
      return response
      
    } catch (error: any) {
      lastError = error
      const errorMessage = error.message || String(error)
      console.error('[AI] Gemini failed:', errorMessage)
      
      // Check for content blocked - don't fallback
      if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
        throw new Error('Content was blocked by safety filters. Try different study material.')
      }
    }
  }
  
  // Fallback to DeepSeek
  if (DEEPSEEK_API_KEY) {
    try {
      console.log('[AI] Falling back to DeepSeek...')
      const response = await callDeepSeek(prompt, options)
      
      // Success - record and cache
      recordRequest(userId, prompt.length + response.length)
      cacheResponse(prompt, response)
      
      console.log('[AI] DeepSeek success')
      return response
      
    } catch (error: any) {
      lastError = error
      console.error('[AI] DeepSeek failed:', error.message || String(error))
    }
  }
  
  // All providers failed - show user-friendly message
  console.error('[AI] All providers failed. Last error:', lastError?.message)
  
  // Determine user-friendly message based on error type
  const errorMsg = lastError?.message || ''
  
  if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('429')) {
    throw new Error(
      'Our AI service is currently at capacity. Please try again in a few minutes.'
    )
  }
  
  if (errorMsg.includes('API key') || errorMsg.includes('API_KEY') || errorMsg.includes('unauthorized')) {
    throw new Error(
      'AI service configuration error. Please contact support.'
    )
  }
  
  throw new Error(
    'Unable to generate questions at this time. Please try again later or use a smaller document.'
  )
}

// ============================================================================
// UTILITIES
// ============================================================================

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

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ 
  success: boolean
  provider?: string
  error?: string 
}> {
  try {
    await generateContent('Say "test" in one word.', {
      skipCache: true,
      maxTokens: 10
    })
    
    return { 
      success: true,
      provider: GEMINI_API_KEY ? 'Gemini' : 'DeepSeek'
    }
  } catch (error: any) {
    console.error('[AI] Connection test failed:', error)
    return { 
      success: false, 
      error: error.message || 'Connection failed' 
    }
  }
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string = 'default'): {
  requestsRemaining: number
  tokensRemaining: number
  resetInMs: number
} {
  const state = rateLimitState.get(userId)
  const now = Date.now()
  
  if (!state) {
    return {
      requestsRemaining: CONFIG.MAX_REQUESTS_PER_MINUTE,
      tokensRemaining: CONFIG.MAX_TOKENS_PER_DAY,
      resetInMs: 0
    }
  }
  
  const recentRequests = state.requests.filter(t => t > now - 60000).length
  
  return {
    requestsRemaining: Math.max(0, CONFIG.MAX_REQUESTS_PER_MINUTE - recentRequests),
    tokensRemaining: Math.max(0, CONFIG.MAX_TOKENS_PER_DAY - state.tokensUsed),
    resetInMs: Math.max(0, state.lastReset + 86400000 - now)
  }
}

/**
 * Clear cache (for admin use)
 */
export function clearCache(): void {
  responseCache.clear()
  console.log('[AI] Cache cleared')
}

/**
 * Reset rate limit state (for testing/debugging)
 */
export function resetRateLimits(): void {
  rateLimitState.clear()
  console.log('[AI] Rate limits reset')
}

/**
 * Check if any AI provider is configured
 */
export function isAIConfigured(): boolean {
  return !!(GEMINI_API_KEY || DEEPSEEK_API_KEY)
}