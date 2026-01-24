'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PurchaseCourseModal } from '@/components/courses/PurchaseCourseModal'
import SabiLoader from '@/components/ui/SabiLoader'
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
  ShoppingCart,
  Play,
  Sparkles,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'

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
}

// Custom Modal Component (replaces alert/confirm)
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
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />
  }

  const bgMap = {
    info: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-amber-600'
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3 justify-end">
          {actions ? (
            actions.map((action, i) => (
              <Button
                key={i}
                onClick={action.onClick}
                variant={action.variant === 'secondary' ? 'outline' : 'default'}
                className={action.variant === 'primary' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl'
                  : 'rounded-xl'
                }
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
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

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [finishingCourse, setFinishingCourse] = useState(false)
  const [showCongratsModal, setShowCongratsModal] = useState(false)
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Modal state (replaces alert)
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
    type: 'info'
  })

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', actions?: ModalProps['actions']) => {
    setModal({ isOpen: true, title, message, type, actions })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    if (!authLoading) {
      fetchCourseData()
    }
  }, [authLoading, params.slug])

  const fetchCourseData = async () => {
    try {
      setLoading(true)

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(full_name)
        `)
        .eq('slug', params.slug)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('lesson_order')

      setLessons(lessonsData || [])

      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .maybeSingle()

        setIsEnrolled(!!enrollment)

        if (!courseData.is_free && courseData.price > 0) {
          const { data: purchase } = await supabase
            .from('course_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseData.id)
            .eq('status', 'successful')
            .maybeSingle()
          
          setHasPurchased(!!purchase)
        } else {
          setHasPurchased(true)
        }

        if (enrollment) {
          const { data: progress } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('course_id', courseData.id)
            .not('completed_at', 'is', null)

          const completed = new Set(progress?.map(p => p.lesson_id) || [])
          setCompletedLessons(completed)
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      setEnrolling(true)
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course?.id,
          progress_percentage: 0
        })

      if (error) throw error
      
      setIsEnrolled(true)
      showModal('Success', 'Successfully enrolled! You can now start learning.', 'success')
    } catch (error: any) {
      console.error('Error enrolling:', error)
      showModal('Enrollment Failed', error.message || 'Failed to enroll. Please try again.', 'error')
    } finally {
      setEnrolling(false)
    }
  }

  const handlePurchase = () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!course) return
    setShowPurchaseModal(true)
  }

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false)
    setHasPurchased(true)
    setIsEnrolled(true)
    fetchCourseData()
  }

  const handleFinishCourse = async () => {
    if (!user || !course) return

    try {
      setFinishingCourse(true)

      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle()

      if (existingCert) {
        showModal(
          'Certificate Exists',
          'You already have a certificate for this course!',
          'info',
          [
            {
              label: 'View Certificate',
              onClick: () => {
                closeModal()
                router.push(`/certificates/${existingCert.id}`)
              },
              variant: 'primary'
            },
            {
              label: 'Close',
              onClick: closeModal,
              variant: 'secondary'
            }
          ]
        )
        return
      }

      if (completedLessons.size < lessons.length) {
        showModal(
          'Incomplete Course',
          `Please complete all lessons first.\n\nYou've completed ${completedLessons.size} out of ${lessons.length} lessons.`,
          'warning'
        )
        return
      }

      const lessonIds = lessons.map(l => l.id)
      const { data: courseQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .in('lesson_id', lessonIds)

      const courseHasQuizzes = courseQuizzes && courseQuizzes.length > 0
      let avgScore = 100

      if (courseHasQuizzes) {
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score_percentage, passed')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .eq('passed', true)

        if (!quizAttempts || quizAttempts.length === 0) {
          showModal(
            'Quizzes Required',
            'Please pass all quizzes with at least 70% to earn your certificate.',
            'warning'
          )
          return
        }

        avgScore = Math.round(
          quizAttempts.reduce((sum, attempt) => sum + attempt.score_percentage, 0) / quizAttempts.length
        )

        if (avgScore < 70) {
          showModal(
            'Score Too Low',
            `Your average quiz score is ${avgScore}%.\n\nYou need at least 70% to earn a certificate.`,
            'warning'
          )
          return
        }
      }

      const courseAbbrev = course.title
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 5)
      const timestamp = Date.now()
      const certificateNumber = `SABITEK-${courseAbbrev}-${timestamp}`

      const now = new Date().toISOString()

      const { data: newCert, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          course_id: course.id,
          certificate_number: certificateNumber,
          grade_percentage: avgScore,
          issued_at: now,
          completion_date: now
        })
        .select()
        .single()

      if (certError) throw certError

      await supabase
        .from('course_enrollments')
        .update({
          progress_percentage: 100,
          completed_at: now
        })
        .eq('user_id', user.id)
        .eq('course_id', course.id)

      setGeneratedCertificateId(newCert.id)
      setShowCongratsModal(true)

    } catch (error: any) {
      console.error('Error finishing course:', error)
      showModal('Error', error.message || 'Failed to complete course. Please try again.', 'error')
    } finally {
      setFinishingCourse(false)
    }
  }

  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0)
  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons.size / lessons.length) * 100) 
    : 0

  const isFree = course?.is_free || course?.price === 0 || !course?.price

  if (loading || authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <SabiLoader text="Loading course..." />
    </div>
  )
}

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">Course not found</p>
          <Button onClick={() => router.push('/courses')} className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl">
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Modal (replaces alert) */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.actions}
      />

      {/* Purchase Modal */}
      {course && (
        <PurchaseCourseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          course={{
            id: course.id,
            title: course.title,
            price: course.price || 0,
            currency: course.currency
          }}
          onSuccess={handlePurchaseSuccess}
        />
      )}
      
      {/* Congratulations Modal - Enhanced */}
      {showCongratsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                🎉 Congratulations!
              </h2>
              
              <p className="text-sm text-gray-600 mb-6">
                You've successfully completed <span className="font-semibold text-gray-900">{course.title}</span>!
              </p>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
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
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-5 rounded-xl font-semibold shadow-lg shadow-red-500/25"
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
                  className="w-full border-gray-200 hover:bg-gray-50 py-5 rounded-xl"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Header with Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-pink-50 to-red-50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50" />
        
        {/* Floating elements */}
        <div className="absolute top-6 right-[10%] w-16 h-16 bg-gradient-to-br from-red-200/30 to-rose-200/30 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-20 left-[5%] w-12 h-12 bg-gradient-to-br from-pink-200/30 to-red-200/30 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Cover Image */}
          {course.cover_image_url && (
            <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 shadow-xl">
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}
          
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-red-200">
                <BookOpen className="w-3 h-3" />
                Course
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-2">{course.title}</h1>
            </div>
            
            {/* Price Badge */}
            {!isEnrolled && (
              <div className="flex-shrink-0">
                {isFree ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25">
                    Free
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-lg font-black bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25">
                    ₦{course.price?.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{course.instructor?.full_name}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span>{lessons.length} Lessons</span>
            </div>
            {totalDuration > 0 && (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{totalDuration} min</span>
              </div>
            )}
          </div>

          {course.description && (
            <p className="text-sm text-gray-600 max-w-3xl mb-4">{course.description}</p>
          )}

          {/* Progress Bar for Enrolled */}
          {isEnrolled && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                <span className="text-sm font-bold text-red-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Enroll / Purchase Button */}
          {!isEnrolled && (
            <div className="flex flex-wrap gap-3">
              {isFree ? (
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-5 rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
                  size="lg"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll for Free'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : hasPurchased ? (
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-5 rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
                  size="lg"
                >
                  {enrolling ? 'Enrolling...' : 'Start Learning'}
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-5 rounded-xl font-semibold shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {purchasing ? 'Processing...' : `Buy Course - ₦${course.price?.toLocaleString()}`}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Lessons List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-900">Course Lessons</h2>
              </div>
              {isEnrolled && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {completedLessons.size} / {lessons.length} completed
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {!isEnrolled ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {isFree 
                    ? 'Enroll in this course to start learning'
                    : hasPurchased 
                      ? 'Click "Start Learning" above to begin'
                      : 'Purchase this course to access all lessons'
                  }
                </p>
                {!isFree && !hasPurchased && (
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {purchasing ? 'Processing...' : `Buy Course - ₦${course.price?.toLocaleString()}`}
                  </Button>
                )}
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                No lessons available yet
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                    const isCompleted = completedLessons.has(lesson.id)
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => router.push(`/courses/${params.slug}/lessons/${lesson.slug}`)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all group hover:shadow-md"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-md shadow-green-500/25' 
                              : 'bg-white border-2 border-gray-200 group-hover:border-red-200'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-sm font-bold text-gray-500 group-hover:text-red-500 transition-colors">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              {lesson.content_type === 'youtube' && <span>📺 YouTube</span>}
                              {lesson.content_type === 'video' && <span>🎥 Video</span>}
                              {lesson.content_type === 'pdf' && <span>📄 PDF</span>}
                              {lesson.content_type === 'powerpoint' && <span>📊 PPT</span>}
                              {lesson.content_type === 'text' && <span>📝 Text</span>}
                              {lesson.duration_minutes && (
                                <span>• {lesson.duration_minutes}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </button>
                    )
                  })}
                </div>

                {/* Finish Course Button */}
                {isEnrolled && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Button
                      onClick={handleFinishCourse}
                      disabled={finishingCourse || completedLessons.size < lessons.length}
                      className={`w-full py-6 text-base font-bold rounded-xl transition-all ${
                        completedLessons.size >= lessons.length
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                        <Sparkles className="w-4 h-4 text-green-500" />
                        You've completed all lessons! Click above to get your certificate.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}