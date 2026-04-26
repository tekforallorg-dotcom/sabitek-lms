import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { z } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const bulkInviteSchema = z.object({
  emails: z
    .array(z.string().email('Invalid email format'))
    .min(1, 'At least one email is required')
    .max(200, 'Maximum 200 emails per batch'),
})

interface BulkResult {
  email: string
  status: 'invited' | 'already_member' | 'not_found' | 'seat_limit' | 'error'
  message: string
}

/**
 * POST /api/cohorts/[id]/members/bulk
 *
 * Bulk invite members by email array. Requires institution admin/manager/facilitator.
 * Processes each email sequentially:
 *   - Found + not yet member → invited
 *   - Found + already member → skipped
 *   - Not found → reported
 *   - Seat limit hit → stopped
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Verify cohort exists
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('id, seat_limit, program_id')
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
      return ApiErrors.forbidden('Not authorized to invite members')
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}))
    const validation = bulkInviteSchema.safeParse(body)
    if (!validation.success) {
      return ApiErrors.badRequest(
        validation.error.errors.map((e) => e.message).join(', ')
      )
    }

    const { emails } = validation.data

    // Deduplicate emails (case-insensitive)
    const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase().trim()))]

    // Get current member count for seat limit check
    let currentMemberCount = 0
    if (cohort.seat_limit) {
      const { count } = await supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact' })
        .eq('cohort_id', cohortId)
        .in('status', ['active', 'invited', 'pending_approval'])

      currentMemberCount = count || 0
    }

    // Batch lookup all users by email
    const { data: foundUsers } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('email', uniqueEmails)

    const usersByEmail = new Map(
      (foundUsers || []).map((u) => [u.email.toLowerCase(), u])
    )

    // Batch lookup existing cohort members
    const foundUserIds = (foundUsers || []).map((u) => u.id)
    const { data: existingMembers } = await supabaseAdmin
      .from('cohort_members')
      .select('user_id, status')
      .eq('cohort_id', cohortId)
      .in('user_id', foundUserIds.length > 0 ? foundUserIds : ['__none__'])

    const existingByUserId = new Map(
      (existingMembers || []).map((m) => [m.user_id, m.status])
    )

    // Process each email
    const results: BulkResult[] = []
    let newInviteCount = 0

    for (const email of uniqueEmails) {
      const foundUser = usersByEmail.get(email)

      if (!foundUser) {
        results.push({ email, status: 'not_found', message: 'No account found with this email' })
        continue
      }

      const existingStatus = existingByUserId.get(foundUser.id)

      if (existingStatus && ['active', 'invited', 'pending_approval'].includes(existingStatus)) {
        results.push({ email, status: 'already_member', message: `Already ${existingStatus.replace('_', ' ')}` })
        continue
      }

      // Check seat limit
      if (cohort.seat_limit && (currentMemberCount + newInviteCount) >= cohort.seat_limit) {
        results.push({ email, status: 'seat_limit', message: 'Cohort seat limit reached' })
        continue
      }

      // Re-invite if previously removed/withdrawn
      if (existingStatus && ['removed', 'withdrawn'].includes(existingStatus)) {
        const { error: updateError } = await supabaseAdmin
          .from('cohort_members')
          .update({
            status: 'invited',
            invited_by: user.id,
            removed_by: null,
            removed_at: null,
            notes: null,
          })
          .eq('cohort_id', cohortId)
          .eq('user_id', foundUser.id)

        if (updateError) {
          results.push({ email, status: 'error', message: 'Failed to re-invite' })
        } else {
          results.push({ email, status: 'invited', message: 'Re-invited successfully' })
          newInviteCount++
        }
        continue
      }

      // New invite
      const { error: insertError } = await supabaseAdmin
        .from('cohort_members')
        .insert({
          cohort_id: cohortId,
          user_id: foundUser.id,
          status: 'invited',
          sponsorship: 'institution_sponsored',
          invited_by: user.id,
        })

      if (insertError) {
        console.error(`Bulk invite error for ${email}:`, insertError)
        results.push({ email, status: 'error', message: 'Failed to invite' })
      } else {
        results.push({ email, status: 'invited', message: 'Invited successfully' })
        newInviteCount++
      }
    }

    // Summary counts
    const summary = {
      total: uniqueEmails.length,
      invited: results.filter((r) => r.status === 'invited').length,
      already_member: results.filter((r) => r.status === 'already_member').length,
      not_found: results.filter((r) => r.status === 'not_found').length,
      seat_limit: results.filter((r) => r.status === 'seat_limit').length,
      errors: results.filter((r) => r.status === 'error').length,
    }

    // Audit log (non-blocking)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'cohort.bulk_invite',
        entity_type: 'cohort',
        entity_id: cohortId,
        after: summary,
      })
    } catch {}

    return apiSuccess({ results, summary })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(error.errors.map((e) => e.message).join(', '))
    }
    console.error('Bulk invite error:', error)
    return ApiErrors.internal()
  }
}