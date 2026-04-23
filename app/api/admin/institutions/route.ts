import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateQuery, extractBearerToken } from '@/lib/validations'
import { institutionQuerySchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Check if user is a platform admin
 */
async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()
  
  return data?.is_super_admin || !!data?.platform_role
}

/**
 * GET /api/admin/institutions
 * List all institutions (platform admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // 2. Check platform admin
    if (!(await isPlatformAdmin(user.id))) {
      return ApiErrors.forbidden('Platform admin access required')
    }

    // 3. Validate query params
    const queryValidation = validateQuery(
      institutionQuerySchema,
      request.nextUrl.searchParams
    )
    if (!queryValidation.success) return queryValidation.error

    const { page, limit, status, type, search } = queryValidation.data
    const offset = (page - 1) * limit

    // 4. Build query
    let query = supabaseAdmin
      .from('institutions')
      .select(`
        *,
        creator:users!created_by(id, full_name, email),
        reviewer:users!reviewed_by(id, full_name, email),
        member_count:institution_members(count)
      `, { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) query = query.ilike('name', `%${search}%`)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: institutions, error, count } = await query

    if (error) {
      console.error('Error fetching institutions:', error)
      return ApiErrors.internal('Failed to fetch institutions')
    }

    // Transform member_count from array to number
    const transformed = (institutions || []).map(inst => ({
      ...inst,
      member_count: inst.member_count?.[0]?.count || 0,
    }))

    return apiSuccess({
      institutions: transformed,
      total: count || 0,
      page,
      limit,
    })

  } catch (error) {
    console.error('Admin institutions GET error:', error)
    return ApiErrors.internal()
  }
}