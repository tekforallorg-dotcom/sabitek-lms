'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  ChevronRight,
  Edit,
  AlertCircle,
  MoreVertical,
  Award,
  Zap,
  Layers,
  ArrowRight,
  GraduationCap,
  Settings2,
  Globe,
  Lock,
  X,
  Search,
  Loader2,
  Trash2,
} from 'lucide-react'

/* ── Types ── */
interface Course {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  status: string
  is_free: boolean
  price: number | null
}

interface ProgramCourse {
  id: string
  position: number
  is_required: boolean
  course_id: string
  course: Course | null
}

interface Program {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  status: string
  visibility: string
  start_date: string | null
  end_date: string | null
  issue_certificate: boolean
  allow_self_paced: boolean
  created_at: string
  institution: {
    id: string
    name: string
    slug: string
  } | null
  program_courses: ProgramCourse[]
  cohorts: {
    id: string
    name: string
    slug: string
    status: string
    enrollment_mode: string
    start_date: string | null
    end_date: string | null
  }[]
  cohort_count: number
}

interface AvailableCourse {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  status: string
}

/* ── Status configs ── */
const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Draft' },
  active: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Active' },
  completed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400', label: 'Completed' },
  archived: { bg: 'bg-gray-50 border-gray-300', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Archived' },
  closed: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400', label: 'Closed' },
}

const cohortStatusColors: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-700',
}

/* ── SabiBot Loader ── */
function SabiBotLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              className="w-8 h-8"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: 'sabibotPulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <rect x="10" y="14" width="20" height="16" rx="4" fill="currentColor" opacity="0.9" />
              <rect x="14" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="22" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="16" y="25" width="8" height="2" rx="1" fill="white" />
              <line x1="20" y1="14" x2="20" y2="8" stroke="currentColor" strokeWidth="2" opacity="0.9" />
              <circle cx="20" cy="7" r="2.5" fill="currentColor" opacity="0.9" />
            </svg>
          ))}
        </div>
        <p className="text-gray-500 text-base font-medium">{message}</p>
        <style jsx>{`
          @keyframes sabibotPulse {
            0%, 100% { color: #f87171; opacity: 0.4; transform: scale(0.95); }
            50% { color: #ef4444; opacity: 1; transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  )
}

/* ── Add Course Modal ── */
interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  programId: string
  existingCourseIds: string[]
  onCourseAdded: () => void
}

function AddCourseModal({ isOpen, onClose, programId, existingCourseIds, onCourseAdded }: AddCourseModalProps) {
  const [courses, setCourses] = useState<AvailableCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchCourses()
    }
  }, [isOpen])

  const fetchCourses = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select('id, title, slug, cover_image_url, status')
        .eq('status', 'published')
        .order('title', { ascending: true })

      if (fetchError) throw fetchError
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async (courseId: string) => {
    setAdding(courseId)
    setError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/programs/${programId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          is_required: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add course')
      }

      onCourseAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add course')
    } finally {
      setAdding(null)
    }
  }

  const availableCourses = courses.filter(
    (c) =>
      !existingCourseIds.includes(c.id) &&
      c.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Add Course to Program</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="p-4 overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : availableCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                {search ? 'No courses match your search' : 'No courses available to add'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:border-red-200 hover:bg-red-50/30 transition-colors"
                >
                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {course.cover_image_url ? (
                      <Image src={course.cover_image_url} alt={course.title} fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{course.title}</h4>
                    <p className="text-xs text-gray-500 capitalize">{course.status}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddCourse(course.id)}
                    disabled={adding === course.id}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                  >
                    {adding === course.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function ProgramDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const programId = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [openCourseMenu, setOpenCourseMenu] = useState<string | null>(null)
  const [removingCourse, setRemovingCourse] = useState<string | null>(null)

  const fetchProgram = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!signal?.aborted) router.push('/auth/login')
        return
      }

      if (signal?.aborted) return

      const res = await fetch(`/api/programs/${programId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        signal,
      })

      if (signal?.aborted) return

      if (!res.ok) {
        const errorText = res.status === 404
          ? 'Program not found'
          : res.status === 403
            ? 'You do not have access to this program'
            : 'Failed to load program'
        setError(errorText)
        setLoading(false)
        return
      }

      const result = await res.json()
      if (signal?.aborted) return

      // Handle both { data: program } and { id, name, ... } response formats
      let programData = result.data || result
      
      if (programData?.id) {
        // Enrich program_courses with course details if any exist
        if (programData.program_courses?.length > 0) {
          console.log('Enriching program courses...', programData.program_courses.length)
          try {
            const coursesRes = await fetch(`/api/programs/${programId}/courses`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
              signal,
            })
            if (signal?.aborted) return
            if (coursesRes.ok) {
              const coursesData = await coursesRes.json()
              console.log('Courses API response:', coursesData)
              // Handle both { data: { courses: [...] } } and { courses: [...] } formats
              const courses = coursesData.data?.courses || coursesData.courses
              if (courses) {
                programData = { ...programData, program_courses: courses }
                console.log('Enriched program_courses:', programData.program_courses)
              }
            } else {
              console.log('Courses API failed:', coursesRes.status)
            }
          } catch (enrichErr) {
            console.error('Error enriching courses:', enrichErr)
          }
        }
        setProgram(programData)
        setError(null)
      } else {
        setError('Invalid response format')
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Error fetching program:', err)
      if (!signal?.aborted) setError('Failed to load program')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [programId, router])

  const enrichProgramCourses = async (programData: Program, token: string) => {
    try {
      const res = await fetch(`/api/programs/${programId}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const { data } = await res.json()
        if (data?.courses) {
          programData.program_courses = data.courses
        }
      }
    } catch (err) {
      console.error('Error fetching program courses:', err)
    }
  }

  const handleRemoveCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to remove this course from the program?')) return

    setRemovingCourse(courseId)
    setOpenCourseMenu(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/programs/${programId}/courses`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ course_id: courseId }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('Failed to remove course:', data.error)
        return
      }

      fetchProgram()
    } catch (err) {
      console.error('Error removing course:', err)
    } finally {
      setRemovingCourse(null)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push(`/auth/login?redirect=/institution/programs/${programId}`)
      return
    }
    const abortController = new AbortController()
    fetchProgram(abortController.signal)
    return () => { abortController.abort() }
  }, [authLoading, user, programId, fetchProgram])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading program..." />
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error === 'Program not found' ? 'Program Not Found' : 'Something Went Wrong'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">{error || 'Program not found'}</p>
          <Link href="/institution/programs">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Programs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[program.status] || statusConfig.draft
  const existingCourseIds = (program.program_courses || []).map(pc => pc.course_id)

  const stats = [
    { label: 'Courses', value: program.program_courses?.length || 0, icon: BookOpen, color: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Cohorts', value: program.cohort_count || program.cohorts?.length || 0, icon: Users, color: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Visibility', value: program.visibility === 'public' ? 'Public' : 'Private', icon: program.visibility === 'public' ? Globe : Lock, color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Certificates', value: program.issue_certificate ? 'Enabled' : 'Disabled', icon: Award, color: 'bg-orange-50', iconColor: 'text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AddCourseModal
        isOpen={showAddCourseModal}
        onClose={() => setShowAddCourseModal(false)}
        programId={programId}
        existingCourseIds={existingCourseIds}
        onCourseAdded={() => fetchProgram()}
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900 text-sm">Program Details</span>
            </div>
            <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/institution/programs" className="hover:text-red-600 transition-colors">Programs</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{program.name}</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-red-50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                {program.allow_self_paced && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-600 border border-gray-200">
                    <Zap className="w-3 h-3" />Self-Paced
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">{program.name}</h1>
              {(program.short_description || program.description) && (
                <p className="text-gray-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                  {program.short_description || program.description}
                </p>
              )}
              {(program.start_date || program.end_date) && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-lg text-xs text-gray-600 border border-gray-200/60">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(program.start_date)} — {formatDate(program.end_date)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/institution/programs/${programId}/edit`}>
                <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-sm gap-2">
                  <Edit className="w-4 h-4" />Edit Program
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900">Courses</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                    {program.program_courses?.length || 0}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowAddCourseModal(true)}>
                  <Plus className="w-3.5 h-3.5" />Add Course
                </Button>
              </div>

              {!program.program_courses || program.program_courses.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">No courses added yet</p>
                  <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Add courses to build your program curriculum</p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={() => setShowAddCourseModal(true)}>
                    <Plus className="w-3.5 h-3.5" />Add First Course
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {program.program_courses.map((pc, index) => {
                    const courseTitle = pc.course?.title || `Course ${index + 1}`
                    const isRemoving = removingCourse === pc.course_id
                    return (
                      <div key={pc.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${isRemoving ? 'opacity-50' : ''}`}>
                        <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{courseTitle}</h4>
                          <span className={`text-xs ${pc.is_required ? 'text-red-600' : 'text-gray-400'}`}>
                            {pc.is_required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        {pc.course && (
                          <Link href={`/courses/${pc.course.slug}`} className="text-xs text-gray-500 hover:text-red-600 transition-colors hidden sm:block">
                            View course →
                          </Link>
                        )}
                        <div className="relative">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenCourseMenu(openCourseMenu === pc.id ? null : pc.id)} disabled={isRemoving}>
                            {isRemoving ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <MoreVertical className="w-4 h-4 text-gray-400" />}
                          </Button>
                          {openCourseMenu === pc.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                              <button onClick={() => handleRemoveCourse(pc.course_id)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                                <Trash2 className="w-4 h-4" />Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {program.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h2 className="font-semibold text-gray-900 mb-3">About This Program</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{program.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900">Cohorts</h2>
                </div>
                <Link href={`/institution/cohorts/create?program_id=${programId}`}>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1 text-xs h-8">
                    <Plus className="w-3.5 h-3.5" />New
                  </Button>
                </Link>
              </div>

              {!program.cohorts || program.cohorts.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">No cohorts yet</p>
                  <p className="text-xs text-gray-500 mb-4">Create a cohort to start enrolling learners</p>
                  <Link href={`/institution/cohorts/create?program_id=${programId}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" />Create First Cohort
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {program.cohorts.map((cohort) => (
                    <Link key={cohort.id} href={`/institution/cohorts/${cohort.id}`} className="block p-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm group-hover:text-red-600 transition-colors">{cohort.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${cohortStatusColors[cohort.status] || 'bg-gray-100 text-gray-600'}`}>
                          {cohort.status}
                        </span>
                      </div>
                      {cohort.start_date && (
                        <p className="text-xs text-gray-400">{formatDate(cohort.start_date)} — {formatDate(cohort.end_date)}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 p-5 border-b border-gray-100">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Settings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    {program.visibility === 'public' ? <Globe className="w-4 h-4 text-gray-400" /> : <Lock className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-600">Visibility</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{program.visibility}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Certificates</span>
                  </div>
                  <span className={`text-sm font-medium ${program.issue_certificate ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {program.issue_certificate ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Self-Paced</span>
                  </div>
                  <span className={`text-sm font-medium ${program.allow_self_paced ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {program.allow_self_paced ? 'Allowed' : 'Scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}