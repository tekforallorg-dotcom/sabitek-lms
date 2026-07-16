import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendCourseAnnouncementEmail } from '@/lib/email'
import { notify } from '@/lib/notifications'

/**
 * Instructor announcement: one message to every enrolled learner of a
 * course, sent from the platform with reply-to set to the instructor.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    const body = await request.json()
    const { courseId, message } = body as { courseId?: string; message?: string }
    if (!courseId || !message?.trim()) {
      return NextResponse.json({ error: 'courseId and message are required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Keep announcements under 2000 characters' }, { status: 400 })
    }

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .single()
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (course.instructor_id !== userId) {
      return NextResponse.json({ error: 'Not your course' }, { status: 403 })
    }

    const [{ data: instructor }, { data: enrollments }] = await Promise.all([
      supabaseAdmin.from('users').select('full_name, email').eq('id', userId).single(),
      supabaseAdmin
        .from('course_enrollments')
        .select('users(id, email, full_name)')
        .eq('course_id', courseId)
        .limit(500),
    ])

    const recipients = (enrollments || [])
      .map((e: any) => e.users)
      .filter((u: any) => u?.email)

    // In-app copies alongside the emails
    for (const e of enrollments || []) {
      const uid = (e as any).users?.id
      if (uid) {
        notify(uid, {
          type: 'announcement',
          title: `Announcement: ${course.title}`,
          body: message.trim().slice(0, 140),
          href: '/dashboard',
        })
      }
    }
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No enrolled learners to notify yet' }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    for (const r of recipients) {
      try {
        const res = await sendCourseAnnouncementEmail({
          to: r.email,
          firstName: (r.full_name || 'there').split(' ')[0],
          courseTitle: course.title,
          instructorName: instructor?.full_name || 'Your instructor',
          message: message.trim(),
          replyTo: instructor?.email || undefined,
        })
        if (res.success) sent++
        else failed++
      } catch {
        failed++
      }
    }

    return NextResponse.json({ sent, failed, total: recipients.length })
  } catch (error) {
    console.error('announce error:', error)
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 })
  }
}
