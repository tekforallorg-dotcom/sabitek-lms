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
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-medium text-white">{title}</h3>
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
                    ? 'relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all'
                    : 'bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm'
                }
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
              size="sm"
            >
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
      className={`w-full flex items-center justify-between p-4 bg-white/70 border border-gray-200 rounded-xl transition-all group ${
        locked
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:bg-gray-50 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            locked
              ? 'bg-gray-50 border border-gray-200'
              : isCompleted
              ? 'bg-green-600 shadow-sm'
              : 'bg-white border border-gray-200 group-hover:border-gray-200'
          }`}
        >
          {locked ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : isCompleted ? (
            <CheckCircle className="w-5 h-5 text-white" />
          ) : (
            <span className="text-sm font-medium text-gray-500 group-hover:text-red-500 transition-colors">
              {totalLessonsIndex + 1}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <h3
            className={`text-sm font-medium transition-colors line-clamp-1 ${
              locked ? 'text-gray-500' : 'text-gray-900 group-hover:text-red-600'
            }`}
          >
            {lesson.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            {lesson.content_type === 'youtube' && <span className="uppercase tracking-wide font-medium text-red-400">YouTube</span>}
            {lesson.content_type === 'video' && <span className="uppercase tracking-wide font-medium text-red-400">Video</span>}
            {lesson.content_type === 'pdf' && <span className="uppercase tracking-wide font-medium text-red-400">PDF</span>}
            {lesson.content_type === 'powerpoint' && <span className="uppercase tracking-wide font-medium text-red-400">PPT</span>}
            {lesson.content_type === 'text' && <span className="uppercase tracking-wide font-medium text-red-400">Text</span>}
            {lesson.content_type === 'quiz' && <span className="uppercase tracking-wide font-medium text-red-400">Quiz</span>}
            {lesson.duration_minutes && <span>• {lesson.duration_minutes}m</span>}
          </div>
        </div>
      </div>

      {locked ? (
        <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 ml-2" />
      ) : (
        <ArrowRight className="w-5 h-5 text-red-200 group-hover:text-red-500 transition-all flex-shrink-0 ml-2" />
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading course..." size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 mb-4">Course not found</p>
          <Button
            onClick={() => router.push('/courses')}
            className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
          >
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 max-w-lg w-full p-6 sm:p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-red-50 hover:bg-red-100 border border-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-medium tracking-tight text-gray-900 mb-2">
                <span className="font-serif italic text-red-600">Congratulations!</span>
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                You&apos;ve successfully completed <span className="font-medium text-gray-900">{course.title}</span>!
              </p>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  Your certificate has been generated and is ready to view!
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowCongratsModal(false)
                    router.push(`/certificates/${generatedCertificateId}`)
                  }}
                  className="relative overflow-hidden w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-full font-medium ring-1 ring-red-600/50 transition-all"
                >
                  <Award className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>

                <Button
                  onClick={() => {
                    setShowCongratsModal(false)
                    router.push('/dashboard')
                  }}
                  variant="outline"
                  className="w-full bg-white border border-gray-200 hover:border-gray-200 hover:bg-white py-5 rounded-full shadow-sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {course.cover_image_url && (
            <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden mb-6 shadow-sm">
              <Image src={course.cover_image_url} alt={course.title} fill sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                  <BookOpen className="w-3 h-3" />
                  Course
                </div>
                {isCohortSponsored && accessResult?.cohort && (
                  <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                    <GraduationCap className="w-3 h-3" />
                    Sponsored via {accessResult.cohort.programName}
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-gray-900 mb-2">{course.title}</h1>
            </div>

            {!isEnrolled && isCohortSponsored && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white shadow-sm">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Sponsored
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{course.instructor?.full_name}</span>
            </div>
            {modules.length > 0 && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                <Layers className="w-4 h-4 text-gray-500" />
                <span>
                  {modules.length} Module{modules.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span>{lessons.length} Lessons</span>
            </div>
            {totalDuration > 0 && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{totalDuration} min</span>
              </div>
            )}
          </div>

          {course.description && <p className="text-sm text-gray-600 max-w-3xl mb-4">{course.description}</p>}

          {isCohortSponsored && accessResult?.cohort && !isEnrolled && (
            <div className="bg-white border border-gray-100 ring-1 ring-gray-100 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Institution Sponsored Access</h4>
                  <p className="text-xs text-gray-700 mt-1">
                    You have access to this course through{' '}
                    <span className="font-medium">{accessResult.cohort.programName}</span>,{' '}
                    <span className="font-medium">{accessResult.cohort.name}</span>. No payment required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEnrolled && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Your Progress</span>
                <span className="text-sm font-medium text-red-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-red-50 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progressPercentage >= 100
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {isSequenceLocked && (
            <div className="relative overflow-hidden bg-white rounded-xl border border-amber-100 ring-1 ring-amber-100 p-5 flex flex-wrap items-center gap-4">
              <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
              <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium text-gray-900 text-sm">This course unlocks later in your program</p>
                <p className="text-xs text-gray-500 mt-1">
                  {accessResult?.blocking
                    ? `Finish "${accessResult.blocking.title}" first, then this one opens automatically.`
                    : 'Finish the previous course in your program first.'}
                </p>
              </div>
              {accessResult?.blocking && (
                <Button
                  onClick={() => router.push(`/courses/${accessResult.blocking!.slug}`)}
                  className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all"
                  size="sm"
                >
                  Go to {accessResult.blocking.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {!isEnrolled && !isSequenceLocked && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white px-8 py-5 rounded-full font-medium ring-1 ring-red-600/50 transition-all"
                size="lg"
              >
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
        <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200">
          <span
            className="absolute top-0 inset-x-10 h-px bg-gray-200"
            aria-hidden="true"
          />
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-medium tracking-tight text-gray-900">
                  Course <span className="font-serif italic text-red-600">Curriculum</span>
                </h2>
              </div>
              {isEnrolled && (
                <div className="flex items-center gap-2">
                  {modules.length > 0 && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-gray-200">
                      {Object.values(completedPerModule).filter((c, idx) => {
                        const m = modules[idx]
                        return m && c === (lessonsByModule[m.id]?.length || 0) && c > 0
                      }).length}
                      {' / '}
                      {modules.filter((m) => (lessonsByModule[m.id]?.length || 0) > 0).length} modules
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {completedLessons.size} / {lessons.length} lessons
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!isEnrolled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      What you&apos;ll learn
                    </p>
                    {modules.map((module, idx) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-gray-200"
                      >
                        <div className="w-8 h-8 bg-red-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-red-500">{idx + 1}</span>
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
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white/70"
                      >
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                moduleAllComplete
                                  ? 'bg-green-600 shadow-sm'
                                  : 'bg-red-50 border border-gray-200'
                              }`}
                            >
                              {moduleAllComplete ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Layers className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{module.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {completedInModule} of {totalInModule} completed
                                {module.description && (
                                  <span className="ml-2 hidden sm:inline">• {module.description}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-red-300 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-red-300 flex-shrink-0 ml-2" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-200 bg-gray-50">
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
                    <div className="border border-gray-200 rounded-xl p-4 bg-white/70">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
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
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleFinishCourse}
                    disabled={finishingCourse || completedLessons.size < lessons.length}
                    className={`w-full py-6 text-base font-medium rounded-full transition-all ${
                      completedLessons.size >= lessons.length
                        ? 'bg-green-600 hover:bg-green-700 text-white ring-1 ring-green-600/40'
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
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      You&apos;ve completed all lessons! Click above to get your certificate.
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