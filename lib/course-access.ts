import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Course access types in priority order:
 * - free: Course is free (is_free=true or price=0)
 * - purchased: User has a successful purchase record
 * - cohort_sponsored: User is in an active cohort whose program includes this course
 * - none: No access
 */
export type CourseAccessType = 'free' | 'purchased' | 'cohort_sponsored' | 'none'

export interface CourseAccessResult {
  hasAccess: boolean
  accessType: CourseAccessType
  /** Cohort details if access is via cohort */
  cohort?: {
    id: string
    name: string
    programId: string
    programName: string
  }
}

interface CourseBasicInfo {
  id: string
  is_free: boolean | null
  price: number | null
}

/**
 * Check if a user has access to a course.
 * 
 * Access is granted if ANY of the following is true:
 * 1. Course is free (is_free=true or price=0 or price=null)
 * 2. User has purchased the course (course_purchases.status='successful')
 * 3. User is in an active cohort whose program includes this course
 * 
 * @param supabaseAdmin - Supabase client with service role (bypasses RLS)
 * @param userId - User ID to check access for
 * @param courseId - Course ID to check access to
 * @returns Access result with type and optional cohort info
 */
export async function checkCourseAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
  courseId: string
): Promise<CourseAccessResult> {
  // 1. Fetch course basic info
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, is_free, price')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    console.error('Course not found for access check:', courseId)
    return { hasAccess: false, accessType: 'none' }
  }

  // 2. Check if course is free
  if (isCourseEffectivelyFree(course)) {
    return { hasAccess: true, accessType: 'free' }
  }

  // 3. Check if user has purchased the course
  const { data: purchase } = await supabaseAdmin
    .from('course_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'successful')
    .maybeSingle()

  if (purchase) {
    return { hasAccess: true, accessType: 'purchased' }
  }

  // 4. Check cohort-sponsored access
  const cohortAccess = await checkCohortAccess(supabaseAdmin, userId, courseId)
  if (cohortAccess) {
    return {
      hasAccess: true,
      accessType: 'cohort_sponsored',
      cohort: cohortAccess,
    }
  }

  // No access
  return { hasAccess: false, accessType: 'none' }
}

/**
 * Check if user is in an active cohort whose program includes this course.
 * 
 * Query logic:
 * 1. Find cohort_members where user_id = X and status IN ('active', 'completed')
 * 2. Join to cohorts where status = 'active'
 * 3. Join to programs via cohorts.program_id
 * 4. Join to program_courses where course_id = Y
 * 5. If any row exists, user has cohort-sponsored access
 */
async function checkCohortAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
  courseId: string
): Promise<{ id: string; name: string; programId: string; programName: string } | null> {
  // Query: Find active cohort memberships where the program includes this course
  //
  // SQL equivalent:
  // SELECT cm.cohort_id, c.name, c.program_id, p.name
  // FROM cohort_members cm
  // JOIN cohorts c ON cm.cohort_id = c.id
  // JOIN programs p ON c.program_id = p.id
  // JOIN program_courses pc ON p.id = pc.program_id
  // WHERE cm.user_id = $userId
  //   AND cm.status IN ('active', 'completed')
  //   AND c.status = 'active'
  //   AND pc.course_id = $courseId
  // LIMIT 1

  // Supabase doesn't support complex multi-join in a single query well,
  // so we'll do it in steps for clarity and reliability.

  // Step 1: Get user's active cohort memberships
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('cohort_members')
    .select('cohort_id')
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])

  if (membershipError || !memberships || memberships.length === 0) {
    return null
  }

  const cohortIds = memberships.map((m) => m.cohort_id)

  // Step 2: Get active cohorts from user's memberships
  const { data: cohorts, error: cohortsError } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, program_id')
    .in('id', cohortIds)
    .eq('status', 'active')

  if (cohortsError || !cohorts || cohorts.length === 0) {
    return null
  }

  const programIds = [...new Set(cohorts.map((c) => c.program_id))]

  // Step 3: Check if any of these programs include the target course
  const { data: programCourses, error: pcError } = await supabaseAdmin
    .from('program_courses')
    .select('program_id')
    .in('program_id', programIds)
    .eq('course_id', courseId)

  if (pcError || !programCourses || programCourses.length === 0) {
    return null
  }

  // Found a match - get the first matching cohort + program details
  const matchingProgramId = programCourses[0].program_id
  const matchingCohort = cohorts.find((c) => c.program_id === matchingProgramId)

  if (!matchingCohort) {
    return null
  }

  // Get program name
  const { data: program } = await supabaseAdmin
    .from('programs')
    .select('name')
    .eq('id', matchingProgramId)
    .single()

  return {
    id: matchingCohort.id,
    name: matchingCohort.name,
    programId: matchingProgramId,
    programName: program?.name || 'Unknown Program',
  }
}

/**
 * Check if a course is effectively free.
 */
function isCourseEffectivelyFree(course: CourseBasicInfo): boolean {
  return course.is_free === true || course.price === 0 || course.price === null
}

/**
 * Bulk check course access for multiple courses.
 * Useful for course listings where we need to show access status.
 */
export async function checkBulkCourseAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
  courseIds: string[]
): Promise<Map<string, CourseAccessResult>> {
  const results = new Map<string, CourseAccessResult>()

  // For efficiency, we could optimize this with batch queries
  // For now, sequential checks (acceptable for small lists)
  for (const courseId of courseIds) {
    const result = await checkCourseAccess(supabaseAdmin, userId, courseId)
    results.set(courseId, result)
  }

  return results
}