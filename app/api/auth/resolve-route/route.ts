import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { extractBearerToken } from '@/lib/validations'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/auth/resolve-route
 *
 * Returns the correct post-login redirect path AND display role
 * for the authenticated user. Uses service role to bypass RLS.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Check institution membership (bypasses RLS via service role)
    const { data: institutionMembership } = await supabaseAdmin
      .from('institution_members')
      .select('role, institution:institutions!inner(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['institution_admin', 'program_manager', 'facilitator'])
      .limit(1)
      .maybeSingle()

    if (institutionMembership) {
      const row = institutionMembership as unknown as {
        role: string
        institution: { name: string }[] | { name: string }
      }
      const inst = Array.isArray(row.institution) ? row.institution[0] : row.institution
      const roleLabels: Record<string, string> = {
        institution_admin: 'Institution Admin',
        program_manager: 'Program Manager',
        facilitator: 'Facilitator',
      }
      return apiSuccess({
        route: ['institution_admin', 'program_manager'].includes(row.role)
          ? '/institution/dashboard'
          : '/dashboard',
        display_role: roleLabels[row.role] || row.role,
        institution_name: inst?.name || null,
      })
    }

    // Check user profile role
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const profileRow = profile as { role: string } | null

    if (profileRow?.role === 'instructor') {
      return apiSuccess({ route: '/instructor', display_role: 'Instructor', institution_name: null })
    }

    return apiSuccess({ route: '/dashboard', display_role: profileRow?.role || 'Learner', institution_name: null })
  } catch (error) {
    console.error('GET /api/auth/resolve-route error:', error)
    return apiSuccess({ route: '/dashboard', display_role: 'Learner', institution_name: null })
  }
}