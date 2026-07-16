'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Target, Check, Flame, Medal, Lock, X, Zap, Snowflake } from 'lucide-react'

interface Streak {
  current: number
  longest: number
  total_days: number
  freezes?: number
  freeze_used_on?: string | null
}

interface Today {
  lessons: number
  quizzes: number
  goal_met: boolean
}

interface Stats {
  lessons_completed: number
  quizzes_passed: number
  certificates: number
}

interface Badge {
  key: string
  name: string
  description: string
  hint: string
  earned: boolean
  earned_at: string | null
}

interface GamificationSummary {
  streak: Streak
  today: Today
  stats: Stats
  badges: Badge[]
  weekly_xp: number
}

const MILESTONES = [3, 7, 14, 30, 60, 100]

function nextMilestone(current: number): number {
  return MILESTONES.find((m) => m > current) ?? current
}

export default function GamificationStrip() {
  const [data, setData] = useState<GamificationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [ringProgress, setRingProgress] = useState(0)
  const [showBadges, setShowBadges] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          if (active) {
            setFailed(true)
            setLoading(false)
          }
          return
        }

        const res = await fetch('/api/gamification/summary', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (!res.ok) {
          if (active) {
            setFailed(true)
            setLoading(false)
          }
          return
        }

        const json: GamificationSummary = await res.json()
        if (active) {
          setData(json)
          setLoading(false)
        }
      } catch {
        if (active) {
          setFailed(true)
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  // Animate the ring on mount once data arrives.
  useEffect(() => {
    if (!data) return
    const target = data.today.goal_met ? 100 : 0
    const raf = requestAnimationFrame(() => setRingProgress(target))
    return () => cancelAnimationFrame(raf)
  }, [data])

  if (failed) return null

  if (loading || !data) {
    return (
      <div
        className="h-[104px] rounded-2xl bg-rose-50/60 animate-pulse"
        aria-hidden="true"
      />
    )
  }

  const { streak, today, badges, weekly_xp: weeklyXp } = data
  const earnedBadges = badges.filter((b) => b.earned)
  const recentBadges = [...earnedBadges]
    .sort((a, b) => {
      const at = a.earned_at ? new Date(a.earned_at).getTime() : 0
      const bt = b.earned_at ? new Date(b.earned_at).getTime() : 0
      return bt - at
    })
    .slice(0, 4)

  // Ring geometry.
  const size = 60
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (ringProgress / 100) * circumference

  const next = nextMilestone(streak.current)
  const hasStreak = streak.current > 0
  const daysToNext = Math.max(next - streak.current, 0)
  const milestonePct =
    next > 0 ? Math.min((streak.current / next) * 100, 100) : 0

  return (
    <>
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
        <span
          className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-4 p-5">
          {/* ── Zone 1 — Daily goal ring ── */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <defs>
                  <linearGradient id="gs-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#ffe4e6"
                  strokeWidth={stroke}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="url(#gs-ring-grad)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                {today.goal_met ? (
                  <Check className="w-5 h-5 text-red-500" />
                ) : (
                  <Target className="w-5 h-5 text-gray-400" />
                )}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                Daily goal
              </p>
              {today.goal_met ? (
                <p className="mt-0.5 text-sm font-semibold text-emerald-600">
                  Done for today!
                </p>
              ) : (
                <>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    1 lesson or quiz to go
                  </p>
                  <Link
                    href="/courses"
                    className="text-xs text-red-600 font-semibold cursor-pointer hover:text-red-700 transition-colors"
                  >
                    Continue learning &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <span className="hidden sm:block w-px self-stretch bg-rose-100/80" aria-hidden="true" />

          {/* ── Zone 2 — Streak flame ── */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div
              className={`w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_10px_20px_-8px_rgba(251,146,60,0.6)] flex items-center justify-center transition-all ${
                hasStreak ? '' : 'grayscale opacity-60'
              }`}
            >
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl font-bold tabular-nums text-gray-900 leading-none">
                  {streak.current}
                </span>
                <span className="text-xs text-gray-500 font-medium">day streak</span>
                {(streak.freezes ?? 0) > 0 && (
                  <span
                    title="If you miss one day, a freeze saves your streak automatically"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-semibold"
                  >
                    <Snowflake className="w-3 h-3" />
                    {streak.freezes} freeze
                  </span>
                )}
              </div>
              {hasStreak ? (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-orange-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                      style={{ width: `${Math.max(milestonePct, 4)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {daysToNext > 0
                      ? `${daysToNext} day${daysToNext > 1 ? 's' : ''} to ${next}`
                      : `Longest streak: ${streak.longest}`}
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Complete a lesson to light the flame
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <span className="hidden sm:block w-px self-stretch bg-rose-100/80" aria-hidden="true" />

          {/* ── Zone 3 — Badges ── */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">
              Badges
            </p>
            <div className="flex items-center gap-3">
              {recentBadges.length > 0 ? (
                <div className="flex items-center">
                  {recentBadges.map((badge, i) => (
                    <div
                      key={badge.key}
                      title={badge.name}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 ring-2 ring-white shadow flex items-center justify-center ${
                        i === 0 ? 'ml-0' : '-ml-2'
                      }`}
                    >
                      <Medal className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-dashed border-rose-200"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {earnedBadges.length} of {badges.length}
                </span>
                <button
                  type="button"
                  onClick={() => setShowBadges(true)}
                  className="text-xs rounded-full bg-rose-50/70 border border-rose-100 text-red-600 font-semibold px-3 py-1.5 hover:border-rose-200 cursor-pointer transition-all"
                >
                  View all
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <span className="hidden sm:block w-px self-stretch bg-rose-100/80" aria-hidden="true" />

          {/* ── Zone 4 — Weekly XP ── */}
          <div className="flex items-center gap-3 sm:flex-none sm:pr-1">
            <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                This week
              </p>
              <p className="mt-0.5 leading-none">
                <span className="text-2xl font-bold tabular-nums text-gray-900">
                  {weeklyXp}
                </span>{' '}
                <span className="text-xs text-rose-400 font-semibold">XP</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Badge wall modal ── */}
      {showBadges && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Your badges"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBadges(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white/95 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_30px_70px_-25px_rgba(225,29,72,0.5)] max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <button
              type="button"
              onClick={() => setShowBadges(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50/70 border border-rose-100 text-gray-500 hover:text-red-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-1 pr-10">
              Your{' '}
              <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                badges
              </span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              {earnedBadges.length} of {badges.length} earned
            </p>

            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.key}
                  className={`rounded-2xl p-3 text-center ${
                    badge.earned
                      ? 'bg-rose-50/70 border border-rose-100'
                      : 'bg-gray-50 border border-gray-100 opacity-70'
                  }`}
                >
                  {badge.earned ? (
                    <div className="w-11 h-11 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
                      <Medal className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      badge.earned ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {badge.name}
                  </p>
                  {badge.earned ? (
                    <>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-snug">
                        {badge.description}
                      </p>
                      {badge.earned_at && (
                        <p className="mt-1 text-[9px] text-gray-400">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-gray-400 leading-snug">
                      How: {badge.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
