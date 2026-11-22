import { NextRequest } from 'next/server'
import { validateBody, validateQuery, extractBearerToken } from '@/lib/validations'
import { createInstitutionSchema, institutionQuerySchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getDefaultPacks, type InstitutionVerticalType } from '@/lib/vertical-packs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { toJson } from '@/lib/db-json'


/**
 * GET /api/institutions
 * List institutions (filtered by user role)
 */
export async function GET(request: NextRequest) {
  try {
    const queryValidation = validateQuery(
      institutionQuerySchema,
      request.nextUrl.searchParams
    )
    if (!queryValidation.success) return queryValidation.error
    
    const { page, limit, status, type, search } = queryValidation.data
    const offset = (page - 1) * limit

    const token = extractBearerToken(request.headers.get('authorization'))
    let userId: string | null = null
    let isPlatformAdmin = false

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        userId = user.id
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('is_super_admin, platform_role')
          .eq('id', user.id)
          .single()
        isPlatformAdmin = userProfile?.is_super_admin || !!userProfile?.platform_role
      }
    }

    let query = supabaseAdmin
      .from('institutions')
      .select('*, creator:users!created_by(id, full_name, email)', { count: 'exact' })

    if (isPlatformAdmin) {
      if (status) query = query.eq('status', status)
    } else if (userId) {
      query = query.or(`status.eq.approved,created_by.eq.${userId}`)
    } else {
      query = query.eq('status', 'approved')
    }

    if (type) query = query.eq('type', type)
    if (search) query = query.ilike('name', `%${search}%`)

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: institutions, error, count } = await query

    if (error) {
      console.error('Error fetching institutions:', error)
      return ApiErrors.internal('Failed to fetch institutions')
    }

    // The creator's email is contact data: only the creator and platform
    // admins get it. Everyone else (including signed-out visitors browsing
    // approved institutions) sees the name only.
    // Review notes, rejection reasons, who reviewed, contact details and the
    // allowed email domains are for the institution's creator and platform
    // admins. Everyone else, signed in or not, gets the public profile.
    const PRIVATE_FIELDS = [
      'review_notes',
      'rejection_reason',
      'reviewed_by',
      'created_by',
      'email_domain_allowlist',
      'contact_email',
      'contact_phone',
      'address',
      'kpi_pack',
      'onboarding_pack',
      'reporting_pack',
      'required_fields_pack',
      'vertical_metadata',
      'creator',
    ] as const
    const visible = (institutions || []).map((inst) => {
      if (isPlatformAdmin || (userId && inst.created_by === userId)) return inst
      const publicProfile: Record<string, unknown> = { ...inst }
      for (const field of PRIVATE_FIELDS) delete publicProfile[field]
      return publicProfile
    })

    return apiSuccess({ institutions: visible, total: count || 0, page, limit })
  } catch (error) {
    console.error('Institutions GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * POST /api/institutions
 * Create a new institution (application)
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return ApiErrors.unauthorized()

    const body = await request.json()
    const validation = validateBody(createInstitutionSchema, body)
    if (!validation.success) return validation.error

    const input = validation.data

    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)

    let slug = baseSlug
    let suffix = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('institutions')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!existing) break
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    // Auto-assign vertical packs based on institution type
    const packs = getDefaultPacks((input.type || 'other') as InstitutionVerticalType)

    const { data: institution, error: insertError } = await supabaseAdmin
      .from('institutions')
      .insert({
        name: input.name,
        slug,
        type: input.type,
        description: input.description || null,
        country: input.country || null,
        state: input.state || null,
        lga: input.lga || null,
        address: input.address || null,
        website: input.website || null,
        contact_email: input.contact_email || null,
        contact_phone: input.contact_phone || null,
        logo_url: input.logo_url || null,
        accent_color: input.accent_color || '#dc2626',
         vertical_metadata: input.vertical_metadata || {},
        status: 'pending',
        created_by: user.id,
        terminology_pack: toJson(packs.terminology_pack),
        kpi_pack: toJson(packs.kpi_pack),
        onboarding_pack: toJson(packs.onboarding_pack),
        reporting_pack: toJson(packs.reporting_pack),
        required_fields_pack: toJson(packs.required_fields_pack),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating institution:', insertError)
      return ApiErrors.internal('Failed to create institution')
    }

    await supabaseAdmin.from('institution_members').insert({
      institution_id: institution.id,
      user_id: user.id,
      role: 'institution_admin',
      status: 'active',
      accepted_at: new Date().toISOString(),
    })

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'institution.created',
      entity_type: 'institution',
      entity_id: institution.id,
      after: institution,
    })

    return apiSuccess(institution, 201)
  } catch (error) {
    console.error('Institutions POST error:', error)
    return ApiErrors.internal()
  }
}