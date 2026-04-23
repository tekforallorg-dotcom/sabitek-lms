import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  rateLimit,
  RATE_LIMIT_STRICT,
  RATE_LIMIT_AI,
  RATE_LIMIT_AUTH,
  RATE_LIMIT_STANDARD,
  type RateLimitConfig,
} from '@/lib/rate-limit'

/**
 * Get client identifier for rate limiting
 * Uses IP address, falls back to a generic key
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous'
  return ip
}

/**
 * Determine rate limit config based on path
 */
function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  // Strict: Payment/billing endpoints
  if (
    pathname.startsWith('/api/billing') ||
    pathname.startsWith('/api/wallet') ||
    pathname.startsWith('/api/sabiwrite/billing')
  ) {
    return RATE_LIMIT_STRICT
  }

  // Auth: Authentication endpoints
  if (pathname.startsWith('/api/auth')) {
    return RATE_LIMIT_AUTH
  }

  // AI: Expensive AI operations
  if (
    pathname.startsWith('/api/sabibot') ||
    pathname.startsWith('/api/sabiquiz/generate') ||
    pathname.startsWith('/api/sabiadvisor/recommend') ||
    pathname.startsWith('/api/advisor') ||
    pathname.startsWith('/api/ai')
  ) {
    return RATE_LIMIT_AI
  }

  // Standard: Other API routes
  if (pathname.startsWith('/api/')) {
    return RATE_LIMIT_STANDARD
  }

  // No rate limiting for non-API routes
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only rate limit API routes
  const rateLimitConfig = getRateLimitConfig(pathname)

  if (rateLimitConfig) {
    const identifier = getClientIdentifier(request)
    const key = `${identifier}:${pathname.split('/').slice(0, 4).join('/')}`
    
    const result = rateLimit(key, rateLimitConfig)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toString(),
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toString())
    response.headers.set('x-middleware-cache', 'no-cache')
    
    return response
  }

  // Non-API routes - just pass through
  const response = NextResponse.next()
  response.headers.set('x-middleware-cache', 'no-cache')
  return response
}

// Apply to all routes that need protection
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/courses/:path*',
    '/api/:path*',
  ],
}