import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/institutions/my-membership
 * Get the current user's institution membership
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

    // Find user's active memberships with institution details
    // Use .limit(1) instead of .single() to handle multiple memberships
    const { data: memberships, error } = await supabaseAdmin
      .from('institution_members')
      .select(`
        id,
        role,
        status,
        institution_id,
        institution:institutions(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching membership:', error)
      return ApiErrors.internal('Failed to fetch membership')
    }

    if (!memberships || memberships.length === 0) {
      return ApiErrors.notFound('No institution membership found')
    }

    const membership = memberships[0]

    return apiSuccess({
      ...membership,
      institution: membership.institution,
    })

  } catch (error) {
    console.error('My membership GET error:', error)
    return ApiErrors.internal()
  }
}