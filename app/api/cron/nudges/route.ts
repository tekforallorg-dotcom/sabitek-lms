import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendStreakReminderEmail, sendCohortReminderEmail, sendProgramCompletionEmail } from '@/lib/email'
import { computeProgramCourseStates } from '@/lib/access/program-sequence'

// Streaks are tracked in Africa/Lagos time (WAT, UTC+1) so "today" and
// "yesterday" must be derived in that zone, never from the server clock.
const STREAK_TIME_ZONE = 'Africa/Lagos'

// Never nudge more than this many learners in a single run; extra rows are
// logged and left for the next daily cron so one run stays bounded.
const MAX_PER_RUN = 200

// Format a Date as YYYY-MM-DD in the streak time zone.
function lagosDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STREAK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export async function GET(request: NextRequest) {
  // Fail closed: if CRON_SECRET is configured, require the matching bearer
  // token (Vercel Cron sends it automatically). If it is not set, reject.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const yesterday = lagosDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))

    // Genuinely-about-to-break streaks only: active (>= 3) and last studied
    // yesterday. Studied-today rows are already safe; older rows already broke.
    const { data: streaks, error: streaksError } = await supabaseAdmin
      .from('study_streaks')
      .select('user_id, current_streak, last_study_date')
      .gte('current_streak', 3)
      .eq('last_study_date', yesterday)

    if (streaksError) {
      console.error('nudges: failed to load streaks:', streaksError)
    // ── Section B: cohort re-engagement reminders (opt-in per cohort) ──
    let cohortReminded = 0
    try {
      const lagosDate = (offsetDays: number) => {
        const d = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000)
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(d)
      }
      const reminderDays = [lagosDate(3), lagosDate(7), lagosDate(14)]

      const { data: reminderCohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id, name')
        .eq('send_reminder_emails', true)
        .neq('status', 'archived')
      const rcIds = (reminderCohorts || []).map((c) => c.id)
      if (rcIds.length > 0) {
        const { data: members } = await supabaseAdmin
          .from('cohort_members')
          .select('user_id, cohort_id')
          .in('cohort_id', rcIds)
          .eq('status', 'active')
          .is('completed_at', null)
        const cohortName = new Map((reminderCohorts || []).map((c) => [c.id, c.name]))
        const seen = new Set<string>()
        for (const m of (members || []).slice(0, 300)) {
          if (seen.has(m.user_id)) continue
          seen.add(m.user_id)
          try {
            const { data: streak } = await supabaseAdmin
              .from('study_streaks')
              .select('last_study_date')
              .eq('user_id', m.user_id)
              .maybeSingle()
            if (!streak?.last_study_date || !reminderDays.includes(streak.last_study_date)) continue
            const { data: u } = await supabaseAdmin
              .from('users')
              .select('email, full_name')
              .eq('id', m.user_id)
              .single()
            if (!u?.email) continue
            const r = await sendCohortReminderEmail({
              to: u.email,
              firstName: (u.full_name || 'there').split(' ')[0],
              cohortName: cohortName.get(m.cohort_id) || 'your cohort',
            })
            if (r.success) cohortReminded++
          } catch {
            // per-member failures never stop the batch
          }
        }
      }
    } catch (e) {
      console.error('cohort reminders failed:', e)
    }

    // ── Section C: program completion detection (recent finishers) ──
    let completions = 0
    try {
      const { data: candidates } = await supabaseAdmin
        .from('cohort_members')
        .select('id, user_id, cohort_id, cohorts(program_id, programs(name, institutions(name)))')
        .eq('status', 'active')
        .is('completed_at', null)
        .limit(500)
      for (const c of candidates || []) {
        try {
          // Only check members who studied yesterday (fresh finishers)
          const { data: streak } = await supabaseAdmin
            .from('study_streaks')
            .select('last_study_date')
            .eq('user_id', c.user_id)
            .maybeSingle()
          if (streak?.last_study_date !== yesterday) continue

          const programId = (c as any).cohorts?.program_id
          if (!programId) continue
          const states = await computeProgramCourseStates(c.user_id, programId)
          if (states.size === 0) continue
          // Strict rule: every course in the program complete
          const entries = [...states.values()]
          if (!entries.every((s) => s.completed)) continue

          await supabaseAdmin
            .from('cohort_members')
            .update({
              completed_at: new Date().toISOString(),
              courses_completed: entries.filter((s) => s.completed).length,
            })
            .eq('id', c.id)
          completions++

          const { data: u } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', c.user_id)
            .single()
          if (u?.email) {
            sendProgramCompletionEmail({
              to: u.email,
              firstName: (u.full_name || 'there').split(' ')[0],
              programName: (c as any).cohorts?.programs?.name || 'your program',
              institutionName: (c as any).cohorts?.programs?.institutions?.name || null,
            }).then(() => {})
          }
        } catch {
          // continue with next candidate
        }
      }
    } catch (e) {
      console.error('completion detection failed:', e)
    }

      return NextResponse.json({ checked: 0, sent: 0, failed: 0 , cohort_reminded: cohortReminded, program_completions: completions })
    }

    const rows = streaks || []
    if (rows.length > MAX_PER_RUN) {
      console.log(
        `nudges: ${rows.length} eligible streaks, capping at ${MAX_PER_RUN} this run`
      )
    }
    const batch = rows.slice(0, MAX_PER_RUN)

    let sent = 0
    let failed = 0

    // Sequential so a single failure never aborts the batch.
    for (const streak of batch) {
      try {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('email, full_name')
          .eq('id', streak.user_id)
          .maybeSingle()

        if (userError) {
          console.error(`nudges: failed to load user ${streak.user_id}:`, userError)
          failed++
          continue
        }

        const email = user?.email?.trim()
        if (!email) {
          // No email on file, nothing to send. Not a failure.
          continue
        }

        const firstName = (user?.full_name || '').trim().split(/\s+/)[0] || 'there'

        const result = await sendStreakReminderEmail({
          to: email,
          firstName,
          streakDays: streak.current_streak,
        })

        if (result.success) {
          sent++
        } else {
          console.error(`nudges: send failed for ${streak.user_id}:`, result.error)
          failed++
        }
      } catch (err) {
        console.error(`nudges: unexpected error for ${streak.user_id}:`, err)
        failed++
      }
    }

    return NextResponse.json({ checked: batch.length, sent, failed })
  } catch (error) {
    // Never surface a 500 for partial failures; report what we can.
    console.error('nudges: unexpected error:', error)
    return NextResponse.json({ checked: 0, sent: 0, failed: 0 })
  }
}
