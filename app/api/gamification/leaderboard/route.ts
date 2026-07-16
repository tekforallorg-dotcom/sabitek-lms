import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncXpForUser, weekStart } from '@/lib/gamification/xp'

/**
 * Weekly leaderboard. Scoped to the learner's cohort when they belong to
 * one (classmates you know beat strangers), otherwise the global Sabitek
 * league. XP derives exclusively from service-written xp_events.
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

    // Make sure the caller's own XP is current before ranking
    await syncXpForUser(userId)

    // Cohort scope, if any
    let scope: 'cohort' | 'global' = 'global'
    let scopeName = 'Sabitek league'
    let memberIds: string[] | null = null
    try {
      const { data: membership } = await supabaseAdmin
        .from('cohort_members')
        .select('cohort_id, cohorts(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      if (membership?.cohort_id) {
        const { data: peers } = await supabaseAdmin
          .from('cohort_members')
          .select('user_id')
          .eq('cohort_id', membership.cohort_id)
          .eq('status', 'active')
        if (peers && peers.length > 1) {
          scope = 'cohort'
          scopeName = (membership as any).cohorts?.name || 'Your cohort'
          memberIds = peers.map((p) => p.user_id)
        }
      }
    } catch {
      // Cohort tables unavailable -> global league
    }

    const since = weekStart().toISOString()
    let query = supabaseAdmin
      .from('xp_events')
      .select('user_id, points')
      .gte('created_at', since)
    if (memberIds) query = query.in('user_id', memberIds)
    const { data: events, error: xpError } = await query
    if (xpError) {
      // xp_events not provisioned yet: return an empty board, not an error
      return NextResponse.json({ scope, scope_name: scopeName, entries: [], me: { rank: null, xp: 0 } })
    }

    const totals = new Map<string, number>()
    for (const e of events || []) {
      totals.set(e.user_id, (totals.get(e.user_id) || 0) + e.points)
    }
    if (!totals.has(userId)) totals.set(userId, 0)

    const ranked = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([uid, xp], i) => ({ user_id: uid, xp, rank: i + 1 }))

    const top = ranked.slice(0, 10)
    const meEntry = ranked.find((r) => r.user_id === userId) || { user_id: userId, xp: 0, rank: null as number | null }

    // Names for the visible rows only
    const nameIds = [...new Set([...top.map((t) => t.user_id), userId])]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', nameIds)
    const names = new Map((users || []).map((u) => [u.id, u.full_name as string]))

    const firstNameOf = (uid: string) => {
      const n = names.get(uid) || 'Learner'
      // First name + last initial: recognizable to classmates, light on privacy
      const parts = n.trim().split(/\s+/)
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
    }

    return NextResponse.json({
      scope,
      scope_name: scopeName,
      week_start: since,
      entries: top.map((t) => ({
        rank: t.rank,
        name: firstNameOf(t.user_id),
        xp: t.xp,
        is_me: t.user_id === userId,
      })),
      me: { rank: meEntry.rank, xp: meEntry.xp },
    })
  } catch (error) {
    console.error('leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
