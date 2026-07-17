import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const COURSE_SELECT = '*, instructor:users!courses_instructor_id_fkey(full_name), lessons(id)'

/**
 * The public catalog (published, institution_id IS NULL) is identical for
 * every viewer - anonymous included - so it is cached across users for 60s
 * via unstable_cache. Proprietary (institution-owned) courses are merged in
 * fresh per user because RLS makes them per-viewer.
 */
const getPublicCatalog = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin
      .from('courses')
      .select(COURSE_SELECT)
      .eq('status', 'published')
      .is('institution_id', null)
      .order('created_at', { ascending: false })
    return data || []
  },
  ['public-catalog'],
  { revalidate: 60, tags: ['public-catalog'] }
)

function sortByCreatedDesc(a: any, b: any) {
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
}

function dedupe(courses: any[]) {
  const seen = new Set<string>()
  return courses.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

/**
 * GET /api/catalog
 *
 * Course catalog for the browse page. Reproduces the courses RLS tenancy
 * (public + the viewer's accessible proprietary courses) with the service
 * role, so the public portion can be shared-cached while proprietary rows
 * stay per-user and fresh.
 */
export async function GET(request: NextRequest) {
  try {
    const publicCourses = await getPublicCatalog()

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      // Anonymous: public catalog only - safe to CDN-cache identically.
      return NextResponse.json(
        { courses: publicCourses },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
      )
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) {
      return NextResponse.json(
        { courses: publicCourses },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
      )
    }
    const userId = user.id

    // Which proprietary published courses may this viewer see?
    const { data: me } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', userId)
      .single()

    let proprietary: any[] = []

    if (me?.is_super_admin) {
      const { data } = await supabaseAdmin
        .from('courses')
        .select(COURSE_SELECT)
        .eq('status', 'published')
        .not('institution_id', 'is', null)
        .order('created_at', { ascending: false })
      proprietary = data || []
    } else {
      const [memRes, cohortRes, instrRes] = await Promise.all([
        supabaseAdmin
          .from('institution_members')
          .select('institution_id')
          .eq('user_id', userId)
          .eq('status', 'active'),
        supabaseAdmin
          .from('cohort_members')
          .select('cohort_id')
          .eq('user_id', userId)
          .eq('status', 'active'),
        supabaseAdmin
          .from('courses')
          .select(COURSE_SELECT)
          .eq('instructor_id', userId)
          .eq('status', 'published')
          .not('institution_id', 'is', null),
      ])

      const collected: any[] = [...(instrRes.data || [])]

      // Courses owned by institutions the viewer is an active member of.
      const institutionIds = [...new Set((memRes.data || []).map((m) => m.institution_id))]
      if (institutionIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('courses')
          .select(COURSE_SELECT)
          .eq('status', 'published')
          .in('institution_id', institutionIds)
        collected.push(...(data || []))
      }

      // Proprietary courses covered by the viewer's active cohort programs.
      const cohortIds = (cohortRes.data || []).map((c) => c.cohort_id)
      if (cohortIds.length > 0) {
        const { data: cohorts } = await supabaseAdmin
          .from('cohorts')
          .select('program_id')
          .in('id', cohortIds)
        const programIds = [...new Set((cohorts || []).map((c) => c.program_id).filter(Boolean))]
        if (programIds.length > 0) {
          const { data: pc } = await supabaseAdmin
            .from('program_courses')
            .select('course_id')
            .in('program_id', programIds)
          const courseIds = [...new Set((pc || []).map((x) => x.course_id))]
          if (courseIds.length > 0) {
            const { data } = await supabaseAdmin
              .from('courses')
              .select(COURSE_SELECT)
              .eq('status', 'published')
              .not('institution_id', 'is', null)
              .in('id', courseIds)
            collected.push(...(data || []))
          }
        }
      }

      proprietary = collected
    }

    const courses = dedupe([...publicCourses, ...proprietary]).sort(sortByCreatedDesc)

    // Per-user payload (contains proprietary rows) - never shared-cache it.
    return NextResponse.json(
      { courses },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('catalog error:', error)
    return ApiErrors.internal('Failed to load catalog')
  }
}
