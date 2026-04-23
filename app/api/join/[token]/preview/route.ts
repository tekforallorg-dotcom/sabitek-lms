import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_LENIENT } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/join/[token]/preview
 *
 * PUBLIC endpoint (no auth required).
 *
 * Returns a strictly field-filtered preview of an invite so unauthenticated
 * visitors can decide whether to sign up / sign in to accept.
 *
 * Exposes ONLY:
 *   - cohort name + dates + enrollment_mode
 *   - program name
 *   - institution name + logo + accent_color
 *   - invite usability (is_usable, expires_at, uses left)
 *
 * NEVER exposes:
 *   - member rosters
 *   - institution contact info, domain allowlist, or settings
 *   - other invites on this cohort
 *   - internal IDs beyond what's needed for the accept flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || typeof token !== 'string' || token.length < 16 || token.length > 64) {
      return ApiErrors.notFound('Invite not found')
    }

    // Rate limit by IP to prevent token enumeration
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const rl = rateLimit(`invite_preview:${ip}`, RATE_LIMIT_LENIENT)
    if (!rl.success) {
      return ApiErrors.tooManyRequests('Too many requests')
    }

    // Single query: invite → cohort → program → institution
    const { data: invite, error } = await supabaseAdmin
      .from('cohort_invites')
      .select(`
        id,
        token,
        type,
        status,
        expires_at,
        max_uses,
        use_count,
        cohort:cohorts!inner(
          id,
          name,
          slug,
          description,
          enrollment_mode,
          seat_limit,
          start_date,
          end_date,
          enrollment_start_date,
          enrollment_end_date,
          status,
          program:programs!inner(
            id,
            name,
            short_description,
            thumbnail_url,
            institution:institutions!inner(
              id,
              name,
              slug,
              logo_url,
              accent_color,
              type
            )
          )
        )
      `)
      .eq('token', token)
      .maybeSingle()

    if (error || !invite) {
      return ApiErrors.notFound('Invite not found')
    }

    // Compute usability without exposing reason structure
    const now = new Date()
    let usable = invite.status === 'ACTIVE'
    let reason: string | null = null

    if (invite.status === 'REVOKED') {
      usable = false
      reason = 'revoked'
    } else if (invite.status === 'EXPIRED') {
      usable = false
      reason = 'expired'
    } else if (invite.status === 'EXHAUSTED') {
      usable = false
      reason = 'exhausted'
    } else if (invite.expires_at && new Date(invite.expires_at) < now) {
      usable = false
      reason = 'expired'
    } else if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      usable = false
      reason = 'exhausted'
    }

    const cohort = invite.cohort as any
    const program = cohort.program
    const institution = program.institution

    // Also check cohort status — you can't join a closed/archived cohort
    if (cohort.status === 'closed' || cohort.status === 'archived') {
      usable = false
      reason = reason || 'cohort_closed'
    }

    // Build strictly-filtered response
    const preview = {
      invite: {
        type: invite.type,
        is_usable: usable,
        not_usable_reason: reason,
        expires_at: invite.expires_at,
        uses_left: invite.max_uses !== null ? Math.max(0, invite.max_uses - invite.use_count) : null,
      },
      cohort: {
        id: cohort.id,
        name: cohort.name,
        slug: cohort.slug,
        description: cohort.description,
        enrollment_mode: cohort.enrollment_mode,
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        enrollment_start_date: cohort.enrollment_start_date,
        enrollment_end_date: cohort.enrollment_end_date,
        status: cohort.status,
      },
      program: {
        id: program.id,
        name: program.name,
        short_description: program.short_description,
        thumbnail_url: program.thumbnail_url,
      },
      institution: {
        id: institution.id,
        name: institution.name,
        slug: institution.slug,
        logo_url: institution.logo_url,
        accent_color: institution.accent_color,
        type: institution.type,
      },
    }

    return apiSuccess(preview)
  } catch (error) {
    console.error('Invite preview error:', error)
    return ApiErrors.internal()
  }
}