'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Play, ArrowRight } from 'lucide-react'

interface Resume {
  course_title: string
  course_slug: string
  lesson_title: string
  lesson_slug: string
  href: string
  completed_lessons: number
  total_lessons: number
}

/**
 * "Continue where you left off" hero — a slim horizontal glass card that
 * surfaces the learner's next incomplete lesson, fetched from
 * GET /api/learner/resume. Renders nothing when there's no session, the
 * fetch fails, or there's no resumable lesson.
 */
export default function ResumeCard() {
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (active) setLoading(false)
          return
        }

        const res = await fetch('/api/learner/resume', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) {
          if (active) setLoading(false)
          return
        }

        const json = await res.json()
        if (active) setResume(json.resume ?? null)
      } catch {
        // swallow — the card simply stays hidden on error
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="h-16 rounded-2xl bg-rose-50/60 animate-pulse" />
  }

  if (!resume) return null

  const pct =
    resume.total_lessons > 0
      ? Math.round((resume.completed_lessons / resume.total_lessons) * 100)
      : 0

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
      <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-4 p-4">
        {/* Gradient tile */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center flex-shrink-0">
          <Play className="w-4 h-4 text-white ml-0.5" />
        </div>

        {/* Middle */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
            Continue where you left off
          </p>
          <p className="font-semibold tracking-tight text-gray-900 line-clamp-1">
            {resume.lesson_title}
          </p>
          <p className="text-xs text-gray-500 tabular-nums">
            {resume.course_title} · {resume.completed_lessons}/{resume.total_lessons} lessons done
          </p>
        </div>

        {/* Resume pill */}
        <Link href={resume.href} className="flex-shrink-0">
          <button className="group relative overflow-hidden inline-flex items-center gap-1.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 hover:-translate-y-0.5 transition-all px-5 py-2 text-sm cursor-pointer">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
            Resume
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-rose-50">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-rose-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
