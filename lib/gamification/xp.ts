import { supabaseAdmin } from '@/lib/supabase-admin'

export const XP_VALUES = {
  lesson_complete: 20,
  quiz_pass: 30,
  quiz_perfect: 20, // bonus on top of quiz_pass
} as const

/**
 * Derive XP events from REAL platform rows (completions and passed
 * attempts) and upsert them idempotently, stamping each event with the
 * source row's own timestamp so weekly windows stay truthful even on
 * backfill. Best-effort: failures never block the caller.
 */
export async function syncXpForUser(userId: string): Promise<void> {
  try {
    const [progressRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from('user_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),
      supabaseAdmin
        .from('quiz_attempts')
        .select('lesson_id, score_percentage, completed_at, created_at')
        .eq('user_id', userId)
        .eq('passed', true)
        .not('lesson_id', 'is', null),
    ])

    const events: Array<{ user_id: string; source: string; points: number; ref_id: string; created_at: string }> = []

    for (const p of progressRes.data || []) {
      events.push({
        user_id: userId,
        source: 'lesson_complete',
        points: XP_VALUES.lesson_complete,
        ref_id: p.lesson_id,
        created_at: p.completed_at,
      })
    }

    // One pass + one perfect max per lesson (dedupe retakes by lesson)
    const seenPass = new Set<string>()
    const seenPerfect = new Set<string>()
    for (const a of attemptsRes.data || []) {
      const at = a.completed_at || a.created_at || new Date().toISOString()
      if (!seenPass.has(a.lesson_id)) {
        seenPass.add(a.lesson_id)
        events.push({
          user_id: userId,
          source: 'quiz_pass',
          points: XP_VALUES.quiz_pass,
          ref_id: a.lesson_id,
          created_at: at,
        })
      }
      if (a.score_percentage === 100 && !seenPerfect.has(a.lesson_id)) {
        seenPerfect.add(a.lesson_id)
        events.push({
          user_id: userId,
          source: 'quiz_perfect',
          points: XP_VALUES.quiz_perfect,
          ref_id: a.lesson_id,
          created_at: at,
        })
      }
    }

    if (events.length > 0) {
      const { error } = await supabaseAdmin
        .from('xp_events')
        .upsert(events, { onConflict: 'user_id,source,ref_id', ignoreDuplicates: true })
      if (error) console.log('xp sync skipped:', error.message)
    }
  } catch (e) {
    console.log('xp sync failed (non-blocking)')
  }
}

/** Monday 00:00 of the current week (local server time). */
export function weekStart(): Date {
  const now = new Date()
  const day = now.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}
