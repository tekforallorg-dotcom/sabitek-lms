import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, validateQuery, extractBearerToken } from '@/lib/validations'
import { createInviteSchema, listInvitesQuerySchema } from '@/lib/validations/invite'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'
import { generateInviteToken } from '@/lib/crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Build the public join URL for a given token.
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise falls back to the request origin.
 */
function buildJoinUrl(token: string, request: NextRequest): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  return `${base.replace(/\/$/, '')}/join/${token}`
}

/**
 * Authorization check: does this user have the required role
 * at the institution that owns this cohort?
 */
interface CohortAuthResult {
  allowed: boolean
  reason?: string
  cohort?: { id: string; program_id: string; institution_id: string }
}

async function checkCohortAccess(
  userId: string,
  cohortId: string,
  requiredRoles: string[]
): Promise<CohortAuthResult> {
  // 1. Resolve cohort → program → institution
  const { data: cohort, error: cohortErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, program_id, programs!inner(institution_id)')
    .eq('id', cohortId)
    .single()

  if (cohortErr || !cohort) {
    return { allowed: false, reason: 'not_found' }
  }

  const institutionId = (cohort.programs as any).institution_id

  // 2. Platform admin bypass
  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()

  if (userProfile?.is_super_admin || userProfile?.platform_role) {
    return {
      allowed: true,
      cohort: { id: cohort.id, program_id: cohort.program_id, institution_id: institutionId },
    }
  }

  // 3. Institution member check with role gate
  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role, status')
    .eq('institution_id', institutionId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return { allowed: false, reason: 'not_member' }
  }

  if (!requiredRoles.includes(membership.role)) {
    return { allowed: false, reason: 'insufficient_role' }
  }

  return {
    allowed: true,
    cohort: { id: cohort.id, program_id: cohort.program_id, institution_id: institutionId },
  }
}

/**
 * Compute whether an invite is currently usable.
 * ACTIVE + not expired + under max_uses.
 */
function computeIsUsable(invite: {
  status: string
  expires_at: string | null
  max_uses: number | null
  use_count: number
}): boolean {
  if (invite.status !== 'ACTIVE') return false
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return false
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) return false
  return true
}

/**
 * GET /api/cohorts/[id]/invites
 * List invites for a cohort.
 * Authz: institution_admin, program_manager, or facilitator.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params

    // Validate query params
    const queryValidation = validateQuery(listInvitesQuerySchema, request.nextUrl.searchParams)
    if (!queryValidation.success) return queryValidation.error
    const { page, limit, status, type } = queryValidation.data

    // Auth
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Authz: read access for any institution staff
    const access = await checkCohortAccess(user.id, cohortId, [
      'institution_admin',
      'program_manager',
      'facilitator',
    ])
    if (!access.allowed) {
      if (access.reason === 'not_found') return ApiErrors.notFound('Cohort not found')
      return ApiErrors.forbidden('You do not have access to this cohort')
    }

    // Rate limit reads
    const rl = rateLimit(`invites_list:${user.id}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests — slow down')
        : ApiErrors.badRequest('Too many requests')
    }

    // Query
    const offset = (page - 1) * limit
    let query = supabaseAdmin
      .from('cohort_invites')
      .select('*, creator:users!created_by(id, full_name, email)', { count: 'exact' })
      .eq('cohort_id', cohortId)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: invites, error, count } = await query

    if (error) {
      console.error('Error fetching invites:', error)
      return ApiErrors.internal('Failed to fetch invites')
    }

    // Enrich each invite with join_url + is_usable
    const enriched = (invites || []).map((inv: any) => ({
      ...inv,
      join_url: buildJoinUrl(inv.token, request),
      is_usable: computeIsUsable(inv),
    }))

    return apiSuccess({
      invites: enriched,
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Invites GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/cohorts/[id]/invites
 * Create a new invite token for the cohort.
 * Authz: institution_admin or program_manager only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params

    // Auth
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Rate limit creates
    const rl = rateLimit(`invites_create:${user.id}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests — slow down')
        : ApiErrors.badRequest('Too many requests')
    }

    // Authz: create requires admin or manager (facilitator excluded)
    const access = await checkCohortAccess(user.id, cohortId, [
      'institution_admin',
      'program_manager',
    ])
    if (!access.allowed) {
      if (access.reason === 'not_found') return ApiErrors.notFound('Cohort not found')
      return ApiErrors.forbidden('Only institution admins and program managers can create invites')
    }

    // Validate body
    const body = await request.json()
    const validation = validateBody(createInviteSchema, body)
    if (!validation.success) return validation.error

    const input = validation.data

    // Generate unique token (retry on unlikely collision)
    let inviteToken = generateInviteToken()
    let collisionRetries = 0
    while (collisionRetries < 3) {
      const { data: existing } = await supabaseAdmin
        .from('cohort_invites')
        .select('id')
        .eq('token', inviteToken)
        .maybeSingle()
      if (!existing) break
      inviteToken = generateInviteToken()
      collisionRetries++
    }

    // Insert invite
    const { data: invite, error: insertError } = await supabaseAdmin
      .from('cohort_invites')
      .insert({
        cohort_id: cohortId,
        token: inviteToken,
        type: input.type,
        status: 'ACTIVE',
        expires_at: input.expires_at || null,
        max_uses: input.max_uses ?? null,
        use_count: 0,
        created_by: user.id,
        metadata: input.metadata || {},
      })
      .select('*, creator:users!created_by(id, full_name, email)')
      .single()

    if (insertError) {
      console.error('Error creating invite:', insertError)
      return ApiErrors.internal('Failed to create invite')
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'cohort_invite.created',
      entity_type: 'cohort_invite',
      entity_id: invite.id,
      after: {
        cohort_id: invite.cohort_id,
        type: invite.type,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
      },
    })

    const enriched = {
      ...invite,
      join_url: buildJoinUrl(invite.token, request),
      is_usable: true,
    }

    return apiSuccess(enriched, 201)
  } catch (error) {
    console.error('Invites POST error:', error)
    return ApiErrors.internal()
  }
}