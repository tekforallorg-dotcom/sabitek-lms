/**
 * Server-side auth gating helper for Model A.
 *
 * Given an optional invite token, decides whether a visitor is allowed to
 * create an account via /auth/register. Consumed by /api/auth/signup-check
 * and anywhere else we need the same decision.
 *
 * Key principle: fail CLOSED. If we cannot verify, we block and show the
 * "invite required" state. Never throws.
 */

import { createClient } from '@supabase/supabase-js'
import { isFlagEnabled } from '@/lib/feature-flags'
import type { SignupGateDecision } from '@/lib/validations/auth-gating'

let _admin: ReturnType<typeof createClient> | null = null
function getAdmin() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}

/**
 * Resolve signup eligibility.
 *
 * Flow:
 *   1. If public_signup_enabled flag is true, allow unconditionally.
 *   2. Otherwise, require an invite_token.
 *   3. Validate the invite (ACTIVE, not expired, not exhausted).
 *   4. Enrich the allowed decision with cohort/program/institution names
 *      so the client can personalize the register form header.
 */
export async function resolveSignupGate(
  inviteToken?: string | null
): Promise<SignupGateDecision> {
  const publicOpen = await isFlagEnabled('public_signup_enabled')
  if (publicOpen) {
    return { allowed: true, reason: 'public_open' }
  }

  if (!inviteToken) {
    return { allowed: false, reason: 'invite_required' }
  }

  const admin = getAdmin()
  if (!admin) {
    return { allowed: false, reason: 'invite_invalid' }
  }

  try {
    const { data, error } = await admin
      .from('cohort_invites')
      .select(
        'id, status, expires_at, max_uses, use_count, cohort:cohorts!inner(name, program:programs!inner(name, institution:institutions!inner(name)))'
      )
      .eq('token', inviteToken)
      .maybeSingle()

    if (error || !data) {
      // Not a cohort invite: it may be an institution TEAM invite
      // (created from /institution dashboard for admins/instructors/etc).
      return resolveTeamInvite(admin, inviteToken)
    }

    const row = data as {
      status: string
      expires_at: string | null
      max_uses: number | null
      use_count: number
      cohort: {
        name: string
        program: { name: string; institution: { name: string } }
      }
    }

    if (row.status === 'REVOKED') {
      return { allowed: false, reason: 'invite_revoked' }
    }
    if (row.status === 'EXHAUSTED') {
      return { allowed: false, reason: 'invite_exhausted' }
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { allowed: false, reason: 'invite_expired' }
    }
    if (row.max_uses !== null && row.use_count >= row.max_uses) {
      return { allowed: false, reason: 'invite_exhausted' }
    }
    if (row.status !== 'ACTIVE') {
      return { allowed: false, reason: 'invite_invalid' }
    }

    return {
      allowed: true,
      reason: 'valid_invite',
      invite: {
        cohort_name: row.cohort.name,
        institution_name: row.cohort.program.institution.name,
        program_name: row.cohort.program.name,
      },
    }
  } catch {
    return { allowed: false, reason: 'invite_invalid' }
  }
}

const TEAM_ROLE_LABELS: Record<string, string> = {
  institution_admin: 'Institution Admin',
  program_manager: 'Program Manager',
  facilitator: 'Facilitator',
  instructor: 'Instructor',
  viewer: 'Viewer',
}

/**
 * Institution TEAM invite branch. Reuses the same decision shape so the
 * register page needs no changes: cohort_name carries the team label.
 * After registering, the invitee accepts via /join/team/[token], which
 * assigns the institution_members role (and instructor upgrade).
 */
async function resolveTeamInvite(
  admin: NonNullable<ReturnType<typeof getAdmin>>,
  inviteToken: string
): Promise<SignupGateDecision> {
  try {
    const { data, error } = await admin
      .from('institution_invites')
      .select('status, expires_at, max_uses, use_count, role, institution:institutions!inner(name)')
      .eq('token', inviteToken)
      .maybeSingle()

    if (error || !data) {
      return { allowed: false, reason: 'invite_invalid' }
    }

    const row = data as {
      status: string
      expires_at: string | null
      max_uses: number | null
      use_count: number
      role: string
      institution: { name: string }
    }

    if (row.status === 'REVOKED') {
      return { allowed: false, reason: 'invite_revoked' }
    }
    if (row.status === 'EXHAUSTED') {
      return { allowed: false, reason: 'invite_exhausted' }
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { allowed: false, reason: 'invite_expired' }
    }
    if (row.max_uses !== null && row.use_count >= row.max_uses) {
      return { allowed: false, reason: 'invite_exhausted' }
    }
    if (row.status !== 'ACTIVE') {
      return { allowed: false, reason: 'invite_invalid' }
    }

    return {
      allowed: true,
      reason: 'valid_invite',
      invite: {
        cohort_name: `${row.institution.name} team`,
        institution_name: row.institution.name,
        program_name: TEAM_ROLE_LABELS[row.role] || row.role,
      },
    }
  } catch {
    return { allowed: false, reason: 'invite_invalid' }
  }
}