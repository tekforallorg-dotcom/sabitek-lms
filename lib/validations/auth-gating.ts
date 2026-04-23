import { z } from 'zod'

/**
 * Input for POST /api/auth/signup-check.
 * Both fields optional: the endpoint returns a decision regardless
 * (used to answer "should I show the form, or the invite-required state?").
 */
export const signupCheckSchema = z.object({
  invite_token: z.string().trim().min(1).optional(),
})

export type SignupCheckInput = z.infer<typeof signupCheckSchema>

export type SignupGateDecision =
  | { allowed: true; reason: 'public_open' }
  | { allowed: true; reason: 'valid_invite'; invite: { cohort_name: string; institution_name: string; program_name: string | null } }
  | { allowed: false; reason: 'invite_required' }
  | { allowed: false; reason: 'invite_invalid' }
  | { allowed: false; reason: 'invite_expired' }
  | { allowed: false; reason: 'invite_revoked' }
  | { allowed: false; reason: 'invite_exhausted' }