import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Register a NEW account from a team invite, server-side.
 *
 * Possession of the invite token is the proof of email ownership (email-bound
 * invites were delivered to that inbox), so the account is created already
 * confirmed and the membership is attached in the same request. This removes
 * the confirmation-email round trip that previously stranded invited users as
 * plain learners with no institution membership.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: inviteToken } = await params
    const body = await request.json().catch(() => null)
    const fullName = (body?.full_name || '').trim()
    const password = body?.password || ''
    const emailInput = (body?.email || '').trim().toLowerCase()

    if (fullName.length < 2) return ApiErrors.badRequest('Please provide your full name')
    if (password.length < 8) return ApiErrors.badRequest('Password must be at least 8 characters')

    const { data: invite } = await supabaseAdmin
      .from('institution_invites')
      .select('*, institution:institutions(name)')
      .eq('token', inviteToken)
      .single()

    if (!invite) return ApiErrors.notFound('Invite not found')
    if (invite.status !== 'ACTIVE') return ApiErrors.conflict('This invite is no longer active')
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return ApiErrors.conflict('This invite has expired')
    }
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return ApiErrors.conflict('This invite has been fully used')
    }

    const email = (invite.email || emailInput).toLowerCase()
    if (!email) return ApiErrors.badRequest('Please provide your email address')
    if (invite.email && emailInput && invite.email.toLowerCase() !== emailInput) {
      return ApiErrors.badRequest('This invite was sent to a different email address')
    }

    // Existing account: they must sign in and accept instead (the accept
    // endpoint handles membership for authenticated users).
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingUser) {
      return ApiErrors.conflict(
        'An account with this email already exists. Sign in, then open the invite link to accept.'
      )
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createError || !created?.user) {
      console.error('Invite register createUser error:', createError)
      return ApiErrors.internal('Could not create the account. Please try again.')
    }
    const userId = created.user.id

    // The profile row may be created by trigger; make sure name/role are right.
    const platformRole = invite.role === 'instructor' ? 'instructor' : 'learner'
    await supabaseAdmin
      .from('users')
      .upsert(
        { id: userId, email, full_name: fullName, role: platformRole },
        { onConflict: 'id' }
      )

    const { data: member, error: memberError } = await supabaseAdmin
      .from('institution_members')
      .insert({
        institution_id: invite.institution_id,
        user_id: userId,
        role: invite.role,
        status: 'active',
        invited_by: invite.created_by,
        invited_at: invite.created_at,
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (memberError || !member) {
      console.error('Invite register member insert error:', memberError)
      return ApiErrors.internal('Account created but joining the team failed. Sign in and open the invite link again.')
    }

    const newUseCount = (invite.use_count || 0) + 1
    await supabaseAdmin
      .from('institution_invites')
      .update({
        use_count: newUseCount,
        ...(invite.max_uses !== null && newUseCount >= invite.max_uses
          ? { status: 'EXHAUSTED' }
          : {}),
      })
      .eq('id', invite.id)

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: userId,
      action: 'institution_invite.accepted',
      entity_type: 'institution_member',
      entity_id: member.id,
      after: { institution_id: invite.institution_id, role: invite.role, via: 'register' },
    })

    const institution = Array.isArray(invite.institution) ? invite.institution[0] : invite.institution

    return apiSuccess({
      email,
      role: invite.role,
      institution_name: institution?.name || 'Institution',
      next_route:
        invite.role === 'instructor'
          ? '/instructor'
          : invite.role === 'viewer'
          ? '/institution/reports'
          : '/institution/dashboard',
    })
  } catch (error) {
    console.error('Team invite register error:', error)
    return ApiErrors.internal()
  }
}
