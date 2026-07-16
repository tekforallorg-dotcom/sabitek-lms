import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Step {
  key: string
  label: string
  description: string
  href: string
  done: boolean
}

/**
 * Persona onboarding checklists ("2/5 done"), computed entirely from live
 * rows - steps check themselves off as the user actually does the thing.
 * ?persona=learner|instructor|institution (the dashboard passing it knows
 * which surface it is).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id
    const persona = new URL(request.url).searchParams.get('persona') || 'learner'

    let steps: Step[] = []

    if (persona === 'learner') {
      const [profileRes, enrollRes, cohortRes, progressRes, quizRes, streakRes] = await Promise.all([
        supabaseAdmin.from('users').select('full_name').eq('id', userId).single(),
        supabaseAdmin.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabaseAdmin.from('cohort_members').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
        supabaseAdmin.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).not('completed_at', 'is', null),
        supabaseAdmin.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('passed', true),
        supabaseAdmin.from('study_streaks').select('user_id').eq('user_id', userId).maybeSingle(),
      ])
      steps = [
        {
          key: 'profile',
          label: 'Set up your profile',
          description: 'Tell us who you are',
          href: '/profile',
          done: !!profileRes.data?.full_name?.trim(),
        },
        {
          key: 'join_course',
          label: 'Join your first course',
          description: 'Browse the catalog or join your cohort',
          href: '/courses',
          done: (enrollRes.count ?? 0) > 0 || (cohortRes.count ?? 0) > 0,
        },
        {
          key: 'first_lesson',
          label: 'Complete your first lesson',
          description: 'Small steps, real progress',
          href: '/dashboard',
          done: (progressRes.count ?? 0) > 0,
        },
        {
          key: 'first_quiz',
          label: 'Pass your first quiz',
          description: 'Prove what you learned',
          href: '/dashboard',
          done: (quizRes.count ?? 0) > 0,
        },
        {
          key: 'meet_sabibot',
          label: 'Meet SabiBot',
          description: 'Your AI tutor, in your language',
          href: '/sabibot/chat',
          done: !!streakRes.data,
        },
      ]
    } else if (persona === 'instructor') {
      const { data: myCourses } = await supabaseAdmin
        .from('courses')
        .select('id, status')
        .eq('instructor_id', userId)
      const courseIds = (myCourses || []).map((c) => c.id)
      const [lessonsRes, enrollRes] = await Promise.all([
        courseIds.length > 0
          ? supabaseAdmin.from('lessons').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
          : Promise.resolve({ count: 0 } as any),
        courseIds.length > 0
          ? supabaseAdmin.from('course_enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
          : Promise.resolve({ count: 0 } as any),
      ])
      let quizCount = 0
      if (courseIds.length > 0) {
        const { data: lessonRows } = await supabaseAdmin.from('lessons').select('id').in('course_id', courseIds)
        const lessonIds = (lessonRows || []).map((l) => l.id)
        if (lessonIds.length > 0) {
          const { count } = await supabaseAdmin
            .from('quizzes')
            .select('id', { count: 'exact', head: true })
            .in('lesson_id', lessonIds)
          quizCount = count ?? 0
        }
      }
      steps = [
        {
          key: 'create_course',
          label: 'Create your first course',
          description: 'Title, description, cover - 5 minutes',
          href: '/instructor/courses/create',
          done: (myCourses || []).length > 0,
        },
        {
          key: 'add_lessons',
          label: 'Add your lessons',
          description: 'Text, video, or slides',
          href: '/instructor',
          done: (lessonsRes.count ?? 0) > 0,
        },
        {
          key: 'add_quiz',
          label: 'Add a quiz',
          description: 'Checkpoints keep learners honest',
          href: '/instructor',
          done: quizCount > 0,
        },
        {
          key: 'publish',
          label: 'Publish your course',
          description: 'Go live when you are ready',
          href: '/instructor',
          done: (myCourses || []).some((c) => c.status === 'published'),
        },
        {
          key: 'first_learner',
          label: 'Get your first learner',
          description: 'Share your course or join a cohort program',
          href: '/instructor',
          done: (enrollRes.count ?? 0) > 0,
        },
      ]
    } else if (persona === 'institution') {
      const { data: membership } = await supabaseAdmin
        .from('institution_members')
        .select('institution_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      const instId = membership?.institution_id
      if (!instId) {
        return NextResponse.json({ steps: [], completed: 0, total: 0 })
      }
      const [instRes, membersRes, invitesRes, programsRes] = await Promise.all([
        supabaseAdmin.from('institutions').select('logo_url').eq('id', instId).single(),
        supabaseAdmin.from('institution_members').select('id', { count: 'exact', head: true }).eq('institution_id', instId),
        supabaseAdmin.from('institution_invites').select('id', { count: 'exact', head: true }).eq('institution_id', instId),
        supabaseAdmin.from('programs').select('id').eq('institution_id', instId),
      ])
      const programIds = (programsRes.data || []).map((p) => p.id)
      const [attachRes, cohortRes2] = await Promise.all([
        programIds.length > 0
          ? supabaseAdmin.from('program_courses').select('id', { count: 'exact', head: true }).in('program_id', programIds)
          : Promise.resolve({ count: 0 } as any),
        programIds.length > 0
          ? supabaseAdmin.from('cohorts').select('id', { count: 'exact', head: true }).in('program_id', programIds)
          : Promise.resolve({ count: 0 } as any),
      ])
      steps = [
        {
          key: 'brand',
          label: 'Brand your workspace',
          description: 'Add your logo - it appears on your cohort pages',
          href: '/institution/settings',
          done: !!instRes.data?.logo_url,
        },
        {
          key: 'invite_team',
          label: 'Invite your team',
          description: 'Instructors author, program managers organize',
          href: '/institution/dashboard',
          done: (membersRes.count ?? 0) > 1 || (invitesRes.count ?? 0) > 0,
        },
        {
          key: 'create_program',
          label: 'Create a program',
          description: 'The container your cohorts will run through',
          href: '/institution/programs',
          done: programIds.length > 0,
        },
        {
          key: 'attach_courses',
          label: 'Add courses to your program',
          description: 'From your Course Library',
          href: '/institution/courses',
          done: (attachRes.count ?? 0) > 0,
        },
        {
          key: 'launch_cohort',
          label: 'Launch your first cohort',
          description: 'Get your shareable join link',
          href: '/institution/cohorts',
          done: (cohortRes2.count ?? 0) > 0,
        },
      ]
    }

    const completed = steps.filter((s) => s.done).length
    return NextResponse.json({ steps, completed, total: steps.length })
  } catch (error) {
    console.error('onboarding checklist error:', error)
    return NextResponse.json({ error: 'Failed to load checklist' }, { status: 500 })
  }
}
