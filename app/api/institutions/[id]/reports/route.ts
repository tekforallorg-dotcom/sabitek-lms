import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { requireInstitutionAdmin } from '@/lib/api-auth'

/**
 * Institution reports: the numbers an admin shows their board or funder.
 * Cohort-level progress and completion, program/course inventory, and
 * headline totals - all computed from live rows, never self-reported.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params
    const auth = await requireInstitutionAdmin(request, institutionId, [
      'institution_admin',
      'program_manager',
      'viewer',
    ])
    if ('error' in auth) return auth.error

    const { data: programs } = await supabaseAdmin
      .from('programs')
      .select('id, name, status')
      .eq('institution_id', institutionId)
    const programIds = (programs || []).map((p) => p.id)

    const [cohortsRes, coursesRes, membersRes] = await Promise.all([
      programIds.length > 0
        ? supabaseAdmin
            .from('cohorts')
            .select('id, name, status, start_date, end_date, seat_limit, program_id')
            .in('program_id', programIds)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin
        .from('courses')
        .select('id, title, status')
        .eq('institution_id', institutionId),
      supabaseAdmin
        .from('institution_members')
        .select('id, role, status')
        .eq('institution_id', institutionId),
    ])

    const cohorts = cohortsRes.data || []
    const cohortIds = cohorts.map((c) => c.id)

    // One query for all cohort members, aggregated in memory
    const { data: cohortMembers } =
      cohortIds.length > 0
        ? await supabaseAdmin
            .from('cohort_members')
            .select('cohort_id, status, progress_pct, courses_completed, completed_at, last_activity_at')
            .in('cohort_id', cohortIds)
        : { data: [] as any[] }

    const byCohort = new Map<string, any[]>()
    for (const m of cohortMembers || []) {
      const list = byCohort.get(m.cohort_id) || []
      list.push(m)
      byCohort.set(m.cohort_id, list)
    }

    const programName = new Map((programs || []).map((p) => [p.id, p.name]))
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const cohortReports = cohorts.map((c) => {
      const members = (byCohort.get(c.id) || []).filter((m) => m.status === 'active')
      const avgProgress =
        members.length > 0
          ? Math.round(members.reduce((s, m) => s + (Number(m.progress_pct) || 0), 0) / members.length)
          : 0
      const completed = members.filter((m) => m.completed_at).length
      const atRisk = members.filter(
        (m) =>
          !m.completed_at &&
          (!m.last_activity_at || new Date(m.last_activity_at) < twoWeeksAgo)
      ).length
      return {
        id: c.id,
        name: c.name,
        program_name: programName.get(c.program_id) || '',
        status: c.status,
        start_date: c.start_date,
        end_date: c.end_date,
        seat_limit: c.seat_limit,
        active_members: members.length,
        avg_progress: avgProgress,
        completed,
        at_risk: atRisk,
      }
    })

    const activeLearners = new Set(
      (cohortMembers || []).filter((m) => m.status === 'active').map((m) => m.cohort_id + '')
    )
    const allActiveMembers = (cohortMembers || []).filter((m) => m.status === 'active')

    return apiSuccess({
      totals: {
        programs: (programs || []).length,
        cohorts: cohorts.length,
        courses: (coursesRes.data || []).length,
        published_courses: (coursesRes.data || []).filter((c) => c.status === 'published').length,
        team_members: (membersRes.data || []).filter((m) => m.status === 'active').length,
        active_learners: allActiveMembers.length,
        completions: allActiveMembers.filter((m) => m.completed_at).length,
        avg_progress:
          allActiveMembers.length > 0
            ? Math.round(
                allActiveMembers.reduce((s, m) => s + (Number(m.progress_pct) || 0), 0) /
                  allActiveMembers.length
              )
            : 0,
      },
      cohorts: cohortReports,
    })
  } catch (error) {
    console.error('Institution reports error:', error)
    return ApiErrors.internal()
  }
}
