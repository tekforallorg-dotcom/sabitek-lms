/**
 * Simple in-memory rate limiter
 * 
 * Limitations:
 * - Resets on deploy/restart
 * - Not shared across serverless instances
 * - Good enough for MVP, migrate to Upstash for production scale
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store: Map<identifier, RateLimitEntry>
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup()
  
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier
  
  const entry = store.get(key)
  
  // No existing entry or window expired - create new
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, newEntry)
    
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    }
  }
  
  // Within window - increment count
  entry.count++
  
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }
  
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

/** Strict: 10 requests per minute (billing, payments) */
export const RATE_LIMIT_STRICT: RateLimitConfig = {
  limit: 10,
  windowSeconds: 60,
}

/** Standard: 30 requests per minute (general API) */
export const RATE_LIMIT_STANDARD: RateLimitConfig = {
  limit: 30,
  windowSeconds: 60,
}

/** AI: 20 requests per minute (expensive operations) */
export const RATE_LIMIT_AI: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
}

/** Auth: 5 requests per minute (prevent brute force) */
export const RATE_LIMIT_AUTH: RateLimitConfig = {
  limit: 5,
  windowSeconds: 60,
}

/** Lenient: 60 requests per minute (read-only endpoints) */
export const RATE_LIMIT_LENIENT: RateLimitConfig = {
  limit: 60,
  windowSeconds: 60,
}