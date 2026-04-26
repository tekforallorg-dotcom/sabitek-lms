import { createClient } from '@supabase/supabase-js'
import { isFlagEnabled } from '@/lib/feature-flags'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Check if an email is allowed to join an institution based on its domain allowlist.
 *
 * Returns { allowed: true } if:
 *   - The platform flag `domain_allowlist_enforced` is off, OR
 *   - The institution has no domains configured (empty/null allowlist), OR
 *   - The email domain matches one of the allowed domains
 *
 * Returns { allowed: false, reason: '...' } otherwise.
 */
export async function checkDomainAllowlist(
  institutionId: string,
  email: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check platform flag
  const enforced = await isFlagEnabled('domain_allowlist_enforced')
  if (!enforced) {
    return { allowed: true }
  }

  // Fetch institution's allowlist
  const { data: institution } = await supabaseAdmin
    .from('institutions')
    .select('email_domain_allowlist, name')
    .eq('id', institutionId)
    .maybeSingle()

  if (!institution) {
    return { allowed: true } // Institution not found — let other checks handle it
  }

  const allowlist = institution.email_domain_allowlist as string[] | null

  // No domains configured = no restriction
  if (!allowlist || allowlist.length === 0) {
    return { allowed: true }
  }

  // Extract domain from email
  const emailDomain = email.toLowerCase().split('@')[1]
  if (!emailDomain) {
    return { allowed: false, reason: 'Invalid email address' }
  }

  // Normalize allowlist entries (strip leading @ if present)
  const normalizedAllowlist = allowlist.map((d) =>
    d.toLowerCase().replace(/^@/, '').trim()
  )

  if (normalizedAllowlist.includes(emailDomain)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Your email domain (@${emailDomain}) is not in the allowed list for ${institution.name}. Contact the institution admin for access.`,
  }
}