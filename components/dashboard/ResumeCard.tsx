'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'
import { PANEL, ProgressBar } from '@/components/ui/page'
import { buttonVariants } from '@/components/ui/button'

export interface Resume {
  course_title: string
  course_slug: string
  lesson_title: string
  lesson_slug: string
  href: string
  completed_lessons: number
  total_lessons: number
}

/**
 * The next lesson to open, and the one primary action on the learner's home
 * page. Takes its data as a prop so it can be drawn with sample data.
 */
export function ResumeCardView({ resume }: { resume: Resume }) {
  const pct =
    resume.total_lessons > 0
      ? Math.round((resume.completed_lessons / resume.total_lessons) * 100)
      : 0

  return (
    <div className={`${PANEL} p-4 sm:p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">Up next</p>
          <p className="mt-1 text-base font-medium leading-6 text-gray-900 line-clamp-2">{resume.lesson_title}</p>
          <p className="text-sm leading-5 text-gray-500 line-clamp-1">{resume.course_title}</p>
        </div>
        <Link href={resume.href} className={`${buttonVariants({ size: 'lg' })} group w-full flex-shrink-0 sm:w-auto`}>
          Resume lesson
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={pct} label={`${resume.course_title} progress`} />
        <span className="flex-shrink-0 text-xs tabular-nums leading-4 text-gray-500">
          {resume.completed_lessons} of {resume.total_lessons} lessons
        </span>
      </div>
    </div>
  )
}

/**
 * The same card for when the next lesson is not known: it opens the course.
 */
export function ContinueCourseCard({ title, href, progress }: { title: string; href: string; progress: number }) {
  return (
    <div className={`${PANEL} p-4 sm:p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">Up next</p>
          <p className="mt-1 text-base font-medium leading-6 text-gray-900 line-clamp-2">{title}</p>
        </div>
        <Link href={href} className={`${buttonVariants({ size: 'lg' })} group w-full flex-shrink-0 sm:w-auto`}>
          {progress > 0 ? 'Continue course' : 'Start course'}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar value={progress} label={`${title} progress`} />
        <span className="flex-shrink-0 text-xs tabular-nums leading-4 text-gray-500">{progress}% done</span>
      </div>
    </div>
  )
}

/**
 * Fetches the learner's next incomplete lesson from GET /api/learner/resume
 * and shows it. Renders `fallback` when there is no session, the request
 * fails, or there is nothing to resume.
 */
export default function ResumeCard({ fallback = null }: { fallback?: React.ReactNode }) {
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
    return <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
  }

  if (!resume) return <>{fallback}</>

  return <ResumeCardView resume={resume} />
}
