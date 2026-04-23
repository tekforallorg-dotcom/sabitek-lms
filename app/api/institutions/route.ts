import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody, validateQuery, extractBearerToken } from '@/lib/validations'
import { createInstitutionSchema, institutionQuerySchema } from '@/lib/validations/institution'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getDefaultPacks, type InstitutionVerticalType } from '@/lib/vertical-packs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    return apiSuccess({ institutions: institutions || [], total: count || 0, page, limit })
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
        terminology_pack: packs.terminology_pack,
        kpi_pack: packs.kpi_pack,
        onboarding_pack: packs.onboarding_pack,
        reporting_pack: packs.reporting_pack,
        required_fields_pack: packs.required_fields_pack,
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