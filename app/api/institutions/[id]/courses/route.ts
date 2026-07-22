import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireInstitutionAdmin } from '@/lib/api-auth'

/**
 * Institution course library: every course authored under this
 * institution, with instructor, lesson count, and program attachments -
 * plus the institution's programs for the attach picker.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params
    const auth = await requireInstitutionAdmin(request, institutionId)
    if ('error' in auth) return auth.error

    const [coursesRes, programsRes] = await Promise.all([
      supabaseAdmin
        .from('courses')
        .select(
          'id, title, slug, status, difficulty_level, created_at, published_at, instructor:users!courses_instructor_id_fkey(full_name), lessons(id), program_courses(program_id, programs(name))'
        )
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('programs')
        .select('id, name, status')
        .eq('institution_id', institutionId)
        .order('name'),
    ])

    if (coursesRes.error) {
      console.error('institution courses error:', coursesRes.error)
      return ApiErrors.internal('Failed to load courses')
    }

    return apiSuccess({
      courses: (coursesRes.data || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        difficulty_level: c.difficulty_level,
        created_at: c.created_at,
        published_at: c.published_at,
        instructor_name: c.instructor?.full_name || 'Unknown',
        lesson_count: (c.lessons || []).length,
        programs: (c.program_courses || [])
          .map((pc: any) => pc.programs?.name)
          .filter(Boolean),
      })),
      programs: programsRes.data || [],
    })
  } catch (error) {
    console.error('Institution courses GET error:', error)
    return ApiErrors.internal()
  }
}

/** Attach a course to a program (appends at the end of the sequence). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params
    const auth = await requireInstitutionAdmin(request, institutionId)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { course_id, program_id } = body as { course_id?: string; program_id?: string }
    if (!course_id || !program_id) {
      return ApiErrors.badRequest('course_id and program_id are required')
    }

    // Both must belong to THIS institution
    const [courseRes, programRes] = await Promise.all([
      supabaseAdmin.from('courses').select('id').eq('id', course_id).eq('institution_id', institutionId).maybeSingle(),
      supabaseAdmin.from('programs').select('id').eq('id', program_id).eq('institution_id', institutionId).maybeSingle(),
    ])
    if (!courseRes.data) return ApiErrors.badRequest('Course does not belong to this institution')
    if (!programRes.data) return ApiErrors.badRequest('Program does not belong to this institution')

    const { data: existing } = await supabaseAdmin
      .from('program_courses')
      .select('id')
      .eq('program_id', program_id)
      .eq('course_id', course_id)
      .maybeSingle()
    if (existing) return apiSuccess({ attached: true, already: true })

    const { count } = await supabaseAdmin
      .from('program_courses')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program_id)

    const { error: insertError } = await supabaseAdmin.from('program_courses').insert({
      program_id,
      course_id,
      position: (count ?? 0) + 1,
      is_required: true,
      added_by: auth.userId,
    })
    if (insertError) {
      console.error('attach failed:', insertError)
      return ApiErrors.internal('Failed to attach course')
    }

    return apiSuccess({ attached: true })
  } catch (error) {
    console.error('Institution courses POST error:', error)
    return ApiErrors.internal()
  }
}
