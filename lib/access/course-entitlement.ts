import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * May this person do graded work in the course (take a quiz, earn the
 * certificate)?
 *
 * Yes for the course's instructor, a super admin, and anyone with an
 * enrolment row. Enrolling is itself gated by the database
 * (`can_self_enroll`: free course, successful purchase, or cohort cover), so
 * an enrolment row is the proof that the learner was allowed in.
 *
 * This mirrors the lesson page, which shows "Enrollment Required" to anyone
 * else. Without this check a signed-in person who never enrolled could call
 * the grading and certificate routes directly.
 */
export async function canDoCourseWork(userId: string, courseId: string): Promise<boolean> {
  try {
    const [courseRes, enrolmentRes, adminRes] = await Promise.all([
      supabaseAdmin.from('courses').select('instructor_id').eq('id', courseId).maybeSingle(),
      supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .limit(1),
      supabaseAdmin.from('users').select('is_super_admin').eq('id', userId).maybeSingle(),
    ])

    if (!courseRes.data) return false
    if (courseRes.data.instructor_id === userId) return true
    if (adminRes.data?.is_super_admin === true) return true
    return (enrolmentRes.data || []).length > 0
  } catch {
    // Fail closed: graded work and certificates are not handed out on an error.
    return false
  }
}
