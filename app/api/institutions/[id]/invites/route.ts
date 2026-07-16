import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { createInstitutionInviteSchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { sendInstitutionInviteEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.app'

const ROLE_LABELS: Record<string, string> = {
  institution_admin: 'Institution Admin',
  program_manager: 'Program Manager',
  facilitator: 'Facilitator',
  instructor: 'Instructor',
  viewer: 'Viewer (read-only)',
}

/** Require the caller to be an active institution_admin of this institution. */
async function requireInstitutionAdmin(request: NextRequest, institutionId: string) {
  const token = extractBearerToken(request.headers.get('authorization'))
  if (!token) return { error: ApiErrors.unauthorized() }

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return { error: ApiErrors.unauthorized() }

  const { data: membership } = await supabaseAdmin
    .from('institution_members')
    .select('role, status')
    .eq('institution_id', institutionId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (membership?.role !== 'institution_admin') {
    return { error: ApiErrors.forbidden('Only institution admins can manage invites') }
  }

  return { user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params
    const auth = await requireInstitutionAdmin(request, institutionId)
    if ('error' in auth) return auth.error

    const { data: invites, error } = await supabaseAdmin
      .from('institution_invites')
      .select('id, role, email, token, status, expires_at, max_uses, use_count, created_at')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return ApiErrors.internal('Failed to fetch invites')
    }

    return apiSuccess({
      invites: (invites || []).map((i) => ({
        ...i,
        invite_url: `${APP_URL}/join/team/${i.token}`,
      })),
    })
  } catch (error) {
    console.error('Invites GET error:', error)
    return ApiErrors.internal()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params
    const auth = await requireInstitutionAdmin(request, institutionId)
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const validation = validateBody(createInstitutionInviteSchema, body)
    if (!validation.success) return validation.error

    const { role, email, expires_in_days, max_uses } = validation.data

    const { data: institution } = await supabaseAdmin
      .from('institutions')
      .select('name')
      .eq('id', institutionId)
      .single()

    if (!institution) return ApiErrors.notFound('Institution not found')

    const token = randomBytes(24).toString('base64url')
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: invite, error: insertError } = await supabaseAdmin
      .from('institution_invites')
      .insert({
        institution_id: institutionId,
        role,
        email: email || null,
        token,
        expires_at: expiresAt,
        // Emailed personal invites default to single-use; bare links stay multi-use.
        max_uses: max_uses ?? (email ? 1 : null),
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating invite:', insertError)
      return ApiErrors.internal('Failed to create invite')
    }

    const inviteUrl = `${APP_URL}/join/team/${token}`

    // Fire-and-forget email when an address was provided.
    let emailSent = false
    if (email) {
      const { data: inviter } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const result = await sendInstitutionInviteEmail({
        to: email,
        institutionName: institution.name,
        roleLabel: ROLE_LABELS[role] || role,
        inviteUrl,
        inviterName: inviter?.full_name,
      })
      emailSent = !result.error
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution_invite.created',
      entity_type: 'institution_invite',
      entity_id: invite.id,
      after: { role, email: email || null, expires_at: expiresAt },
    })

    return apiSuccess({ invite: { ...invite, invite_url: inviteUrl }, email_sent: emailSent }, 201)
  } catch (error) {
    console.error('Invites POST error:', error)
    return ApiErrors.internal()
  }
}
