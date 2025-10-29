import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit-logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is super admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reason } = body

    // Get current certificate data
    const { data: targetCert, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('id', params.certificateId)
      .single()

    if (fetchError || !targetCert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    let updates: any = {}
    let auditAction = ''

    switch (action) {
      case 'revoke':
        if (!reason) {
          return NextResponse.json({ error: 'Reason required for revocation' }, { status: 400 })
        }
        updates = { 
          revoked_at: new Date().toISOString(),
          revoke_reason: reason
        }
        auditAction = 'CERTIFICATE_REVOKED'
        break
      case 'unrevoke':
        updates = { 
          revoked_at: null,
          revoke_reason: null
        }
        auditAction = 'CERTIFICATE_UNREVOKED'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update certificate
    const { error: updateError } = await supabaseAdmin
      .from('certificates')
      .update(updates)
      .eq('id', params.certificateId)

    if (updateError) {
      console.error('Error updating certificate:', updateError)
      return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 })
    }

    // Create audit log
    await createAuditLog({
      actor_user_id: user.id,
      action: auditAction,
      entity_type: 'certificate',
      entity_id: params.certificateId,
      before: { 
        revoked_at: targetCert.revoked_at,
        revoke_reason: targetCert.revoke_reason
      },
      after: updates,
      reason,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}