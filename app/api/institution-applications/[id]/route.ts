import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'
import { extractBearerToken, validateBody } from '@/lib/validations'
import { reviewApplicationSchema } from '@/lib/validations/institution-application'
import { sendWorkspaceWelcomeEmail, sendApplicationRejectionEmail } from '@/lib/email'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.school'

/**
 * Map application org_type to the institution_type enum.
 * 'tutor' maps to 'training_center' (verified instructors get a workspace).
 */
function mapOrgType(orgType: string): string {
  const map: Record<string, string> = {
    school: 'school',
    ngo: 'ngo',
    government: 'government',
    training_center: 'training_center',
    company: 'company',
    tutor: 'training_center',
    other: 'other',
  }
  return map[orgType] || 'other'
}

/**
 * Generate a slug from organisation name.
 * Lowercase, replace spaces/special chars with hyphens, trim.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/**
 * Generate a random temporary password (16 chars, URL-safe).
 */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url')
}

/**
 * Provision an institution workspace from an approved application.
 *
 * Steps:
 *   1. Find or create the auth user for the applicant email
 *   2. Ensure a users profile row exists
 *   3. Create the institutions row
 *   4. Make slug unique if collision
 *   5. Insert institution_members as institution_admin
 *   6. Update the application with institution_id
 *   7. Send workspace welcome email
 */
async function provisionWorkspace(application: {
  id: string
  full_name: string
  email: string
  organisation_name: string
  org_type: string
  country: string | null
  role_title: string | null
}, reviewerId: string): Promise<{ success: boolean; error?: string; institution_id?: string }> {
  const email = application.email.toLowerCase()
  let isNewUser = false
  let tempPassword: string | undefined
  let userId: string

  // 1. Find or create auth user
  const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingAuth?.users?.find(
    (u) => u.email?.toLowerCase() === email
  )

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Create new auth user with temp password
    tempPassword = generateTempPassword()
    const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
        role: 'learner',
      },
    })

    if (createError || !newAuth.user) {
      console.error('Failed to create auth user:', createError)
      return { success: false, error: 'Failed to create user account.' }
    }

    userId = newAuth.user.id
    isNewUser = true
  }

  // 2. Ensure users profile row exists
  const { data: existingProfile } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existingProfile) {
    await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      full_name: application.full_name,
      role: 'learner', // base role; institution access via institution_members
    })
  }

  // 3. Generate unique slug
  let slug = generateSlug(application.organisation_name)
  let slugSuffix = 0
  while (true) {
    const candidateSlug = slugSuffix === 0 ? slug : `${slug}-${slugSuffix}`
    const { data: existing } = await supabaseAdmin
      .from('institutions')
      .select('id')
      .eq('slug', candidateSlug)
      .maybeSingle()

    if (!existing) {
      slug = candidateSlug
      break
    }
    slugSuffix++
    if (slugSuffix > 10) {
      slug = `${slug}-${Date.now().toString(36)}`
      break
    }
  }

  // 4. Create institution
  const institutionType = mapOrgType(application.org_type)

  const { data: institution, error: instError } = await supabaseAdmin
    .from('institutions')
    .insert({
      name: application.organisation_name,
      slug,
      type: institutionType,
      status: 'approved',
      created_by: userId,
      contact_email: email,
      country: application.country || null,
    })
    .select('id')
    .single()

  if (instError || !institution) {
    console.error('Failed to create institution:', instError)
    return { success: false, error: 'Failed to create institution workspace.' }
  }

  const institutionId = (institution as { id: string }).id

  // 5. Add as institution_admin
  const { error: memberError } = await supabaseAdmin
    .from('institution_members')
    .insert({
      institution_id: institutionId,
      user_id: userId,
      role: 'institution_admin',
      status: 'active',
    })

  if (memberError) {
    console.error('Failed to add institution member:', memberError)
    // Non-fatal: institution exists, member can be added manually
  }

  // 6. Update application with institution_id
  await supabaseAdmin
    .from('institution_applications')
    .update({ institution_id: institutionId })
    .eq('id', application.id)

  // 7. Send welcome email
  const loginUrl = `${APP_URL}/auth/login`
  try {
    await sendWorkspaceWelcomeEmail({
      to: email,
      userName: application.full_name,
      organisationName: application.organisation_name,
      loginUrl,
      isNewUser,
      tempPassword,
    })
  } catch (emailErr) {
    console.error('Failed to send workspace welcome email:', emailErr)
    // Non-fatal: workspace is provisioned, email can be resent
  }

  return { success: true, institution_id: institutionId }
}

/**
 * PATCH /api/institution-applications/[id]
 *
 * Approve or reject an application. Super admin only.
 * On approve: auto-provisions institution workspace + sends email.
 * On reject: persists optional rejection_reason and sends rejection email.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    // Super admin check
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle()

    const profileRow = profile as { is_super_admin: boolean } | null
    if (!profileRow?.is_super_admin) {
      return ApiErrors.forbidden('Only super admins can review applications.')
    }

    const rl = rateLimit(`review_app:${user.id}`, RATE_LIMIT_STANDARD)
    if (!rl.success) {
      return ApiErrors.tooManyRequests
        ? ApiErrors.tooManyRequests('Too many requests.')
        : ApiErrors.badRequest('Too many requests.')
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateBody(reviewApplicationSchema, body)
    if (!validation.success) return validation.error

    const { action, review_notes, rejection_reason } = validation.data

    // Fetch current application
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('institution_applications')
      .select('*')
      .eq('id', appId)
      .maybeSingle()

    if (fetchError || !existing) {
      return ApiErrors.notFound('Application not found.')
    }

    const app = existing as {
      id: string
      status: string
      full_name: string
      email: string
      organisation_name: string
      org_type: string
      country: string | null
      role_title: string | null
    }

    if (app.status !== 'pending') {
      return apiSuccess({
        already_reviewed: true,
        status: app.status,
        message: `This application has already been ${app.status}.`,
      })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Normalise rejection reason: trim whitespace; empty becomes null.
    const normalisedRejectionReason =
      action === 'reject' && rejection_reason && rejection_reason.trim().length > 0
        ? rejection_reason.trim()
        : null

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('institution_applications')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
        rejection_reason: action === 'reject' ? normalisedRejectionReason : null,
      })
      .eq('id', appId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return ApiErrors.internal('Failed to update application.')
    }

    // Auto-provision on approval
    let provisionResult: { success: boolean; error?: string; institution_id?: string } | null = null
    if (action === 'approve') {
      provisionResult = await provisionWorkspace(app, user.id)
      if (!provisionResult.success) {
        console.error('Workspace provisioning failed:', provisionResult.error)
        // Status is already approved. Log the failure but don't revert.
        // Admin can see the error and retry or provision manually.
      }
    }

    // Send rejection email (non-blocking)
    if (action === 'reject') {
      try {
        await sendApplicationRejectionEmail({
          to: app.email,
          userName: app.full_name,
          organisationName: app.organisation_name,
          reason: normalisedRejectionReason,
        })
        console.info('[applications] rejected', { id: appId, hasReason: !!normalisedRejectionReason })
      } catch (emailErr) {
        console.error('[applications] rejection email failed', emailErr)
        // Non-fatal: the rejection itself is recorded; admin can communicate manually.
      }
    }

    // Audit log (non-blocking)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: `institution_application.${newStatus}`,
        entity_type: 'institution_application',
        entity_id: appId,
        before: { status: 'pending' },
        after: {
          status: newStatus,
          review_notes,
          rejection_reason: action === 'reject' ? normalisedRejectionReason : null,
          institution_id: provisionResult?.institution_id || null,
        },
      })
    } catch {}

    if (action === 'approve') {
      return apiSuccess({
        status: 'approved',
        provisioned: provisionResult?.success || false,
        institution_id: provisionResult?.institution_id || null,
        message: provisionResult?.success
          ? 'Application approved. Workspace created and welcome email sent.'
          : `Application approved, but workspace provisioning had an issue: ${provisionResult?.error || 'Unknown error'}. You may need to provision manually.`,
      })
    }

    return apiSuccess({
      status: 'rejected',
      message: 'Application rejected. Notification email sent.',
    })
  } catch (error) {
    console.error('PATCH /api/institution-applications/[id] error:', error)
    return ApiErrors.internal()
  }
}