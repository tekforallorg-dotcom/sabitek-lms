import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiErrors } from '@/lib/api-response'

function extractBearer(header: string | null): string | null {
  if (!header) return null
  const m = header.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

/**
 * Shared guard for institution management APIs: caller must be an ACTIVE
 * member of the given institution holding one of `allowedRoles`.
 * Defaults to institution_admin or program_manager so existing callers
 * behave identically.
 */
export async function requireInstitutionAdmin(
  request: NextRequest,
  institutionId: string,
  allowedRoles: string[] = ['institution_admin', 'program_manager']
): Promise<{ error: ReturnType<typeof ApiErrors.unauthorized> } | { userId: string }> {
  const token = extractBearer(request.headers.get('authorization'))
  if (!token) return { error: ApiErrors.unauthorized() }

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token)
  if (!user) return { error: ApiErrors.unauthorized() }

  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role, status')
    .eq('institution_id', institutionId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: ApiErrors.forbidden('Only institution admins can do this') }
  }

  return { userId: user.id }
}
