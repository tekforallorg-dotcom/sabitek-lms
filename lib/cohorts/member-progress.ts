import { supabaseAdmin } from '@/lib/supabase-admin'
import { memberKey, programProgress } from '@/lib/cohorts/program-progress'

export { memberKey, programProgress }

/**
 * How far each cohort member is through their cohort's program.
 *
 * Reports and cohort pages used to read `cohort_members.progress_pct`, a
 * column nothing writes, so every learner showed 0%. Progress is recorded on
 * `course_enrollments.progress_percentage` when a learner completes a lesson,
 * so this derives the figure from there: the average over the program's
 * courses, counting a course the learner has not started as 0.
 */

/**
 * Progress for every (cohort, member) pair given, keyed by `memberKey`.
 * Two queries regardless of how many cohorts or members there are.
 */
export async function loadCohortMemberProgress(
  cohorts: { id: string; program_id: string | null }[],
  members: { cohort_id: string; user_id: string | null }[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  const programIds = [...new Set(cohorts.map((c) => c.program_id).filter((id): id is string => !!id))]
  const userIds = [...new Set(members.map((m) => m.user_id).filter((id): id is string => !!id))]
  if (programIds.length === 0 || userIds.length === 0) return result

  const { data: programCourses } = await supabaseAdmin
    .from('program_courses')
    .select('program_id, course_id')
    .in('program_id', programIds)

  const coursesByProgram = new Map<string, string[]>()
  for (const row of programCourses || []) {
    if (!row.program_id || !row.course_id) continue
    const list = coursesByProgram.get(row.program_id) || []
    list.push(row.course_id)
    coursesByProgram.set(row.program_id, list)
  }
  const courseIds = [...new Set((programCourses || []).map((r) => r.course_id).filter((id): id is string => !!id))]
  if (courseIds.length === 0) return result

  const { data: enrolments } = await supabaseAdmin
    .from('course_enrollments')
    .select('user_id, course_id, progress_percentage')
    .in('user_id', userIds)
    .in('course_id', courseIds)

  const progressByUser = new Map<string, Map<string, number>>()
  for (const row of enrolments || []) {
    if (!row.user_id || !row.course_id) continue
    const byCourse = progressByUser.get(row.user_id) || new Map<string, number>()
    byCourse.set(row.course_id, Number(row.progress_percentage) || 0)
    progressByUser.set(row.user_id, byCourse)
  }

  const programByCohort = new Map(cohorts.map((c) => [c.id, c.program_id]))
  for (const member of members) {
    if (!member.user_id) continue
    const programId = programByCohort.get(member.cohort_id)
    const programCourseIds = programId ? coursesByProgram.get(programId) || [] : []
    result.set(
      memberKey(member.cohort_id, member.user_id),
      programProgress(programCourseIds, progressByUser.get(member.user_id) || new Map())
    )
  }
  return result
}
