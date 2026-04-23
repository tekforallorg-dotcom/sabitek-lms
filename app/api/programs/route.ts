import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { createProgramSchema, programQuerySchema } from '@/lib/validations/program'
import { ZodError } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/programs
 * List programs for an institution
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const query = programQuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      search: searchParams.get('search') || undefined,
      institution_id: searchParams.get('institution_id') || undefined,
    })

    const { page, limit, status, visibility, search, institution_id } = query
    const offset = (page - 1) * limit

    // Build query
    let programQuery = supabaseAdmin
      .from('programs')
      .select(`
        *,
        institution:institutions(id, name, slug, logo_url),
        cohorts:cohorts(count)
      `, { count: 'exact' })

    // Filter by institution if provided
    if (institution_id) {
      // Verify user is member of this institution
      const { data: membership } = await supabaseAdmin
        .from('institution_members')
        .select('role')
        .eq('institution_id', institution_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        return ApiErrors.forbidden('Not a member of this institution')
      }

      programQuery = programQuery.eq('institution_id', institution_id)
    } else {
      // Get user's institutions
      const { data: memberships } = await supabaseAdmin
        .from('institution_members')
        .select('institution_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!memberships || memberships.length === 0) {
        return apiSuccess({
          programs: [],
          total: 0,
          page,
          limit,
        })
      }

      const institutionIds = memberships.map(m => m.institution_id)
      programQuery = programQuery.in('institution_id', institutionIds)
    }

    // Apply filters
    if (status) {
      programQuery = programQuery.eq('status', status)
    }
    if (visibility) {
      programQuery = programQuery.eq('visibility', visibility)
    }
    if (search) {
      programQuery = programQuery.ilike('name', `%${search}%`)
    }

    // Execute query
    const { data: programs, error, count } = await programQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching programs:', error)
      return ApiErrors.internal('Failed to fetch programs')
    }

    // Transform to include stats
    const programsWithStats = (programs || []).map(program => ({
      ...program,
      cohort_count: program.cohorts?.[0]?.count || 0,
      institution: program.institution,
    }))

    return apiSuccess({
      programs: programsWithStats,
      total: count || 0,
      page,
      limit,
    })

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Zod validation error:', error.errors)
      return ApiErrors.badRequest('Invalid input: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Programs GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/programs
 * Create a new program
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
    const validatedData = createProgramSchema.parse(body)

    // Verify user can create programs in this institution
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', validatedData.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to create programs in this institution')
    }

    // Generate slug
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for slug uniqueness within institution
    const { data: existingSlug } = await supabaseAdmin
      .from('programs')
      .select('slug')
      .eq('institution_id', validatedData.institution_id)
      .eq('slug', baseSlug)
      .single()

    const slug = existingSlug 
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug

    // Create program
    const { data: program, error } = await supabaseAdmin
      .from('programs')
      .insert({
        ...validatedData,
        slug,
        created_by: user.id,
        status: 'draft',
      })
      .select(`
        *,
        institution:institutions(id, name, slug, logo_url)
      `)
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return ApiErrors.internal('Failed to create program')
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'program.created',
      entity_type: 'program',
      entity_id: program.id,
      new_state: program,
    })

    return apiSuccess(program, 201)

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Zod validation error:', error.errors)
      return ApiErrors.badRequest('Invalid input: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Programs POST error:', error)
    return ApiErrors.internal()
  }
}