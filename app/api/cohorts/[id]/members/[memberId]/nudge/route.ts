import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireInstitutionAdmin } from '@/lib/api-auth'
import { sendCohortReminderEmail } from '@/lib/email'

/** Manual re-engagement nudge for one cohort member (admin action). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: cohortId, memberId } = await params

    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, program_id, programs(institution_id)')
      .eq('id', cohortId)
      .single()
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    const institutionId = (cohort as any).programs?.institution_id
    if (!institutionId) return NextResponse.json({ error: 'Cohort has no institution' }, { status: 400 })

    const auth = await requireInstitutionAdmin(request, institutionId)
    if ('error' in auth) return auth.error

    const { data: member } = await supabaseAdmin
      .from('cohort_members')
      .select('id, user_id, users(email, full_name)')
      .eq('id', memberId)
      .eq('cohort_id', cohortId)
      .single()
    const user = (member as any)?.users
    if (!user?.email) return NextResponse.json({ error: 'Member has no email' }, { status: 400 })

    const result = await sendCohortReminderEmail({
      to: user.email,
      firstName: (user.full_name || 'there').split(' ')[0],
      cohortName: cohort.name,
    })
    if (!result.success) {
      return NextResponse.json({ error: 'Email failed to send' }, { status: 500 })
    }
    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('nudge error:', error)
    return NextResponse.json({ error: 'Failed to send nudge' }, { status: 500 })
  }
}
