'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'
import SabiLoader from '@/components/ui/SabiLoader'
import {
  BookOpen,
  Search,
  Building2,
  AlertCircle,
  RefreshCw,
  Layers,
  Loader2,
  Check,
  X,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  status: string
  difficulty_level: string | null
  created_at: string
  published_at: string | null
  instructor_name: string
  lesson_count: number
  programs: string[]
}

interface Program {
  id: string
  name: string
  status: string
}

export default function InstitutionCoursesPage() {
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Attach modal state
  const [attachFor, setAttachFor] = useState<Course | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [attaching, setAttaching] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const h = { Authorization: `Bearer ${session.access_token}` }
      const m = await fetch('/api/institutions/my-membership', { headers: h })
      if (!m.ok) return

      const mJson = await m.json()
      const membership = mJson.data || mJson
      const instId = membership.institution_id as string
      setInstitutionId(instId)

      const res = await fetch(`/api/institutions/${instId}/courses`, { headers: h })
      if (!res.ok) {
        setError('We could not load your course library. Please try again.')
        return
      }

      const json = await res.json()
      const payload = json.data || json
      setCourses(payload.courses || [])
      setPrograms(payload.programs || [])
    } catch {
      setError('Something went wrong loading your courses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.instructor_name.toLowerCase().includes(q)
    )
  }, [courses, query])

  const openAttach = (course: Course) => {
    setAttachFor(course)
    setSelectedProgram(null)
  }

  const closeAttach = () => {
    if (attaching) return
    setAttachFor(null)
    setSelectedProgram(null)
  }

  const handleAttach = async () => {
    if (!attachFor || !selectedProgram || !institutionId) return
    setAttaching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/institutions/${institutionId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ course_id: attachFor.id, program_id: selectedProgram }),
      })

      const json = await res.json().catch(() => ({}))
      const payload = json.data || json

      if (!res.ok) {
        toast.error(payload?.error || json?.error || 'Failed to attach course')
        return
      }

      if (payload.already) {
        toast.info('Already in that program')
      } else {
        toast.success('Course attached')
        await load()
      }
      setAttachFor(null)
      setSelectedProgram(null)
    } catch {
      toast.error('Failed to attach course')
    } finally {
      setAttaching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SabiLoader size="lg" text="Loading course library..." />
      </div>
    )
  }

  const cardClass =
    'relative overflow-hidden bg-white rounded-xl border border-gray-200'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-red-500" />
            <Link href="/institution/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
              Institution
            </Link>
            <span className="text-red-300">/</span>
            <span className="font-medium text-gray-900">Course Library</span>
          </div>
        </div>
      </div>

      {/* Header / hero */}
      <div className="relative overflow-hidden border-b border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
            Course library
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 mb-2">
            Your organization&apos;s{' '}
            <span className="font-serif italic text-red-600">
              courses
            </span>
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Every course your instructors have authored, private to your organization.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className={`${cardClass} p-8 text-center max-w-md mx-auto`}>
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="w-14 h-14 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-medium tracking-tight text-gray-900 mb-1">
              Couldn&apos;t load <span className="font-serif italic text-red-600">courses</span>
            </h2>
            <p className="text-sm text-gray-600 mb-5">{error}</p>
            <button
              type="button"
              onClick={load}
              className="relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full px-5 py-3 ring-1 ring-red-600/50 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className={`${cardClass} p-12 text-center`}>
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="w-16 h-16 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-1">
              No courses <span className="font-serif italic text-red-600">yet</span>
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Invite instructors and their courses will appear here, private to your organization.
            </p>
            <Link
              href="/institution/dashboard"
              className="relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full px-5 py-3 ring-1 ring-red-600/50 transition-all cursor-pointer"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or instructor..."
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-red-400 focus:outline-none text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <p className="text-sm text-gray-500 tabular-nums">
                {filtered.length} of {courses.length} {courses.length === 1 ? 'course' : 'courses'}
              </p>
            </div>

            {/* Course list */}
            <div className={`${cardClass} p-2 sm:p-3`}>
              <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <div className="w-12 h-12 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm">No courses match &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filtered.map((course) => {
                    const published = course.status === 'published'
                    return (
                      <div
                        key={course.id}
                        className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <Link
                              href={`/courses/${course.slug}`}
                              className="font-medium text-gray-900 hover:text-red-600 transition-colors cursor-pointer truncate"
                            >
                              {course.title}
                            </Link>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize border ${
                                published
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {course.status}
                            </span>
                            {course.published_at &&
                              Date.now() - new Date(course.published_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-gray-200">
                                  New
                                </span>
                              )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            by {course.instructor_name} · {course.lesson_count}{' '}
                            {course.lesson_count === 1 ? 'lesson' : 'lessons'}
                            {course.difficulty_level && (
                              <span className="capitalize"> · {course.difficulty_level}</span>
                            )}
                          </p>
                          {course.programs.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {course.programs.map((p, i) => (
                                <span
                                  key={`${course.id}-${i}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-gray-200"
                                >
                                  <Layers className="w-3 h-3" />
                                  {p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Not in any program yet</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openAttach(course)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm transition-colors cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-red-500" />
                            Attach to program
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Attach modal */}
      {attachFor && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeAttach}
        >
          <div
            className="relative overflow-hidden bg-white rounded-xl border border-gray-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-1">
                  Attach to program
                </p>
                <h3 className="text-lg font-medium tracking-tight text-gray-900">
                  Add a <span className="font-serif italic text-red-600">program</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAttach}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5 truncate">
              {attachFor.title}
            </p>

            {programs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">No programs yet. Create one first.</p>
                <Link
                  href="/institution/programs"
                  className="text-sm font-medium text-red-600 hover:underline cursor-pointer"
                >
                  Go to programs
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-5">
                  {programs.map((program) => {
                    const active = selectedProgram === program.id
                    return (
                      <button
                        key={program.id}
                        type="button"
                        onClick={() => setSelectedProgram(program.id)}
                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-gray-50 border-gray-200 ring-2 ring-red-400'
                            : 'bg-white/70 border-gray-200 hover:border-gray-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-lg bg-red-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-red-500" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{program.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{program.status}</div>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                            active ? 'bg-red-500 border-red-500' : 'border-gray-200'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeAttach}
                    disabled={attaching}
                    className="px-4 py-2 bg-white/70 border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAttach}
                    disabled={!selectedProgram || attaching}
                    className="relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full px-5 py-2 ring-1 ring-red-600/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {attaching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Attaching...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Attach course
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
