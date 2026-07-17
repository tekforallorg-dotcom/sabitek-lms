'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import SabiLoader from '@/components/ui/SabiLoader'
import { buildLessonSequence, computeLockMap, type LockInfo } from '@/lib/lesson-gating'
import { toast } from '@/components/ui/toast'
import {
  BookOpen,
  Users,
  Clock,
  PlayCircle,
  CheckCircle,
  Award,
  ArrowRight,
  PartyPopper,
  X,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Layers,
  Lock,
} from 'lucide-react'

/* ── Types ── */

interface Course {
  id: string
  title: string
  description: string
  instructor_id: string
  cover_image_url?: string
  price?: number
  is_free?: boolean
  currency?: string
  instructor?: {
    full_name: string
  }
}

interface Lesson {
  id: string
  title: string
  slug: string
  lesson_order: number
  duration_minutes?: number
  content_type: string
  module_id?: string | null
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  lesson_count: number
}

interface CourseAccessResult {
  hasAccess: boolean
  accessType: 'free' | 'purchased' | 'cohort_sponsored' | 'sequence_locked' | 'none'
  blocking?: { id: string; title: string; slug: string } | null
  cohort?: {
    id: string
    name: string
    programId: string
    programName: string
  }
}

/* ── Modal Component ── */

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
}

function Modal({ isOpen, onClose, title, message, type = 'info', actions }: ModalProps) {
  if (!isOpen) return null

  const iconMap = {
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    error: <X className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
  }

  const bgMap = {
    info: 'from-blue-500 to-blue-600',
    success: 'from-emerald-500 to-green-600',
    error: 'from-red-500 to-rose-600',
    warning: 'from-amber-500 to-amber-600',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          {actions ? (
            actions.map((action, i) => (
              <Button
                key={i}
                onClick={action.onClick}
                variant={action.variant === 'secondary' ? 'outline' : 'default'}
                className={
                  action.variant === 'primary'
                    ? 'relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5'
                    : 'bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm'
                }
                size="sm"
              >
                {action.variant === 'primary' && (
                  <span
                    className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
              size="sm"
            >
              <span
                className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
                aria-hidden="true"
              />
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Helper: Lesson Row ── */

interface LessonRowProps {
  lesson: Lesson
  index: number
  totalLessonsIndex: number
  isCompleted: boolean
  locked?: boolean
  onClick: () => void
}

function LessonRow({ lesson, totalLessonsIndex, isCompleted, locked, onClick }: LessonRowProps) {
  return (
    <button
      onClick={onClick}
      title={locked ? 'Locked: finish the previous lesson first' : undefined}
      className={`w-full flex items-center justify-between p-4 bg-white/70 border border-rose-100 rounded-xl transition-all group ${
        locked
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:bg-rose-50/50 hover:border-rose-200 hover:shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            locked
              ? 'bg-gray-50 border border-gray-200'
              : isCompleted
              ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-md shadow-emerald-500/25'
              : 'bg-white border border-rose-100 group-hover:border-rose-200'
          }`}
        >
          {locked ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : isCompleted ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : (
            <span className="text-sm font-semibold text-gray-500 group-hover:text-red-500 transition-colors">
              {totalLessonsIndex + 1}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <h3
            className={`text-sm font-semibold transition-colors line-clamp-1 ${
              locked ? 'text-gray-500' : 'text-gray-900 group-hover:text-red-600'
            }`}
          >
            {lesson.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            {lesson.content_type === 'youtube' && <span className="uppercase tracking-wide font-medium text-rose-400">YouTube</span>}
            {lesson.content_type === 'video' && <span className="uppercase tracking-wide font-medium text-rose-400">Video</span>}
            {lesson.content_type === 'pdf' && <span className="uppercase tracking-wide font-medium text-rose-400">PDF</span>}
            {lesson.content_type === 'powerpoint' && <span className="uppercase tracking-wide font-medium text-rose-400">PPT</span>}
            {lesson.content_type === 'text' && <span className="uppercase tracking-wide font-medium text-rose-400">Text</span>}
            {lesson.duration_minutes && <span>• {lesson.duration_minutes}m</span>}
          </div>
        </div>
      </div>

      {locked ? (
        <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 ml-2" />
      ) : (
        <ArrowRight className="w-5 h-5 text-rose-200 group-hover:text-red-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
      )}
    </button>
  )
}

/* ── Page ── */

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [lockMap, setLockMap] = useState<Map<string, LockInfo>>(new Map())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [accessResult, setAccessResult] = useState<CourseAccessResult | null>(null)
  const [finishingCourse, setFinishingCourse] = useState(false)
  const [showCongratsModal, setShowCongratsModal] = useState(false)
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null)

  const [modal, setModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'error' | 'warning'
    actions?: ModalProps['actions']
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    actions?: ModalProps['actions']
  ) => {
    setModal({ isOpen: true, title, message, type, actions })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    if (!authLoading) {
      fetchCourseData()
    }
  }, [authLoading, params.slug])

  const fetchCourseData = async () => {
    try {
      setLoading(true)

      // Single consolidated loader: course + lessons + modules + enrollment
      // + access + progress + quiz-gating in parallel server-side. Token is
      // optional because this page is reachable anonymously.
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch(
        `/api/learner/course-data?courseSlug=${encodeURIComponent(String(params.slug))}`,
        accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
      )

      if (!res.ok) {
        // Course not found / hidden: leave course null so the not-found UI shows.
        return
      }

      const json = await res.json()
      const data = json.data || json

      const courseData = data.course
      setCourse(courseData)

      const lessonsData = data.lessons || []
      setLessons(lessonsData)

      const modulesData = data.modules || []

      // Compute lesson_count per module from lessons we already have
      const lessonsByModule: Record<string, number> = {}
      for (const l of lessonsData) {
        if (l.module_id) {
          lessonsByModule[l.module_id] = (lessonsByModule[l.module_id] || 0) + 1
        }
      }
      const enrichedModules: Module[] = modulesData.map((m: any) => ({
        ...m,
        lesson_count: lessonsByModule[m.id] || 0,
      }))
      setModules(enrichedModules)

      // Default: expand first module (if any)
      if (enrichedModules.length > 0) {
        setExpandedModules(new Set([enrichedModules[0].id]))
      }

      setIsEnrolled(!!data.isEnrolled)
      if (data.accessResult) {
        setAccessResult(data.accessResult as CourseAccessResult)
      }

      if (user && data.isEnrolled) {
        const completed = new Set<string>(data.completedLessonIds || [])
        setCompletedLessons(completed)

        // Sequential lesson locking
        if (courseData.instructor_id === user.id) {
          // Instructors bypass gating entirely
          setLockMap(new Map())
        } else {
          const lessonIds = lessonsData.map((l: any) => l.id)
          if (lessonIds.length > 0) {
            const quizLessonIds = new Set<string>(data.quizLessonIds || [])
            const passedQuizIds = new Set<string>(data.passedLessonIds || [])

            setLockMap(
              computeLockMap(
                buildLessonSequence(lessonsData, modulesData),
                completed,
                quizLessonIds,
                passedQuizIds
              )
            )
          } else {
            setLockMap(new Map())
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Program sequencing: never enroll into a course that is still locked
    // behind an earlier course in the learner's program.
    if (accessResult?.accessType === 'sequence_locked') {
      const blockingTitle = accessResult.blocking?.title
      showModal(
        'Locked for now',
        blockingTitle
          ? `This course unlocks after you finish "${blockingTitle}". Head there to continue your path.`
          : 'This course unlocks after you finish the previous course in your program. Head there to continue your path.',
        'warning'
      )
      return
    }

    try {
      setEnrolling(true)

      const { error } = await supabase.from('course_enrollments').insert({
        user_id: user.id,
        course_id: course?.id,
        progress_percentage: 0,
      })

      if (error) throw error

      setIsEnrolled(true)
      showModal('Success', 'Successfully enrolled! You can now start learning.', 'success')
    } catch (error: unknown) {
      console.error('Error enrolling:', error)
      showModal(
        'Enrollment not available yet',
        'We could not enroll you in this course right now. Please refresh the page and try again in a moment.',
        'error'
      )
    } finally {
      setEnrolling(false)
    }
  }

  const handleFinishCourse = async () => {
    if (!user || !course) return

    try {
      setFinishingCourse(true)

      // Issuance is server-side: the API re-verifies lesson completion and
      // quiz scores with the service role, so certificates cannot be minted
      // or graded from the browser.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showModal('Error', 'Your session has expired. Please sign in again.', 'error')
        return
      }

      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ course_id: course.id }),
      })
      const result = await res.json().catch(() => ({ code: 'issuance_failed' }))

      switch (result.code) {
        case 'already_exists':
          showModal('Certificate Exists', 'You already have a certificate for this course!', 'info', [
            {
              label: 'View Certificate',
              onClick: () => {
                closeModal()
                router.push(`/certificates/${result.certificate_id}`)
              },
              variant: 'primary',
            },
            { label: 'Close', onClick: closeModal, variant: 'secondary' },
          ])
          return
        case 'incomplete_lessons':
          showModal(
            'Incomplete Course',
            `Please complete all lessons first.\n\nYou've completed ${result.completed} out of ${result.total} lessons.`,
            'warning'
          )
          return
        case 'quizzes_required':
          showModal('Quizzes Required', 'Please pass all quizzes with at least 70% to earn your certificate.', 'warning')
          return
        case 'score_too_low':
          showModal(
            'Score Too Low',
            `Your average quiz score is ${result.avg_score}%.\n\nYou need at least 70% to earn a certificate.`,
            'warning'
          )
          return
        case 'issued':
          setGeneratedCertificateId(result.certificate.id)
          setShowCongratsModal(true)
          return
        default:
          throw new Error('Failed to complete course. Please try again.')
      }
    } catch (error: unknown) {
      console.error('Error finishing course:', error)
      showModal(
        'Not available yet',
        'We could not complete this course right now. Please make sure every lesson is finished and its quiz passed, then try again in a moment.',
        'error'
      )
    } finally {
      setFinishingCourse(false)
    }
  }

  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0)
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0

  const isCohortSponsored = accessResult?.accessType === 'cohort_sponsored'
  const isSequenceLocked = accessResult?.accessType === 'sequence_locked'

  // Program sequencing: while the course is locked behind an earlier course,
  // every lesson stays locked and clicking one points the learner onward.
  const openLesson = (lesson: Lesson, lessonLocked: boolean) => {
    if (isSequenceLocked) {
      toast.warning(
        accessResult?.blocking
          ? `Finish "${accessResult.blocking.title}" first to unlock this course.`
          : 'Finish the previous course in your program first.'
      )
      return
    }
    if (lessonLocked) {
      toast.warning('Complete the previous lesson (and pass its quiz) to unlock this one.')
      return
    }
    router.push(`/courses/${params.slug}/lessons/${lesson.slug}`)
  }

  // Group lessons by module, preserve global lesson numbering
  const lessonIndexMap = new Map<string, number>()
  lessons.forEach((l, idx) => lessonIndexMap.set(l.id, idx))

  const lessonsByModule: Record<string, Lesson[]> = {}
  const unassignedLessons: Lesson[] = []
  for (const l of lessons) {
    if (l.module_id) {
      if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
      lessonsByModule[l.module_id].push(l)
    } else {
      unassignedLessons.push(l)
    }
  }
  // Sort each module's lessons by lesson_order
  for (const mid of Object.keys(lessonsByModule)) {
    lessonsByModule[mid].sort((a, b) => a.lesson_order - b.lesson_order)
  }

  // Count completed per module for progress badges
  const completedPerModule: Record<string, number> = {}
  for (const mid of Object.keys(lessonsByModule)) {
    completedPerModule[mid] = lessonsByModule[mid].filter((l) => completedLessons.has(l.id)).length
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading course..." size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 mb-4">Course not found</p>
          <Button
            onClick={() => router.push('/courses')}
            className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
          >
            <span
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
              aria-hidden="true"
            />
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.actions}
      />

      {/* Congratulations Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-lg w-full p-6 sm:p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-rose-400" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                <span className="font-serif italic text-red-600">Congratulations!</span>
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                You've successfully completed <span className="font-semibold text-gray-900">{course.title}</span>!
              </p>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-800">
                  Your certificate has been generated and is ready to view!
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowCongratsModal(false)
                    router.push(`/certificates/${generatedCertificateId}`)
                  }}
                  className="relative overflow-hidden w-full bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white py-5 rounded-full font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
                    aria-hidden="true"
                  />
                  <Award className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>

                <Button
                  onClick={() => {
                    setShowCongratsModal(false)
                    router.push('/dashboard')
                  }}
                  variant="outline"
                  className="w-full bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white py-5 rounded-full shadow-sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <section className="relative overflow-hidden bg-[#fffcfb]">
        <div className="absolute -top-24 right-[5%] w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-32 left-[0%] w-80 h-80 bg-rose-100/70 rounded-full blur-[100px]" aria-hidden="true" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {course.cover_image_url && (
            <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 shadow-xl">
              <Image src={course.cover_image_url} alt={course.title} fill sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-semibold border border-rose-100">
                  <BookOpen className="w-3 h-3" />
                  Course
                </div>
                {isCohortSponsored && accessResult?.cohort && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                    <GraduationCap className="w-3 h-3" />
                    Sponsored via {accessResult.cohort.programName}
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900 mb-2">{course.title}</h1>
            </div>

            {!isEnrolled && isCohortSponsored && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  Sponsored
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{course.instructor?.full_name}</span>
            </div>
            {modules.length > 0 && (
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
                <Layers className="w-4 h-4 text-gray-500" />
                <span>
                  {modules.length} Module{modules.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span>{lessons.length} Lessons</span>
            </div>
            {totalDuration > 0 && (
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{totalDuration} min</span>
              </div>
            )}
          </div>

          {course.description && <p className="text-sm text-gray-600 max-w-3xl mb-4">{course.description}</p>}

          {isCohortSponsored && accessResult?.cohort && !isEnrolled && (
            <div className="bg-white/85 backdrop-blur border border-purple-100 ring-1 ring-purple-100 rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 text-sm">Institution Sponsored Access</h4>
                  <p className="text-xs text-purple-700 mt-0.5">
                    You have access to this course through{' '}
                    <span className="font-medium">{accessResult.cohort.programName}</span>,{' '}
                    <span className="font-medium">{accessResult.cohort.name}</span>. No payment required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEnrolled && (
            <div className="bg-white/85 backdrop-blur rounded-2xl p-4 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                <span className="text-sm font-bold text-red-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-rose-50 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progressPercentage >= 100
                      ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-400'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {isSequenceLocked && (
            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-amber-100 ring-1 ring-amber-100 shadow-[0_12px_30px_-20px_rgba(217,119,6,0.35)] p-5 flex flex-wrap items-center gap-4">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" aria-hidden="true" />
              <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold text-gray-900 text-sm">This course unlocks later in your program</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {accessResult?.blocking
                    ? `Finish "${accessResult.blocking.title}" first, then this one opens automatically.`
                    : 'Finish the previous course in your program first.'}
                </p>
              </div>
              {accessResult?.blocking && (
                <Button
                  onClick={() => router.push(`/courses/${accessResult.blocking!.slug}`)}
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  Go to {accessResult.blocking.title}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          )}

          {!isEnrolled && !isSequenceLocked && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white px-8 py-5 rounded-full font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                size="lg"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
                  aria-hidden="true"
                />
                {enrolling ? 'Enrolling...' : isCohortSponsored ? 'Start Learning (Sponsored)' : 'Enroll'}
                {isCohortSponsored ? (
                  <GraduationCap className="w-4 h-4 ml-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#fffcfb" />
          </svg>
        </div>
      </section>

      {/* Curriculum */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span
            className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
            aria-hidden="true"
          />
          <div className="px-4 sm:px-6 py-4 border-b border-rose-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold tracking-tight text-gray-900">
                  Course <span className="font-serif italic text-red-600">Curriculum</span>
                </h2>
              </div>
              {isEnrolled && (
                <div className="flex items-center gap-2">
                  {modules.length > 0 && (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      {Object.values(completedPerModule).filter((c, idx) => {
                        const m = modules[idx]
                        return m && c === (lessonsByModule[m.id]?.length || 0) && c > 0
                      }).length}
                      {' / '}
                      {modules.filter((m) => (lessonsByModule[m.id]?.length || 0) > 0).length} modules
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {completedLessons.size} / {lessons.length} lessons
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!isEnrolled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {isCohortSponsored
                    ? 'Click "Start Learning" above to begin your sponsored course'
                    : 'Enroll in this course to start learning'}
                </p>

                {/* Preview modules list for non-enrolled users */}
                {modules.length > 0 && (
                  <div className="mt-6 space-y-2 text-left max-w-2xl mx-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      What you'll learn
                    </p>
                    {modules.map((module, idx) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-rose-100"
                      >
                        <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-500">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{module.title}</h4>
                          <p className="text-xs text-gray-500">
                            {module.lesson_count} lesson{module.lesson_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : lessons.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">No lessons available yet</p>
            ) : (
              <>
                <div className="space-y-3">
                  {/* Modules with their lessons */}
                  {modules.map((module) => {
                    const moduleLessons = lessonsByModule[module.id] || []
                    if (moduleLessons.length === 0) return null

                    const isExpanded = expandedModules.has(module.id)
                    const completedInModule = completedPerModule[module.id] || 0
                    const totalInModule = moduleLessons.length
                    const moduleAllComplete = completedInModule === totalInModule && totalInModule > 0

                    return (
                      <div
                        key={module.id}
                        className="border border-rose-100 rounded-xl overflow-hidden bg-white/70"
                      >
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-rose-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                moduleAllComplete
                                  ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-md shadow-emerald-500/25'
                                  : 'bg-rose-50 border border-rose-100'
                              }`}
                            >
                              {moduleAllComplete ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Layers className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{module.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {completedInModule} of {totalInModule} completed
                                {module.description && (
                                  <span className="ml-2 hidden sm:inline">• {module.description}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-rose-300 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-rose-300 flex-shrink-0 ml-2" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 space-y-2 border-t border-rose-100 bg-rose-50/30">
                            <div className="pt-3 space-y-2">
                              {moduleLessons.map((lesson) => {
                                const globalIndex = lessonIndexMap.get(lesson.id) ?? 0
                                const lessonLocked = !!lockMap.get(lesson.id)?.locked
                                return (
                                  <LessonRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    index={globalIndex}
                                    totalLessonsIndex={globalIndex}
                                    isCompleted={completedLessons.has(lesson.id)}
                                    locked={isSequenceLocked || lessonLocked}
                                    onClick={() => openLesson(lesson, lessonLocked)}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Unassigned lessons (shouldn't happen after backfill but guarded) */}
                  {unassignedLessons.length > 0 && (
                    <div className="border border-rose-100 rounded-xl p-4 bg-white/70">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Other Lessons
                      </p>
                      <div className="space-y-2">
                        {unassignedLessons.map((lesson) => {
                          const globalIndex = lessonIndexMap.get(lesson.id) ?? 0
                          const lessonLocked = !!lockMap.get(lesson.id)?.locked
                          return (
                            <LessonRow
                              key={lesson.id}
                              lesson={lesson}
                              index={globalIndex}
                              totalLessonsIndex={globalIndex}
                              isCompleted={completedLessons.has(lesson.id)}
                              locked={isSequenceLocked || lessonLocked}
                              onClick={() => openLesson(lesson, lessonLocked)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Finish Course Button */}
                <div className="mt-6 pt-6 border-t border-rose-100">
                  <Button
                    onClick={handleFinishCourse}
                    disabled={finishingCourse || completedLessons.size < lessons.length}
                    className={`w-full py-6 text-base font-semibold rounded-full transition-all ${
                      completedLessons.size >= lessons.length
                        ? 'bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white shadow-[0_14px_30px_-10px_rgba(16,185,129,0.55)] ring-1 ring-green-600/40 hover:-translate-y-0.5'
                        : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                    }`}
                    size="lg"
                  >
                    {finishingCourse ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : completedLessons.size < lessons.length ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete All Lessons ({completedLessons.size}/{lessons.length})
                      </>
                    ) : (
                      <>
                        <Award className="w-5 h-5 mr-2" />
                        Finish Course & Get Certificate
                      </>
                    )}
                  </Button>

                  {completedLessons.size === lessons.length && (
                    <p className="text-center text-sm text-gray-600 mt-3 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      You've completed all lessons! Click above to get your certificate.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}