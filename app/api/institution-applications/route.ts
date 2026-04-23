import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/rate-limit'
import { validateBody } from '@/lib/validations'
import { institutionApplicationSchema } from '@/lib/validations/institution-application'
import { isFlagEnabled } from '@/lib/feature-flags'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/institution-applications
 *
 * Submit an institution workspace request. No auth required.
 * Deduplicates on email (unique index on pending applications).
 * Rate limited by IP. Flag-gated by institution_apps_enabled.
 */
export async function POST(request: NextRequest) {
  try {
    const enabled = await isFlagEnabled('institution_apps_enabled')
    if (!enabled) {
      return ApiErrors.badRequest('Institution applications are not currently open.')
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const rl = rateLimit(`inst_app:${ip}`, RATE_LIMIT_STRICT)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests. Please try again later.')
        : ApiErrors.badRequest('Too many requests. Please try again later.')
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateBody(institutionApplicationSchema, body)
    if (!validation.success) return validation.error

    const input = validation.data

    const { data: application, error: insertError } = await supabaseAdmin
      .from('institution_applications')
      .insert({
        full_name: input.full_name,
        email: input.email.toLowerCase(),
        organisation_name: input.organisation_name,
        role_title: input.role_title || null,
        country: input.country || null,
        org_type: input.org_type,
        learner_count: input.learner_count || null,
        description: input.description,
        status: 'pending',
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      // Unique constraint on pending email = already applied
      if (insertError.code === '23505') {
        return apiSuccess({
          submitted: true,
          already_pending: true,
          message: 'You already have a pending application. We will be in touch soon.',
        })
      }
      console.error('Institution application insert error:', insertError)
      return ApiErrors.internal('Something went wrong. Please try again.')
    }

    // Audit log (non-blocking)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: null,
        action: 'institution_application.submitted',
        entity_type: 'institution_application',
        entity_id: application.id,
        after: {
          email: input.email.toLowerCase(),
          organisation_name: input.organisation_name,
          org_type: input.org_type,
        },
      })
    } catch {}

    return apiSuccess({
      submitted: true,
      already_pending: false,
      message: 'Your application has been received. We will review it and get back to you soon.',
    }, 201)
  } catch (error) {
    console.error('POST /api/institution-applications error:', error)
    return ApiErrors.internal()
  }
}

/**
 * GET /api/institution-applications
 *
 * List applications. Requires super admin auth.
 */
export async function GET(request: NextRequest) {
  try {
    const { extractBearerToken } = await import('@/lib/validations')
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Check super admin
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('is_super_admin, platform_role')
      .eq('id', user.id)
      .maybeSingle()

    const profileRow = profile as { is_super_admin: boolean; platform_role: string | null } | null
    if (!profileRow?.is_super_admin && !profileRow?.platform_role) {
      return ApiErrors.forbidden('Only platform admins can view applications.')
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('institution_applications')
      .select('*', { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return ApiErrors.internal('Failed to fetch applications.')
    }

    return apiSuccess({
      applications: applications || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/institution-applications error:', error)
    return ApiErrors.internal()
  }
}