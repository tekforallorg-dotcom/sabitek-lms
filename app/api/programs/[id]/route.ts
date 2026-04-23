import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { updateProgramSchema } from '@/lib/validations/program'
import { ZodError } from 'zod'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/programs/[id]
 * Get a single program with details
 * 
 * Fetches relations separately to avoid nested join failures
 * when related tables (program_courses, cohorts) have schema mismatches.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    console.log('=== PROGRAM GET ===', id)

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      console.log('No auth token')
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth failed:', authError?.message)
      return ApiErrors.unauthorized()
    }

    console.log('User:', user.id, user.email)

    // Step 1: Fetch program with institution only (safe join)
    const { data: program, error } = await supabaseAdmin
      .from('programs')
      .select(`
        *,
        institution:institutions(id, name, slug, logo_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Program fetch error:', error.message, error.code)
      return ApiErrors.notFound('Program not found')
    }

    if (!program) {
      console.log('Program is null')
      return ApiErrors.notFound('Program not found')
    }

    console.log('Program found:', program.name)

    // Step 2: Verify user has access
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', program.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    console.log('Membership:', membership?.role || 'none')

    // Check if program is public or user is a member
    if (!membership && program.visibility !== 'public') {
      console.log('Access denied: no membership and visibility =', program.visibility)
      return ApiErrors.forbidden('Not authorized to view this program')
    }

    // Step 3: Fetch cohorts separately (avoids join failures)
    const { data: cohorts, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select(`
        id,
        name,
        slug,
        status,
        enrollment_mode,
        seat_limit,
        start_date,
        end_date
      `)
      .eq('program_id', id)
      .order('created_at', { ascending: false })

    if (cohortsError) {
      console.log('Cohorts fetch error (non-fatal):', cohortsError.message)
    }

    // Step 4: Fetch program_courses separately (table may not exist or have different schema)
    let programCourses: any[] = []
    try {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('program_courses')
        .select(`
          id,
          position,
          is_required,
          course_id
        `)
        .eq('program_id', id)
        .order('position', { ascending: true })

      if (coursesError) {
        console.log('program_courses fetch error (non-fatal):', coursesError.message)
      } else {
        programCourses = courses || []
      }
    } catch (e) {
      // Table might not exist yet
      console.log('program_courses query skipped')
    }

    console.log('=== PROGRAM GET SUCCESS ===')

    return apiSuccess({
      ...program,
      cohorts: cohorts || [],
      program_courses: programCourses,
      cohort_count: cohorts?.length || 0,
    })

  } catch (error) {
    console.error('Program GET error:', error)
    return ApiErrors.internal()
  }
}

/**
 * PATCH /api/programs/[id]
 * Update a program
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

    // Fetch existing program
    const { data: existingProgram, error: fetchError } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingProgram) {
      return ApiErrors.notFound('Program not found')
    }

    // Verify user can manage this program
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', existingProgram.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['institution_admin', 'program_manager'].includes(membership.role)) {
      return ApiErrors.forbidden('Not authorized to update this program')
    }

    const body = await request.json()
    const validatedData = updateProgramSchema.parse(body)

    // Update program
    const { data: program, error } = await supabaseAdmin
      .from('programs')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        institution:institutions(id, name, slug, logo_url)
      `)
      .single()

    if (error) {
      console.error('Error updating program:', error)
      return ApiErrors.internal('Failed to update program')
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'program.updated',
        entity_type: 'program',
        entity_id: program.id,
        old_state: existingProgram,
        new_state: program,
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess(program)

  } catch (error) {
    if (error instanceof ZodError) {
      return ApiErrors.badRequest('Invalid input: ' + error.errors.map(e => e.message).join(', '))
    }
    console.error('Program PATCH error:', error)
    return ApiErrors.internal()
  }
}

/**
 * DELETE /api/programs/[id]
 * Delete a program (soft delete by setting status to archived)
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

    // Fetch existing program
    const { data: existingProgram, error: fetchError } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingProgram) {
      return ApiErrors.notFound('Program not found')
    }

    // Verify user is institution admin
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role')
      .eq('institution_id', existingProgram.institution_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || membership.role !== 'institution_admin') {
      return ApiErrors.forbidden('Only institution admins can delete programs')
    }

    // Soft delete by archiving
    const { error } = await supabaseAdmin
      .from('programs')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting program:', error)
      return ApiErrors.internal('Failed to delete program')
    }

    // Audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'program.archived',
        entity_type: 'program',
        entity_id: id,
        old_state: existingProgram,
      })
    } catch (auditErr) {
      console.log('Audit log insert failed (non-fatal):', auditErr)
    }

    return apiSuccess({ message: 'Program archived successfully' })

  } catch (error) {
    console.error('Program DELETE error:', error)
    return ApiErrors.internal()
  }
}