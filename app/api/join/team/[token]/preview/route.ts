import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ROLE_LABELS: Record<string, string> = {
  institution_admin: 'Institution Admin',
  program_manager: 'Program Manager',
  facilitator: 'Facilitator',
  instructor: 'Instructor',
  viewer: 'Viewer',
}

/** Public preview of a team invite: who is inviting, for what role. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token || token.length > 100) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const { data: invite } = await supabaseAdmin
    .from('institution_invites')
    .select('id, role, status, expires_at, max_uses, use_count, institution:institutions(name, slug)')
    .eq('token', token)
    .single()

  if (!invite) return NextResponse.json({ error: 'invalid' }, { status: 404 })

  if (invite.status !== 'ACTIVE') {
    return NextResponse.json({ error: invite.status.toLowerCase() }, { status: 410 })
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired' }, { status: 410 })
  }
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'exhausted' }, { status: 410 })
  }

  const institution = Array.isArray(invite.institution) ? invite.institution[0] : invite.institution

  return NextResponse.json({
    data: {
      institution_name: institution?.name || 'Institution',
      role: invite.role,
      role_label: ROLE_LABELS[invite.role] || invite.role,
    },
  })
}
