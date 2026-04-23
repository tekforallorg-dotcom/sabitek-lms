import { NextRequest } from 'next/server'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_LENIENT } from '@/lib/rate-limit'
import { getPublicFlags } from '@/lib/feature-flags'

/**
 * GET /api/platform/flags
 *
 * Returns ONLY flags that have is_public = true in platform_settings.
 * With the current Model-A seed, all flags are is_public = false, so this
 * endpoint returns {} — that's the expected state. We still ship the endpoint
 * now because later slices (waitlist CTA, homepage provider gating) will want
 * to toggle a flag to is_public = true and read it from the client without
 * further route work.
 *
 * NOT authenticated — but rate limited and scoped to public-safe flags only.
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP (coarse — sufficient for a low-value public endpoint).
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const rl = rateLimit(`platform_flags:${ip}`, RATE_LIMIT_LENIENT)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests')
        : ApiErrors.badRequest('Too many requests')
    }

    const flags = await getPublicFlags()
    return apiSuccess({ flags })
  } catch (error) {
    console.error('GET /api/platform/flags error:', error)
    return ApiErrors.internal()
  }
}