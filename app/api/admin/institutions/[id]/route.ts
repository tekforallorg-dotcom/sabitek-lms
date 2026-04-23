import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, platform_role')
    .eq('id', userId)
    .single()
  
  return data?.is_super_admin || !!data?.platform_role
}

/**
 * GET /api/admin/institutions/[id]
 * Get single institution with full details (platform admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authenticate
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // 2. Check platform admin
    if (!(await isPlatformAdmin(user.id))) {
      return ApiErrors.forbidden('Platform admin access required')
    }

    // 3. Fetch institution with relations
    const { data: institution, error } = await supabaseAdmin
      .from('institutions')
      .select(`
        *,
        creator:users!created_by(id, full_name, email, avatar_url),
        reviewer:users!reviewed_by(id, full_name, email),
        members:institution_members(
          id,
          role,
          status,
          created_at,
          user:users!user_id(id, full_name, email, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !institution) {
      return ApiErrors.notFound('Institution not found')
    }

    return apiSuccess(institution)

  } catch (error) {
    console.error('Admin institution GET error:', error)
    return ApiErrors.internal()
  }
}