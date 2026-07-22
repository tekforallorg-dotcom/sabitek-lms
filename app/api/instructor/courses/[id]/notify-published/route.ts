import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { notify } from '@/lib/notifications'
import { sendCourseInLibraryEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * After an institution instructor publishes, ping the institution admins
 * (bell + email) so the course gets attached to a program instead of
 * sitting unnoticed in the Course Library.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return ApiErrors.unauthorized()

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, title, status, instructor_id, institution_id, instructor:users!courses_instructor_id_fkey(full_name)')
      .eq('id', id)
      .single()

    if (!course || course.instructor_id !== user.id) return ApiErrors.notFound('Course not found')
    if (!course.institution_id || course.status !== 'published') {
      return apiSuccess({ notified: 0 })
    }

    const { data: admins } = await supabaseAdmin
      .from('institution_members')
      .select('user_id, user:users(email, full_name)')
      .eq('institution_id', course.institution_id)
      .eq('role', 'institution_admin')
      .eq('status', 'active')

    const instructor: any = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor
    const instructorName = instructor?.full_name || 'An instructor'

    let notified = 0
    for (const admin of admins || []) {
      const adminUser: any = Array.isArray(admin.user) ? admin.user[0] : admin.user
      notify(admin.user_id, {
        type: 'system',
        title: 'New course in your Library',
        body: `${instructorName} published "${course.title}". Add it to a program to run it with cohorts.`,
        href: '/institution/courses',
      })
      if (adminUser?.email) {
        sendCourseInLibraryEmail({
          to: adminUser.email,
          adminName: adminUser.full_name || 'there',
          instructorName,
          courseTitle: course.title,
        }).catch(() => {})
      }
      notified++
    }

    return apiSuccess({ notified })
  } catch (error) {
    console.error('notify-published error:', error)
    return ApiErrors.internal()
  }
}
