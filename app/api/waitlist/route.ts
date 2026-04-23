import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/rate-limit'
import { validateBody } from '@/lib/validations'
import { waitlistSignupSchema } from '@/lib/validations/waitlist'
import { isFlagEnabled } from '@/lib/feature-flags'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/waitlist
 *
 * Captures a waitlist signup. No account created.
 * Deduplicated on email (unique index). Rate-limited by IP.
 * Returns success even on duplicate (no leaking whether email exists).
 */
export async function POST(request: NextRequest) {
  try {
    // Check if waitlist is enabled
    const enabled = await isFlagEnabled('waitlist_enabled')
    if (!enabled) {
      return ApiErrors.badRequest('Waitlist is not currently open.')
    }

    // Rate limit by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const rl = rateLimit(`waitlist:${ip}`, RATE_LIMIT_STRICT)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests. Please try again later.')
        : ApiErrors.badRequest('Too many requests. Please try again later.')
    }

    // Validate body
    const body = await request.json().catch(() => ({}))
    const validation = validateBody(waitlistSignupSchema, body)
    if (!validation.success) return validation.error

    const input = validation.data

    // Insert (ON CONFLICT DO NOTHING for dedup)
    const { error: insertError } = await supabaseAdmin
      .from('waitlist_signups')
      .insert({
        email: input.email.toLowerCase(),
        full_name: input.full_name || null,
        interest: input.interest || null,
        source: input.source || 'website',
      })

    // Unique constraint violation = duplicate email. Return success anyway
    // to avoid leaking whether the email is already on the list.
    if (insertError && insertError.code !== '23505') {
      console.error('Waitlist insert error:', insertError)
      return ApiErrors.internal('Something went wrong. Please try again.')
    }

    return apiSuccess({ joined: true })
  } catch (error) {
    console.error('POST /api/waitlist error:', error)
    return ApiErrors.internal()
  }
}