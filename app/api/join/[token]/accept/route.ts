import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'
import { checkDomainAllowlist } from '@/lib/domain-check'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/join/[token]/accept
 *
 * AUTHENTICATED endpoint.
 *
 * Flow:
 *   1. Validate invite token (active, not expired, not exhausted)
 *   2. Check cohort is open for enrollment
 *   3. Check seat limit
 *   4. Create cohort_members row (or return existing if idempotent re-accept)
 *      - Status = 'active' for invite_only / public / access_code modes
 *      - Status = 'pending_approval' for approval_required mode
 *   5. Increment invite use_count (trigger auto-exhausts if limit hit)
 *   6. Write audit log
 *
 * Idempotency: if the user is already a member of this cohort, returns the
 * existing membership without creating a duplicate or incrementing use_count.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || typeof token !== 'string' || token.length < 16 || token.length > 64) {
      return ApiErrors.notFound('Invite not found')
    }

    // Auth
    const bearerToken = extractBearerToken(request.headers.get('authorization'))
    if (!bearerToken) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(bearerToken)
    if (authError || !user) return ApiErrors.unauthorized()

    // Rate limit accept attempts per user (not IP, to avoid shared-NAT issues)
    const rl = rateLimit(`invite_accept:${user.id}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests('Too many requests')
    }

    // ── 1. Fetch invite + cohort + related context ──
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('cohort_invites')
      .select(`
        id,
        cohort_id,
        status,
        expires_at,
        max_uses,
        use_count,
        cohort:cohorts!inner(
          id,
          name,
          enrollment_mode,
          seat_limit,
          status,
          default_sponsorship,
          program:programs!inner(id, name, institution_id)
        )
      `)
      .eq('token', token)
      .maybeSingle()

    if (inviteErr || !invite) {
      return ApiErrors.notFound('Invite not found')
    }

    const cohort = invite.cohort as any

    // ── 2. Validate invite is usable ──
    const now = new Date()

    if (invite.status !== 'ACTIVE') {
      return ApiErrors.badRequest(`This invite is ${invite.status.toLowerCase()}`)
    }
    if (invite.expires_at && new Date(invite.expires_at) < now) {
      return ApiErrors.badRequest('This invite has expired')
    }
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return ApiErrors.badRequest('This invite has reached its maximum uses')
    }

    // ── 3. Validate cohort is joinable ──
    if (cohort.status === 'closed' || cohort.status === 'archived') {
      return ApiErrors.badRequest('This cohort is no longer accepting members')
    }

    // ── 4. Idempotency check: already a member? ──
    const { data: existingMember } = await supabaseAdmin
      .from('cohort_members')
      .select('id, status, sponsorship, joined_at, applied_at, created_at')
      .eq('cohort_id', invite.cohort_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      // Already enrolled — return success without side effects
      return apiSuccess({
        already_member: true,
        membership: existingMember,
        cohort_id: invite.cohort_id,
        program_id: cohort.program.id,
        cohort_name: cohort.name,
        program_name: cohort.program.name,
      })
    }

    // ── 4b. Domain allowlist check ──
    const domainCheck = await checkDomainAllowlist(
      cohort.program.institution_id,
      user.email || ''
    )
    if (!domainCheck.allowed) {
      return ApiErrors.forbidden(domainCheck.reason || 'Your email domain is not allowed for this institution')
    }

    // ── 5. Seat limit check (only counts active + pending) ──
    if (cohort.seat_limit) {
      const { count: activeCount } = await supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact', head: true })
        .eq('cohort_id', invite.cohort_id)
        .in('status', ['active', 'pending_approval', 'invited'])

      if (activeCount !== null && activeCount >= cohort.seat_limit) {
        return ApiErrors.badRequest('This cohort is full')
      }
    }

    // ── 6. Determine member status based on cohort enrollment_mode ──
    let memberStatus: string
    let appliedAt: string | null = null
    let joinedAt: string | null = null

    if (cohort.enrollment_mode === 'approval_required') {
      memberStatus = 'pending_approval'
      appliedAt = now.toISOString()
    } else {
      memberStatus = 'active'
      joinedAt = now.toISOString()
    }

    // ── 7. Insert cohort_members row ──
    const { data: member, error: insertErr } = await supabaseAdmin
      .from('cohort_members')
      .insert({
        cohort_id: invite.cohort_id,
        user_id: user.id,
        status: memberStatus,
        sponsorship: cohort.default_sponsorship || 'institution_sponsored',
        invited_by: null, // self-joined via link, not invited by a specific person
        applied_at: appliedAt,
        joined_at: joinedAt,
      })
      .select()
      .single()

    if (insertErr) {
      // Unique constraint (user already in cohort) — race condition fallback to idempotent path
      if (insertErr.code === '23505') {
        const { data: racedMember } = await supabaseAdmin
          .from('cohort_members')
          .select('id, status, sponsorship, joined_at, applied_at')
          .eq('cohort_id', invite.cohort_id)
          .eq('user_id', user.id)
          .single()

        return apiSuccess({
          already_member: true,
          membership: racedMember,
          cohort_id: invite.cohort_id,
          program_id: cohort.program.id,
          cohort_name: cohort.name,
          program_name: cohort.program.name,
        })
      }
      console.error('Error inserting cohort_member:', insertErr)
      return ApiErrors.internal('Failed to join cohort')
    }

    // ── 8. Increment invite use_count (trigger auto-exhausts if limit hit) ──
    await supabaseAdmin
      .from('cohort_invites')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', invite.id)

    // ── 9. Audit log ──
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action:
        memberStatus === 'pending_approval'
          ? 'cohort_invite.accepted_pending'
          : 'cohort_invite.accepted',
      entity_type: 'cohort_member',
      entity_id: member.id,
      after: {
        cohort_id: invite.cohort_id,
        invite_id: invite.id,
        status: memberStatus,
        sponsorship: member.sponsorship,
      },
    })

    return apiSuccess(
      {
        already_member: false,
        membership: {
          id: member.id,
          status: member.status,
          sponsorship: member.sponsorship,
          joined_at: member.joined_at,
          applied_at: member.applied_at,
        },
        cohort_id: invite.cohort_id,
        program_id: cohort.program.id,
        cohort_name: cohort.name,
        program_name: cohort.program.name,
        requires_approval: memberStatus === 'pending_approval',
      },
      201
    )
  } catch (error) {
    console.error('Invite accept error:', error)
    return ApiErrors.internal()
  }
}