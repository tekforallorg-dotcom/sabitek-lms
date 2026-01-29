import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit-logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { courseId } = await params

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

    // Get current course data
    const { data: targetCourse, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (fetchError || !targetCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    let updates: Record<string, unknown> = {}
    let auditAction = ''

    switch (action) {
      case 'publish':
        updates = { 
          status: 'published',
          published_at: new Date().toISOString()
        }
        auditAction = 'COURSE_PUBLISHED'
        break
      case 'archive':
        updates = { status: 'archived' }
        auditAction = 'COURSE_ARCHIVED'
        break
      case 'unarchive':
        updates = { status: 'draft' }
        auditAction = 'COURSE_UNARCHIVED'
        break
      case 'delete':
        // Soft delete by archiving
        updates = { status: 'archived' }
        auditAction = 'COURSE_DELETED'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update course
    const { error: updateError } = await supabaseAdmin
      .from('courses')
      .update(updates)
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course:', updateError)
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
    }

    // Create audit log
    await createAuditLog({
      actor_user_id: user.id,
      action: auditAction,
      entity_type: 'course',
      entity_id: courseId,
      before: { status: targetCourse.status },
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