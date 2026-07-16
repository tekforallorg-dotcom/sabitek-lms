import { supabaseAdmin } from '@/lib/supabase-admin'

export interface CourseState {
  completed: boolean
  locked: boolean
  blockingCourseId: string | null
}

/**
 * Program-level sequencing (the dormant unlock_rules column, now live).
 *
 * Semantics: within a program, a course is LOCKED while any earlier
 * (lower position) REQUIRED course is incomplete - unless the locked
 * course's own unlock_rules.sequential === false (explicit opt-out).
 * Optional courses (is_required=false) never block later ones.
 * Completion = every lesson of the course completed by the user.
 */
export async function computeProgramCourseStates(
  userId: string,
  programId: string
): Promise<Map<string, CourseState>> {
  const states = new Map<string, CourseState>()
  try {
    const { data: rows } = await supabaseAdmin
      .from('program_courses')
      .select('course_id, position, is_required, unlock_rules')
      .eq('program_id', programId)
      .order('position', { ascending: true })
    const ordered = rows || []
    if (ordered.length === 0) return states

    const courseIds = ordered.map((r) => r.course_id)
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, course_id')
      .in('course_id', courseIds)
    const lessonsByCourse = new Map<string, string[]>()
    for (const l of lessons || []) {
      const list = lessonsByCourse.get(l.course_id) || []
      list.push(l.id)
      lessonsByCourse.set(l.course_id, list)
    }

    const allLessonIds = (lessons || []).map((l) => l.id)
    const completedLessonIds = new Set<string>()
    if (allLessonIds.length > 0) {
      const { data: progress } = await supabaseAdmin
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .in('lesson_id', allLessonIds)
      for (const p of progress || []) completedLessonIds.add(p.lesson_id)
    }

    const isCourseComplete = (courseId: string) => {
      const ids = lessonsByCourse.get(courseId) || []
      // A course with no lessons can't block anyone
      return ids.length === 0 || ids.every((id) => completedLessonIds.has(id))
    }

    let blockingSoFar: string | null = null
    for (const row of ordered) {
      const completed = isCourseComplete(row.course_id)
      const optsOut = (row.unlock_rules as any)?.sequential === false
      const locked = !completed && !optsOut && blockingSoFar !== null
      states.set(row.course_id, {
        completed,
        locked,
        blockingCourseId: locked ? blockingSoFar : null,
      })
      // Only incomplete REQUIRED courses gate what comes after them
      if (row.is_required && !completed && blockingSoFar === null) {
        blockingSoFar = row.course_id
      }
    }
  } catch (e) {
    console.error('program sequence error:', e)
  }
  return states
}

/**
 * Lock check for a single course across all the user's active cohorts.
 * The course is locked only if EVERY covering program locks it (any
 * cohort path that has it unlocked grants access).
 */
export async function getProgramLockForCourse(
  userId: string,
  courseId: string
): Promise<{ locked: boolean; blocking: { id: string; title: string; slug: string } | null }> {
  try {
    const { data: myCohorts } = await supabaseAdmin
      .from('cohort_members')
      .select('cohort_id')
      .eq('user_id', userId)
      .eq('status', 'active')
    const cohortIds = (myCohorts || []).map((c) => c.cohort_id)
    if (cohortIds.length === 0) return { locked: false, blocking: null }

    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('program_id')
      .in('id', cohortIds)
    const programIds = [...new Set((cohorts || []).map((c) => c.program_id).filter(Boolean))]
    if (programIds.length === 0) return { locked: false, blocking: null }

    const { data: covering } = await supabaseAdmin
      .from('program_courses')
      .select('program_id')
      .in('program_id', programIds)
      .eq('course_id', courseId)
    const coveringPrograms = [...new Set((covering || []).map((c) => c.program_id))]
    if (coveringPrograms.length === 0) return { locked: false, blocking: null }

    let firstBlocking: string | null = null
    for (const pid of coveringPrograms) {
      const states = await computeProgramCourseStates(userId, pid)
      const st = states.get(courseId)
      if (!st?.locked) return { locked: false, blocking: null }
      firstBlocking = firstBlocking || st.blockingCourseId
    }

    if (!firstBlocking) return { locked: false, blocking: null }
    const { data: blockingCourse } = await supabaseAdmin
      .from('courses')
      .select('id, title, slug')
      .eq('id', firstBlocking)
      .single()
    return {
      locked: true,
      blocking: blockingCourse
        ? { id: blockingCourse.id, title: blockingCourse.title, slug: blockingCourse.slug }
        : null,
    }
  } catch {
    // Fail open on errors: never lock a learner out by accident
    return { locked: false, blocking: null }
  }
}
