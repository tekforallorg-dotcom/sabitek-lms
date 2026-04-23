import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const joinByCodeSchema = z.object({
  access_code: z
    .string()
    .min(1, 'Access code is required')
    .max(32, 'Access code is too long')
    .transform((v) => v.trim().toUpperCase()),
})

/**
 * POST /api/cohorts/join
 * Learner joins a cohort by access code
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    const body = await request.json()
    const { access_code } = joinByCodeSchema.parse(body)

    // Find cohort by access code
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        id,
        name,
        status,
        enrollment_mode,
        access_code,
        seat_limit,
        program_id
      `)
      .eq('access_code', access_code)
      .single()

    if (cohortError || !cohort) {
      return ApiErrors.badRequest('Invalid access code. Please check and try again.')
    }

    // Validate cohort state
    if (cohort.status !== 'active') {
      const messages: Record<string, string> = {
        draft: 'This cohort is not yet accepting members.',
        closed: 'This cohort is no longer accepting new members.',
        archived: 'This cohort is no longer available.',
      }
      return ApiErrors.badRequest(messages[cohort.status] || 'This cohort is not available.')
    }

    if (cohort.enrollment_mode !== 'access_code') {
      return ApiErrors.badRequest('This cohort does not accept access code enrollment.')
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('cohort_members')
      .select('id, status')
      .eq('cohort_id', cohort.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return ApiErrors.badRequest('You are already a member of this cohort.')
      }
      if (existing.status === 'invited' || existing.status === 'pending_approval') {
        return ApiErrors.badRequest('You already have a pending invitation for this cohort.')
      }
      // Previously removed/withdrawn — allow rejoin
      const { data: rejoined, error: rejoinError } = await supabaseAdmin
        .from('cohort_members')
        .update({
          status: 'active',
          joined_at: new Date().toISOString(),
          removed_by: null,
          removed_at: null,
          notes: null,
        })
        .eq('id', existing.id)
        .select('id, cohort_id, status')
        .single()

      if (rejoinError) {
        console.error('Rejoin error:', rejoinError)
        return ApiErrors.internal('Failed to join cohort')
      }

      // Get program info for redirect
      const { data: program } = await supabaseAdmin
        .from('programs')
        .select('id, name')
        .eq('id', cohort.program_id)
        .single()

      return apiSuccess({
        member: rejoined,
        cohort: { id: cohort.id, name: cohort.name },
        program: program ? { id: program.id, name: program.name } : null,
        message: 'Welcome back! You have rejoined the cohort.',
      })
    }

    // Check seat limit
    if (cohort.seat_limit) {
      const { count } = await supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact' })
        .eq('cohort_id', cohort.id)
        .in('status', ['active', 'invited', 'pending_approval'])

      if ((count || 0) >= cohort.seat_limit) {
        return ApiErrors.badRequest('This cohort is full. Please contact the administrator.')
      }
    }

    // Create membership
    const { data: member, error: createError } = await supabaseAdmin
      .from('cohort_members')
      .insert({
        cohort_id: cohort.id,
        user_id: user.id,
        status: 'active',
        sponsorship: 'institution_sponsored',
        joined_at: new Date().toISOString(),
      })
      .select('id, cohort_id, status')
      .single()

    if (createError) {
      console.error('Join error:', createError)
      return ApiErrors.internal('Failed to join cohort')
    }

    // Get program info for redirect
    const { data: program } = await supabaseAdmin
      .from('programs')
      .select('id, name')
      .eq('id', cohort.program_id)
      .single()

    return apiSuccess({
      member,
      cohort: { id: cohort.id, name: cohort.name },
      program: program ? { id: program.id, name: program.name } : null,
      message: 'You have successfully joined the cohort!',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(error.errors[0]?.message || 'Invalid input')
    }
    console.error('Cohort join error:', error)
    return ApiErrors.internal()
  }
}