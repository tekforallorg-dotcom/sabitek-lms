import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendStreakReminderEmail } from '@/lib/email'

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
      return NextResponse.json({ checked: 0, sent: 0, failed: 0 })
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
