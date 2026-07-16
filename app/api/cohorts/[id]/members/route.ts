import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { cohortMemberQuerySchema } from '@/lib/validations/program'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/cohorts/[id]/members
 * Get members of a cohort with pagination
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cohortId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify cohort exists and get institution_id
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        id,
        program_id
      `)
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      return ApiErrors.notFound('Cohort not found')
    }

    // Get program's institution_id
    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('institution_id')
      .eq('id', cohort.program_id)
      .single()

    if (!program) {
      return ApiErrors.notFound('Program not found')
    }

    // Verify user has access
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return ApiErrors.forbidden('Not authorized to view cohort members')
    }

    // Parse query params with defaults
    const { searchParams } = new URL(request.url)
    const query = cohortMemberQuerySchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const { page, limit, status, search } = query
    const offset = (page - 1) * limit

    // Build query for members - WITHOUT joined user to avoid ambiguous relationship
    let membersQuery = supabaseAdmin
      .from('cohort_members')
      .select(`
        id,
        user_id,
        status,
        sponsorship,
        progress_pct,
        joined_at,
        invited_at,
        applied_at,
        last_activity_at,
        completed_at,
        invited_by,
        approved_by,
        removed_by,
        removed_at,
        created_at
      `, { count: 'exact' })
      .eq('cohort_id', cohortId)
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      membersQuery = membersQuery.eq('status', status)
    }

    const { data: members, error: membersError, count } = await membersQuery

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return ApiErrors.internal('Failed to fetch members')
    }

    // Fetch user details separately
    const userIds = (members || []).map(m => m.user_id).filter(Boolean)
    let usersMap = new Map<string, any>()

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds)

      if (!usersError && users) {
        usersMap = new Map(users.map(u => [u.id, u]))
      }

      // Apply search filter on users if needed
      if (search) {
        const searchLower = search.toLowerCase()
        const matchingUserIds = users
          ?.filter(u => 
            u.full_name?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower)
          )
          .map(u => u.id) || []
        
        // Filter members to only those matching search
        const filteredMembers = (members || []).filter(m => 
          matchingUserIds.includes(m.user_id)
        )
        
        // Merge user data into members
        const membersWithUsers = filteredMembers.map(m => ({
          ...m,
          user: usersMap.get(m.user_id) || null
        }))

        return apiSuccess({
          members: membersWithUsers,
          pagination: {
            page,
            limit,
            total: filteredMembers.length,
            total_pages: Math.ceil(filteredMembers.length / limit),
          },
        })
      }
    }

    // Merge user data into members
    const membersWithUsers = (members || []).map(m => ({
      ...m,
      user: usersMap.get(m.user_id) || null
    }))

    return apiSuccess({
      members: membersWithUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Invalid query parameters: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Cohort members GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/cohorts/[id]/members
 * Add a member to a cohort (invite)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cohortId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // Verify cohort exists
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        id,
        seat_limit,
        program_id
      `)
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      return ApiErrors.notFound('Cohort not found')
    }

    // Get program's institution_id
    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('institution_id')
      .eq('id', cohort.program_id)
      .single()

    if (!program) {
      return ApiErrors.notFound('Program not found')
    }

    // Verify user can manage
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager', 'facilitator'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to add members')
    }

    const body = await request.json()
    const { user_id, email, sponsorship = 'institution_sponsored' } = body

    let targetUserId = user_id

    // If email provided, find user
    if (!targetUserId && email) {
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!targetUser) {
        return ApiErrors.badRequest('User not found with this email')
      }
      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return ApiErrors.badRequest('user_id or email is required')
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('cohort_members')
      .select('id, status')
      .eq('cohort_id', cohortId)
      .eq('user_id', targetUserId)
      .single()

    if (existing) {
      if (['active', 'invited', 'pending_approval'].includes(existing.status)) {
        return ApiErrors.badRequest('User is already a member or has a pending invitation')
      }
      // Re-invite if previously removed/withdrawn
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('cohort_members')
        .update({
          status: 'invited',
          invited_by: user.id,
          removed_by: null,
          removed_at: null,
          notes: null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return ApiErrors.internal('Failed to re-invite member')
      }

      return apiSuccess(updated)
    }

    // Check seat limit
    if (cohort.seat_limit) {
      const { count } = await supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact' })
        .eq('cohort_id', cohortId)
        .in('status', ['active', 'invited', 'pending_approval'])

      if ((count || 0) >= cohort.seat_limit) {
        return ApiErrors.badRequest('Cohort has reached its seat limit')
      }
    }

    // Create member
    const { data: member, error: createError } = await supabaseAdmin
      .from('cohort_members')
      .insert({
        cohort_id: cohortId,
        user_id: targetUserId,
        status: 'invited',
        sponsorship,
        invited_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating member:', createError)
      return ApiErrors.internal('Failed to add member')
    }

    return apiSuccess(member)

  } catch (error) {
    console.error('Cohort members POST error:', error)
    return ApiErrors.internal()
  }
}