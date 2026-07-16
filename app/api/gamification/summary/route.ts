import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncXpForUser, weekStart } from '@/lib/gamification/xp'
import { notify } from '@/lib/notifications'

interface BadgeDef {
  key: string
  name: string
  description: string
  hint: string
  earned: (ctx: Ctx) => boolean
}

interface Ctx {
  lessons: number
  quizzes: number
  perfects: number
  certificates: number
  longestStreak: number
}

// Badges are computed from real platform data and lazily persisted into
// learning_milestones the first time they are observed as earned.
const BADGES: BadgeDef[] = [
  { key: 'first_lesson', name: 'First Steps', description: 'Completed your first lesson', hint: 'Complete 1 lesson', earned: (c) => c.lessons >= 1 },
  { key: 'lessons_5', name: 'Getting Serious', description: 'Completed 5 lessons', hint: 'Complete 5 lessons', earned: (c) => c.lessons >= 5 },
  { key: 'lessons_25', name: 'Scholar', description: 'Completed 25 lessons', hint: 'Complete 25 lessons', earned: (c) => c.lessons >= 25 },
  { key: 'first_quiz', name: 'Quiz Rookie', description: 'Passed your first quiz', hint: 'Pass 1 quiz', earned: (c) => c.quizzes >= 1 },
  { key: 'perfect_quiz', name: 'Perfectionist', description: 'Scored 100% on a quiz', hint: 'Score 100% on any quiz', earned: (c) => c.perfects >= 1 },
  { key: 'streak_3', name: 'Warming Up', description: '3-day study streak', hint: 'Study 3 days in a row', earned: (c) => c.longestStreak >= 3 },
  { key: 'streak_7', name: 'On Fire', description: '7-day study streak', hint: 'Study 7 days in a row', earned: (c) => c.longestStreak >= 7 },
  { key: 'streak_30', name: 'Unstoppable', description: '30-day study streak', hint: 'Study 30 days in a row', earned: (c) => c.longestStreak >= 30 },
  { key: 'first_certificate', name: 'Certified', description: 'Earned your first certificate', hint: 'Finish a course and earn its certificate', earned: (c) => c.certificates >= 1 },
]

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

    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)

    // Derive any missing XP events from real rows before reporting
    await syncXpForUser(userId)

    const [streakRes, lessonsRes, lessonsTodayRes, quizPassRes, perfectRes, certsRes, quizzesTodayRes, milestonesRes] =
      await Promise.all([
        supabaseAdmin.from('study_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabaseAdmin
          .from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('completed_at', 'is', null),
        supabaseAdmin
          .from('user_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('completed_at', dayStart.toISOString()),
        supabaseAdmin.from('quiz_attempts').select('lesson_id').eq('user_id', userId).eq('passed', true),
        supabaseAdmin
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('score_percentage', 100),
        supabaseAdmin.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabaseAdmin
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('passed', true)
          .gte('completed_at', dayStart.toISOString()),
        supabaseAdmin.from('learning_milestones').select('milestone_name, achieved_at').eq('user_id', userId),
      ])

    const streak = streakRes.data || null
    const ctx: Ctx = {
      lessons: lessonsRes.count ?? 0,
      quizzes: new Set((quizPassRes.data || []).map((q: any) => q.lesson_id)).size,
      perfects: perfectRes.count ?? 0,
      certificates: certsRes.count ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
    }

    const existing = new Map(
      (milestonesRes.data || []).map((m: any) => [m.milestone_name as string, m.achieved_at as string])
    )

    const badges = BADGES.map((b) => {
      const isEarned = b.earned(ctx)
      const stored = existing.get(b.name)
      // Lazy award: persist newly-earned badges so SabiBot can celebrate them
      if (isEarned && !stored) {
        notify(userId, {
          type: 'badge',
          title: `Badge earned: ${b.name}`,
          body: b.description,
          href: '/dashboard',
        })
        supabaseAdmin
          .rpc('add_milestone', {
            p_user_id: userId,
            p_milestone_type: 'badge',
            p_milestone_name: b.name,
            p_milestone_description: b.description,
          })
          .then(({ error }) => {
            if (error) console.log('badge award skipped:', error.message)
          })
      }
      return {
        key: b.key,
        name: b.name,
        description: b.description,
        hint: b.hint,
        earned: isEarned,
        earned_at: stored || null,
      }
    })

    const lessonsToday = lessonsTodayRes.count ?? 0
    const quizzesToday = quizzesTodayRes.count ?? 0

    let weeklyXp = 0
    try {
      const { data: xpRows } = await supabaseAdmin
        .from('xp_events')
        .select('points')
        .eq('user_id', userId)
        .gte('created_at', weekStart().toISOString())
      weeklyXp = (xpRows || []).reduce((sum, r: any) => sum + (r.points || 0), 0)
    } catch {
      // xp_events not provisioned yet
    }

    return NextResponse.json({
      streak: {
        current: streak?.current_streak ?? 0,
        longest: streak?.longest_streak ?? 0,
        total_days: streak?.total_study_days ?? 0,
      },
      today: {
        lessons: lessonsToday,
        quizzes: quizzesToday,
        // Daily goal: one learning action (lesson complete or quiz pass)
        goal_met: lessonsToday + quizzesToday >= 1,
      },
      stats: {
        lessons_completed: ctx.lessons,
        quizzes_passed: ctx.quizzes,
        certificates: ctx.certificates,
      },
      weekly_xp: weeklyXp,
      badges,
    })
  } catch (error) {
    console.error('gamification summary error:', error)
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}
