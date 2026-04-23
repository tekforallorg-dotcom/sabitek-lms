import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { createCohortSchema, cohortQuerySchema } from '@/lib/validations/program'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/cohorts
 * List cohorts (filtered by program_id or user's institutions)
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const query = cohortQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      enrollment_mode: searchParams.get('enrollment_mode'),
      search: searchParams.get('search'),
      program_id: searchParams.get('program_id'),
    })

    const { page, limit, status, enrollment_mode, search, program_id } = query
    const offset = (page - 1) * limit

    let cohortQuery = supabaseAdmin
      .from('cohorts')
      .select(`
        *,
        program:programs(id, name, slug, institution_id),
        cohort_members(count)
      `, { count: 'exact' })

    if (program_id) {
      // Verify user has access to this program's institution
      const { data: program } = await supabaseAdmin
        .from('programs')
        .select('institution_id')
        .eq('id', program_id)
        .single()

      if (!program) {
        return ApiErrors.notFound('Program not found')
      }

      const { data: membership } = await supabaseAdmin
        .from('institution_members')
        .select('role')
        .eq('institution_id', program.institution_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        return ApiErrors.forbidden('Not a member of this institution')
      }

      cohortQuery = cohortQuery.eq('program_id', program_id)
    } else {
      // Get cohorts from user's institutions
      const { data: memberships } = await supabaseAdmin
        .from('institution_members')
        .select('institution_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!memberships || memberships.length === 0) {
        return apiSuccess({ cohorts: [], total: 0, page, limit })
      }

      const institutionIds = memberships.map(m => m.institution_id)

      // Get programs from these institutions
      const { data: programs } = await supabaseAdmin
        .from('programs')
        .select('id')
        .in('institution_id', institutionIds)

      if (!programs || programs.length === 0) {
        return apiSuccess({ cohorts: [], total: 0, page, limit })
      }

      const programIds = programs.map(p => p.id)
      cohortQuery = cohortQuery.in('program_id', programIds)
    }

    if (status) {
      cohortQuery = cohortQuery.eq('status', status)
    }
    if (enrollment_mode) {
      cohortQuery = cohortQuery.eq('enrollment_mode', enrollment_mode)
    }
    if (search) {
      cohortQuery = cohortQuery.ilike('name', `%${search}%`)
    }

    const { data: cohorts, error, count } = await cohortQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching cohorts:', error)
      return ApiErrors.internal('Failed to fetch cohorts')
    }

    const cohortsWithStats = (cohorts || []).map(cohort => ({
      ...cohort,
      member_count: cohort.cohort_members?.[0]?.count || 0,
    }))

    return apiSuccess({
      cohorts: cohortsWithStats,
      total: count || 0,
      page,
      limit,
    })

  } catch (error) {
    console.error('Cohorts GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/cohorts
 * Create a new cohort
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    const body = await request.json()
    const validatedData = createCohortSchema.parse(body)

    // Verify program exists and user can manage it
    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('institution_id, status')
      .eq('id', validatedData.program_id)
      .single()

    if (!program) {
      return ApiErrors.notFound('Program not found')
    }

    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to create cohorts')
    }

    // Generate slug
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data: existingSlug } = await supabaseAdmin
      .from('cohorts')
      .select('slug')
      .eq('program_id', validatedData.program_id)
      .eq('slug', baseSlug)
      .single()

    const slug = existingSlug
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug

    // Create cohort
    const { data: cohort, error } = await supabaseAdmin
      .from('cohorts')
      .insert({
        ...validatedData,
        slug,
        created_by: user.id,
        status: 'draft',
      })
      .select(`
        *,
        program:programs(id, name, slug, institution_id)
      `)
      .single()

    if (error) {
      console.error('Error creating cohort:', error)
      return ApiErrors.internal('Failed to create cohort')
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'cohort.created',
      entity_type: 'cohort',
      entity_id: cohort.id,
      new_state: cohort,
    })

    return apiSuccess(cohort, 201)

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return ApiErrors.badRequest('Invalid input')
    }
    console.error('Cohorts POST error:', error)
    return ApiErrors.internal()
  }
}