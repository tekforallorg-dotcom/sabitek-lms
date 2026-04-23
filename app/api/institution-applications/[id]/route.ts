import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { rateLimit, RATE_LIMIT_STANDARD } from '@/lib/rate-limit'
import { extractBearerToken, validateBody } from '@/lib/validations'
import { reviewApplicationSchema } from '@/lib/validations/institution-application'
import { sendWorkspaceWelcomeEmail } from '@/lib/email'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.school'

/**
 * Map application org_type to institution_type enum.
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
 * Generate a URL-safe slug from an organisation name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-|-$/g, '')
    || `org-${Date.now()}`
}

/**
 * Generate a random temporary password.
 */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16)
}

/**
 * Auto-provision: create institution + user + membership.
 */
async function provisionInstitution(
  application: {
    id: string
    full_name: string
    email: string
    organisation_name: string
    org_type: string
    country: string | null
    role_title: string | null
  },
  reviewerId: string
): Promise<{ success: boolean; institution_id?: string; is_new_user?: boolean; temp_password?: string; error?: string }> {
  try {
    // 1. Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    // Search by email manually since listUsers doesn't filter by email directly
    let authUser: { id: string } | null = null
    let isNewUser = false
    let tempPassword: string | undefined

    // Try to get user by email
    const { data: userList } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', application.email.toLowerCase())
      .maybeSingle()

    const existingProfile = userList as { id: string; email: string } | null

    if (existingProfile) {
      // User exists in our users table
      authUser = { id: existingProfile.id }
    } else {
      // Create new auth user with temporary password
      tempPassword = generateTempPassword()

      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: application.email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.full_name,
          role: 'institution_admin',
        },
      })

      if (createError) {
        // User might exist in auth but not in users table
        if (createError.message?.includes('already been registered')) {
          // Find them via auth
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const found = users?.find(u => u.email === application.email.toLowerCase())
          if (found) {
            authUser = { id: found.id }
          } else {
            return { success: false, error: `Could not find or create user: ${createError.message}` }
          }
        } else {
          return { success: false, error: `Failed to create user: ${createError.message}` }
        }
      } else if (newAuthUser?.user) {
        authUser = { id: newAuthUser.user.id }
        isNewUser = true
      }
    }

    if (!authUser) {
      return { success: false, error: 'Could not resolve user account.' }
    }

    // 2. Ensure users table profile exists
    const { data: profileCheck } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (!profileCheck) {
      await supabaseAdmin.from('users').insert({
        id: authUser.id,
        email: application.email.toLowerCase(),
        full_name: application.full_name,
        role: 'learner',
        status: 'active',
      })
    }

    // 3. Generate unique slug
    let slug = generateSlug(application.organisation_name)
    const { data: slugCheck } = await supabaseAdmin
      .from('institutions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (slugCheck) {
      slug = `${slug}-${Date.now().toString(36)}`
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
        created_by: authUser.id,
        contact_email: application.email.toLowerCase(),
        country: application.country || null,
      })
      .select('id')
      .single()

    if (instError) {
      return { success: false, error: `Failed to create institution: ${instError.message}` }
    }

    const instRow = institution as { id: string }

    // 5. Add user as institution_admin
    const { error: memberError } = await supabaseAdmin
      .from('institution_members')
      .insert({
        institution_id: instRow.id,
        user_id: authUser.id,
        role: 'institution_admin',
        status: 'active',
      })

    if (memberError) {
      // If duplicate, that's fine
      if (memberError.code !== '23505') {
        console.error('Error adding institution member:', memberError)
      }
    }

    // 6. Update application with institution_id
    await supabaseAdmin
      .from('institution_applications')
      .update({ institution_id: instRow.id })
      .eq('id', application.id)

    return {
      success: true,
      institution_id: instRow.id,
      is_new_user: isNewUser,
      temp_password: tempPassword,
    }
  } catch (error) {
    console.error('Provision error:', error)
    return { success: false, error: 'Unexpected error during provisioning.' }
  }
}

/**
 * PATCH /api/institution-applications/[id]
 *
 * Approve or reject an application. Super admin only.
 * On approve: auto-provisions institution workspace + sends welcome email.
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

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('institution_applications')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
        rejection_reason: action === 'reject' ? (rejection_reason || null) : null,
      })
      .eq('id', appId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return ApiErrors.internal('Failed to update application.')
    }

    // Auto-provision on approval
    let provisionResult = null
    if (action === 'approve') {
      provisionResult = await provisionInstitution(app, user.id)

      if (provisionResult.success) {
        // Send welcome email
        const loginUrl = `${APP_URL}/auth/login`
        try {
          await sendWorkspaceWelcomeEmail({
            to: app.email,
            userName: app.full_name,
            organisationName: app.organisation_name,
            loginUrl,
            isNewUser: provisionResult.is_new_user || false,
            tempPassword: provisionResult.temp_password,
          })
        } catch (emailErr) {
          console.error('Welcome email failed (non-blocking):', emailErr)
        }
      } else {
        console.error('Provisioning failed:', provisionResult.error)
        // Status is already approved but provision failed.
        // We don't revert the approval - admin can retry or provision manually.
      }
    }

    // Audit log
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
          rejection_reason,
          institution_id: provisionResult?.institution_id || null,
          provisioned: provisionResult?.success || false,
        },
      })
    } catch {}

    return apiSuccess({
      status: newStatus,
      provisioned: provisionResult?.success || false,
      institution_id: provisionResult?.institution_id || null,
      is_new_user: provisionResult?.is_new_user || false,
      message: action === 'approve'
        ? provisionResult?.success
          ? 'Application approved. Workspace created and welcome email sent.'
          : `Application approved but provisioning failed: ${provisionResult?.error}. Please provision manually.`
        : 'Application rejected.',
    })
  } catch (error) {
    console.error('PATCH /api/institution-applications/[id] error:', error)
    return ApiErrors.internal()
  }
}