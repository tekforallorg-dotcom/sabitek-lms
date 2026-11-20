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
    return <div className="h-16 rounded-xl bg-gray-50 animate-pulse" />
  }

  if (!resume) return null

  const pct =
    resume.total_lessons > 0
      ? Math.round((resume.completed_lessons / resume.total_lessons) * 100)
      : 0

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200">
      <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-4 p-4">
        {/* Gradient tile */}
        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
          <Play className="w-4 h-4 text-white ml-1" />
        </div>

        {/* Middle */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">
            Continue where you left off
          </p>
          <p className="font-medium tracking-tight text-gray-900 line-clamp-1">
            {resume.lesson_title}
          </p>
          <p className="text-xs text-gray-500 tabular-nums">
            {resume.course_title} · {resume.completed_lessons}/{resume.total_lessons} lessons done
          </p>
        </div>

        {/* Resume pill */}
        <Link href={resume.href} className="flex-shrink-0">
          <button className="group relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all px-5 py-2 text-sm cursor-pointer">
            Resume
            <ArrowRight className="w-4 h-4 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-red-50">
        <div
          className="h-full bg-red-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
