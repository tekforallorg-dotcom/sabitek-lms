import { supabaseAdmin } from '@/lib/supabase-admin'
import type { AreaFacts } from '@/lib/route-access'

/**
 * Load the facts `decideAreaAccess` needs for one user. Uses the service-role
 * client because institution membership is not reliably readable under the
 * user's own row level security.
 *
 * Returns null when either lookup fails, so the caller can apply its
 * fail-open / fail-closed rule instead of guessing.
 */
export async function loadAreaFacts(userId: string): Promise<AreaFacts | null> {
  try {
    const [profileRes, membershipRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('role, is_super_admin')
        .eq('id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('institution_members')
        .select('role')
        .eq('user_id', userId)
        .eq('status', 'active'),
    ])

    if (profileRes.error || membershipRes.error) {
      console.error(
        'Route access lookup failed:',
        profileRes.error?.message || membershipRes.error?.message
      )
      return null
    }

    const profile = profileRes.data as { role: string | null; is_super_admin: boolean | null } | null

    return {
      isSuperAdmin: !!profile?.is_super_admin,
      role: profile?.role ?? null,
      membershipRoles: ((membershipRes.data || []) as { role: string }[]).map((m) => m.role),
    }
  } catch (error) {
    console.error('Route access lookup threw:', error)
    return null
  }
}
