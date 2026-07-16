'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  is_me: boolean
}

interface LeaderboardMe {
  rank: number | null
  xp: number
}

interface LeaderboardData {
  scope: 'cohort' | 'global'
  scope_name: string
  week_start: string
  entries: LeaderboardEntry[]
  me: LeaderboardMe | null
}

function rankColor(rank: number): string {
  if (rank === 1) return 'text-amber-500'
  if (rank === 2) return 'text-gray-400'
  if (rank === 3) return 'text-orange-400/70'
  return 'text-gray-300'
}

function InitialCircle({ name, isMe }: { name: string; isMe: boolean }) {
  return (
    <span
      className={`w-[30px] h-[30px] flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
        isMe
          ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white'
          : 'bg-rose-50 border border-rose-100 text-red-600'
      }`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export default function LeaderboardCard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

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

        const res = await fetch('/api/gamification/leaderboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (!res.ok) {
          if (active) {
            setFailed(true)
            setLoading(false)
          }
          return
        }

        const json: LeaderboardData = await res.json()
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

  if (failed) return null

  if (loading || !data) {
    return (
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-5">
        <span
          className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
          aria-hidden="true"
        />
        <div className="space-y-3" aria-hidden="true">
          <div className="h-9 rounded-xl bg-rose-50/60 animate-pulse" />
          <div className="h-9 rounded-xl bg-rose-50/60 animate-pulse" />
          <div className="h-9 rounded-xl bg-rose-50/60 animate-pulse" />
        </div>
      </div>
    )
  }

  const entries = data.entries.slice(0, 10)
  const hasActivity = entries.some((e) => e.xp > 0)
  const meInTop = entries.some((e) => e.is_me)
  const showPinnedMe = data.me !== null && !meInTop

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-5">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_8px_18px_-6px_rgba(245,158,11,0.5)] flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold tracking-tight text-gray-900">
            Weekly leaderboard
          </h2>
          <p className="text-xs text-gray-400 truncate">
            {data.scope_name} &middot; resets Monday
          </p>
        </div>
      </div>

      {!hasActivity ? (
        /* Empty state */
        <div className="py-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-sm font-medium text-gray-600">No XP yet this week</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Complete a lesson to score the first points
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className={`flex items-center gap-3 px-2 py-2 ${
                entry.is_me ? 'bg-rose-50/60 rounded-xl' : ''
              }`}
            >
              <span
                className={`w-6 flex-shrink-0 text-sm font-bold tabular-nums ${rankColor(entry.rank)}`}
              >
                {entry.rank}
              </span>
              <InitialCircle name={entry.name} isMe={entry.is_me} />
              <span className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5 min-w-0">
                <span className="truncate">{entry.name}</span>
                {entry.is_me && (
                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-red-600 rounded-full font-semibold">
                    You
                  </span>
                )}
              </span>
              <span className="ml-auto flex-shrink-0 text-sm font-bold tabular-nums text-gray-900">
                {entry.xp} XP
              </span>
            </div>
          ))}

          {/* Pinned "me" row when not in the top list */}
          {showPinnedMe && data.me && (
            <>
              <span
                className="block h-px my-2 bg-gradient-to-r from-transparent via-rose-300 to-transparent"
                aria-hidden="true"
              />
              <div className="flex items-center gap-3 px-2 py-2 bg-rose-50/60 rounded-xl">
                <span className="w-6 flex-shrink-0 text-sm font-bold tabular-nums text-gray-300">
                  {data.me.rank ?? '–'}
                </span>
                <InitialCircle name="You" isMe />
                <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  You
                </span>
                <span className="ml-auto flex-shrink-0 text-sm font-bold tabular-nums text-gray-900">
                  {data.me.xp} XP
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
