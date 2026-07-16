import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

/** Page prefixes that require a signed-in user. */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/instructor',
  '/institution',
  '/admin',
  '/certificates',
  '/account',
  '/profile',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API routes: rate limiting only (they auth via Bearer tokens) ──
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

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toString())
    response.headers.set('x-middleware-cache', 'no-cache')

    return response
  }

  // ── Page routes: server-side auth guard (cookie-based sessions) ──
  // Sessions moved from localStorage to cookies (@supabase/ssr), so the
  // server can finally verify who is asking. Role-level checks remain in
  // the route-group layouts + RLS; middleware enforces auth presence and
  // keeps the session token fresh.
  // Course catalog and course detail pages are public (browse before you
  // sign up); only the lesson viewer inside a course requires auth.
  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    (pathname.startsWith('/courses') && pathname.includes('/lessons'))

  let response = NextResponse.next({ request })

  if (needsAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // getUser() validates against the auth server (do not trust getSession here).
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.search = ''
      return NextResponse.redirect(loginUrl)
    }
  }

  response.headers.set('x-middleware-cache', 'no-cache')
  return response
}

// Apply to all routes that need protection
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/institution/:path*',
    '/admin/:path*',
    '/courses/:path*',
    '/certificates/:path*',
    '/account/:path*',
    '/profile/:path*',
    '/api/:path*',
  ],
}
