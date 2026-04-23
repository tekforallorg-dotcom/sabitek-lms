import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { updateCohortSchema } from '@/lib/validations/program'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/cohorts/[id]
 * Get a single cohort with details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // First fetch the cohort with program info
    const { data: cohort, error } = await supabaseAdmin
      .from('cohorts')
      .select(`
        *,
        program:programs(
          id,
          name,
          slug,
          institution_id,
          institution:institutions(id, name, slug, logo_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !cohort) {
      console.error('Cohort fetch error:', error)
      return ApiErrors.notFound('Cohort not found')
    }

    // Verify user has access
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', cohort.program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Check if user is a cohort member
    const { data: userMembership } = await supabaseAdmin
      .from('cohort_members')
      .select('id')
      .eq('cohort_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership && !userMembership) {
      return ApiErrors.forbidden('Not authorized to view this cohort')
    }

    // Fetch members separately with explicit foreign key hint
    const { data: members, error: membersError } = await supabaseAdmin
      .from('cohort_members')
      .select(`
        id,
        status,
        sponsorship,
        progress_pct,
        joined_at
      `)
      .eq('cohort_id', id)

    if (membersError) {
      console.error('Members fetch error:', membersError)
    }

    // Fetch user details for members
    const memberUserIds = (members || []).map(m => m.id)
    let membersWithUsers: any[] = []
    
    if (members && members.length > 0) {
      // Get the user_ids from cohort_members
      const { data: memberLinks } = await supabaseAdmin
        .from('cohort_members')
        .select('id, user_id')
        .eq('cohort_id', id)
      
      const userIds = (memberLinks || []).map(m => m.user_id).filter(Boolean)
      
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds)
        
        const usersMap = new Map((users || []).map(u => [u.id, u]))
        const memberLinkMap = new Map((memberLinks || []).map(m => [m.id, m.user_id]))
        
        membersWithUsers = (members || []).map(m => ({
          ...m,
          user: usersMap.get(memberLinkMap.get(m.id)) || null
        }))
      } else {
        membersWithUsers = members || []
      }
    }

    // Calculate stats
    const stats = {
      member_count: membersWithUsers.length,
      active_count: membersWithUsers.filter((m: any) => m.status === 'active').length,
      completed_count: membersWithUsers.filter((m: any) => m.status === 'completed').length,
      pending_count: membersWithUsers.filter((m: any) => 
        ['pending_approval', 'invited'].includes(m.status)
      ).length,
      average_progress: membersWithUsers.length > 0
        ? membersWithUsers.reduce((sum: number, m: any) => sum + (m.progress_pct || 0), 0) / membersWithUsers.length
        : 0,
    }

    return apiSuccess({
      ...cohort,
      cohort_members: membersWithUsers,
      stats,
    })

  } catch (error) {
    console.error('Cohort GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * PATCH /api/cohorts/[id]
 * Update a cohort
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Fetch existing cohort
    const { data: existingCohort, error: fetchError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        *,
        program:programs(institution_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingCohort) {
      return ApiErrors.notFound('Cohort not found')
    }

    // Verify user can manage
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', existingCohort.program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager', 'facilitator'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to update this cohort')
    }

    const body = await request.json()
    const validatedData = updateCohortSchema.parse(body)

    const { data: cohort, error } = await supabaseAdmin
      .from('cohorts')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        program:programs(id, name, slug, institution_id)
      `)
      .single()

    if (error) {
      console.error('Error updating cohort:', error)
      return ApiErrors.internal('Failed to update cohort')
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'cohort.updated',
        entity_type: 'cohort',
        entity_id: cohort.id,
        old_state: existingCohort,
        new_state: cohort,
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess(cohort)

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return ApiErrors.badRequest('Invalid input')
    }
    console.error('Cohort PATCH error:', error)
    return ApiErrors.internal()
  }
}

/**
 * DELETE /api/cohorts/[id]
 * Archive a cohort
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    const { data: existingCohort, error: fetchError } = await supabaseAdmin
      .from('cohorts')
      .select(`*, program:programs(institution_id)`)
      .eq('id', id)
      .single()

    if (fetchError || !existingCohort) {
      return ApiErrors.notFound('Cohort not found')
    }

    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', existingCohort.program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to delete this cohort')
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('cohorts')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error archiving cohort:', error)
      return ApiErrors.internal('Failed to archive cohort')
    }

    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'cohort.archived',
        entity_type: 'cohort',
        entity_id: id,
        old_state: existingCohort,
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess({ message: 'Cohort archived successfully' })

  } catch (error) {
    console.error('Cohort DELETE error:', error)
    return ApiErrors.internal()
  }
}