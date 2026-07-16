import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Tenancy gate for service-role endpoints (which bypass RLS).
 *
 * Public courses (institution_id null) are open to any authenticated user.
 * Proprietary courses are visible only to: the course's instructor, super
 * admins, active members of the owning institution, and learners whose
 * ACTIVE cohort membership covers the course via program_courses.
 */
export async function canAccessCourseContent(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, institution_id, instructor_id')
      .eq('id', courseId)
      .single()
    if (!course) return false
    if (!course.institution_id) return true
    if (course.instructor_id === userId) return true

    const [adminRes, memberRes, myCohortsRes] = await Promise.all([
      supabaseAdmin.from('users').select('is_super_admin').eq('id', userId).single(),
      supabaseAdmin
        .from('institution_members')
        .select('id')
        .eq('user_id', userId)
        .eq('institution_id', course.institution_id)
        .eq('status', 'active')
        .limit(1),
      supabaseAdmin
        .from('cohort_members')
        .select('cohort_id')
        .eq('user_id', userId)
        .eq('status', 'active'),
    ])

    if (adminRes.data?.is_super_admin) return true
    if ((memberRes.data || []).length > 0) return true

    // Cohort coverage: any active cohort whose program includes this course
    const cohortIds = (myCohortsRes.data || []).map((c) => c.cohort_id)
    if (cohortIds.length === 0) return false
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('program_id')
      .in('id', cohortIds)
    const programIds = [...new Set((cohorts || []).map((c) => c.program_id).filter(Boolean))]
    if (programIds.length === 0) return false
    const { data: pc } = await supabaseAdmin
      .from('program_courses')
      .select('id')
      .in('program_id', programIds)
      .eq('course_id', courseId)
      .limit(1)
    return (pc || []).length > 0
  } catch {
    // Fail closed for proprietary content
    return false
  }
}
