import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit-logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    // Prevent self-modification
    if (params.userId === user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
    }

    const body = await request.json()
    const { action, reason } = body

    // Get current user data
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', params.userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updates: any = {}
    let auditAction = ''

    switch (action) {
      case 'suspend':
        updates = { status: 'suspended' }
        auditAction = 'USER_SUSPENDED'
        break
      case 'activate':
        updates = { status: 'active' }
        auditAction = 'USER_ACTIVATED'
        break
      case 'deactivate':
        updates = { status: 'deactivated' }
        auditAction = 'USER_DEACTIVATED'
        break
      case 'delete':
        updates = { status: 'soft_deleted' }
        auditAction = 'USER_DELETED'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', params.userId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Create audit log
    await createAuditLog({
      actor_user_id: user.id,
      action: auditAction,
      entity_type: 'user',
      entity_id: params.userId,
      before: { status: targetUser.status },
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