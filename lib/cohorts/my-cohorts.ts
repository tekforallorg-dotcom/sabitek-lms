import { supabaseAdmin } from '@/lib/supabase-admin'
import { computeProgramCourseStates } from '@/lib/access/program-sequence'

/**
 * Assemble the current user's cohort enrollments with program + course
 * details and program-sequence lock/complete states.
 *
 * Shared by /api/cohorts/my-cohorts and the consolidated learner
 * dashboard loader so the two never drift.
 */
export async function getMyCohortsForUser(userId: string) {
  // Step 1: Get user's active cohort memberships
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('cohort_members')
    .select('cohort_id, status, joined_at, sponsorship')
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    .order('joined_at', { ascending: false })

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError)
    throw new Error('Failed to fetch your cohorts')
  }

  if (!memberships || memberships.length === 0) {
    return []
  }

  const cohortIds = memberships.map((m) => m.cohort_id)

  // Step 2: Get cohort details with program info
  const { data: cohorts, error: cohortsError } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, status, program_id, start_date, end_date')
    .in('id', cohortIds)

  if (cohortsError || !cohorts) {
    console.error('Error fetching cohorts:', cohortsError)
    throw new Error('Failed to fetch cohort details')
  }

  const programIds = [...new Set(cohorts.map((c) => c.program_id))]

  // Step 3: Get program details
  const { data: programs, error: programsError } = await supabaseAdmin
    .from('programs')
    .select('id, name, description, status')
    .in('id', programIds)

  if (programsError) {
    console.error('Error fetching programs:', programsError)
  }

  const programsMap = new Map((programs || []).map((p) => [p.id, p]))

  // Step 4: Get program courses
  const { data: programCourses, error: pcError } = await supabaseAdmin
    .from('program_courses')
    .select('program_id, course_id, is_required, position')
    .in('program_id', programIds)
    .order('position', { ascending: true })

  if (pcError) {
    console.error('Error fetching program courses:', pcError)
  }

  // Step 5: Get course details
  const courseIds = [...new Set((programCourses || []).map((pc) => pc.course_id))]
  let coursesMap = new Map<string, any>()

  if (courseIds.length > 0) {
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, title, slug, cover_image_url, status')
      .in('id', courseIds)

    if (courses) {
      coursesMap = new Map(courses.map((c) => [c.id, c]))
    }
  }

  // Step 6: Get user's enrollment progress for these courses
  let enrollmentsMap = new Map<string, number>()

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabaseAdmin
      .from('course_enrollments')
      .select('course_id, progress_percentage')
      .eq('user_id', userId)
      .in('course_id', courseIds)

    if (enrollments) {
      enrollmentsMap = new Map(
        enrollments.map((e) => [e.course_id, e.progress_percentage || 0])
      )
    }
  }

  // Step 7: Assemble response (with program sequence states)
  const uniqueProgramIds = [...new Set(cohorts.map((c) => c.program_id).filter(Boolean))]
  const stateByProgram = new Map<string, Awaited<ReturnType<typeof computeProgramCourseStates>>>()
  for (const pid of uniqueProgramIds) {
    stateByProgram.set(pid, await computeProgramCourseStates(userId, pid))
  }

  return cohorts.map((cohort) => {
    const membership = memberships.find((m) => m.cohort_id === cohort.id)
    const program = programsMap.get(cohort.program_id)
    const courses = (programCourses || [])
      .filter((pc) => pc.program_id === cohort.program_id)
      .map((pc) => {
        const course = coursesMap.get(pc.course_id)
        const seq = stateByProgram.get(cohort.program_id)?.get(pc.course_id)
        return course
          ? {
              id: course.id,
              title: course.title,
              slug: course.slug,
              cover_image_url: course.cover_image_url,
              required: pc.is_required,
              progress: enrollmentsMap.get(course.id) || 0,
              completed: seq?.completed ?? false,
              locked: seq?.locked ?? false,
            }
          : null
      })
      .filter(Boolean)

    // Calculate overall progress
    const totalProgress = courses.reduce(
      (sum: number, c: any) => sum + (c?.progress || 0),
      0
    )
    const avgProgress = courses.length > 0 ? Math.round(totalProgress / courses.length) : 0

    return {
      cohort_id: cohort.id,
      cohort_name: cohort.name,
      cohort_status: cohort.status,
      start_date: cohort.start_date,
      end_date: cohort.end_date,
      membership_status: membership?.status || 'active',
      sponsorship: membership?.sponsorship || 'institution_sponsored',
      joined_at: membership?.joined_at,
      program: program
        ? {
            id: program.id,
            name: program.name,
            description: program.description,
          }
        : null,
      courses,
      progress: avgProgress,
      total_courses: courses.length,
      completed_courses: courses.filter((c: any) => c?.progress === 100).length,
    }
  })
}
