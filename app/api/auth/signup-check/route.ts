import { NextRequest } from 'next/server'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'
import { validateBody } from '@/lib/validations'
import { signupCheckSchema } from '@/lib/validations/auth-gating'
import { resolveSignupGate } from '@/lib/auth-gating'

/**
 * POST /api/auth/signup-check
 *
 * Returns a SignupGateDecision. Does NOT create an account.
 * Called by /auth/register on mount (and when ?invite= changes) to
 * decide which UI state to render.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const rl = rateLimit(`signup_check:${ip}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests')
        : ApiErrors.badRequest('Too many requests')
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateBody(signupCheckSchema, body)
    if (!validation.success) return validation.error

    const decision = await resolveSignupGate(validation.data.invite_token)
    return apiSuccess(decision)
  } catch (error) {
    console.error('POST /api/auth/signup-check error:', error)
    return ApiErrors.internal()
  }
}