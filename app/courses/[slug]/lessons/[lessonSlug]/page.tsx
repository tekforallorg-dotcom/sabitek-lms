'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/providers/auth-provider'
import LessonSummary from '@/components/ai/lesson-summary'
import LessonQA from '@/components/ai/lesson-qa'
import { Lock } from 'lucide-react'
import QuizTaker from '@/components/quiz/quiz-taker'
import SabiLoader from '@/components/ui/SabiLoader'
import {
  Save,
  BookOpen,
  Clock,
  CheckCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Award,
  X,
  AlertCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  slug: string
  content: string
  content_type: 'text' | 'video' | 'pdf' | 'powerpoint' | 'youtube'
  youtube_url?: string
  pdf_url?: string
  powerpoint_url?: string
  video_url?: string
  lesson_order: number
  duration_minutes?: number
  course_id: string
  module_id?: string | null
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
}

interface Course {
  id: string
  title: string
  instructor_id: string
  instructor?: {
    full_name: string
  }
}

interface Quiz {
  id: string
  title: string
  description?: string
  lesson_id: string
  questions: Array<{
    id: string
    question: string
    options: string[]
    correct_answer: number
    explanation?: string
  }>
  pass_percentage: number
  time_limit?: number
  created_by: string
}

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
    success: 'from-green-500 to-green-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-amber-600',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
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
                    ? 'bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5'
                    : 'bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm'
                }
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
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

export default function LessonViewerPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuthContext()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrollmentStatus, setEnrollmentStatus] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // Notes state
  const [notesContent, setNotesContent] = useState('')
  const [notesId, setNotesId] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
  } | null>(null)

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
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && !authLoading) {
      fetchLessonData()
    }
  }, [user, authLoading, params.slug, params.lessonSlug])

  const fetchLessonData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(
          `
          *,
          instructor:users!courses_instructor_id_fkey(full_name)
        `
        )
        .eq('slug', params.slug)
        .single()

      if (courseError) {
        console.error('Course fetch error:', courseError)
        router.push('/courses')
        return
      }

      setCourse(courseData)

      const isInstructor = courseData.instructor_id === user.id

      // Batch 2: everything that only needs the course id, in parallel
      // (was a serial waterfall of 4 round-trips).
      const [enrollmentRes, lessonsRes, modulesRes, progressRes] = await Promise.all([
        isInstructor
          ? Promise.resolve({ data: { id: 'instructor' } })
          : supabase
              .from('course_enrollments')
              .select('id')
              .eq('user_id', user.id)
              .eq('course_id', courseData.id)
              .single(),
        supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseData.id)
          .order('lesson_order'),
        supabase
          .from('modules')
          .select('id, course_id, title, description, order_index')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .not('completed_at', 'is', null),
      ])

      setEnrollmentStatus(!!enrollmentRes.data)

      const { data: lessonsData, error: lessonsError } = lessonsRes
      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError)
        return
      }

      const mappedLessons: Lesson[] = (lessonsData || []).map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        content: l.content || '',
        content_type: l.content_type || 'text',
        youtube_url: l.youtube_url,
        pdf_url: l.pdf_url,
        powerpoint_url: l.powerpoint_url,
        video_url: l.video_url,
        lesson_order: l.lesson_order,
        duration_minutes: l.duration_minutes,
        course_id: l.course_id,
        module_id: l.module_id,
      }))

      setLessons(mappedLessons)

      const modulesData = modulesRes.data
      setModules(modulesData || [])

      const currentLesson = mappedLessons.find((l) => l.slug === params.lessonSlug)
      if (!currentLesson) {
        console.error('Lesson not found')
        router.push(`/courses/${params.slug}`)
        return
      }
      setLesson(currentLesson)

      // Expand the module containing the current lesson by default
      if (currentLesson.module_id) {
        setExpandedModules(new Set([currentLesson.module_id]))
      } else if (modulesData && modulesData.length > 0) {
        setExpandedModules(new Set([modulesData[0].id]))
      }

      // Completion status came back in batch 2.
      const completedSet = new Set((progressRes.data || []).map((p) => p.lesson_id))
      setCompletedLessonIds(completedSet)
      setIsCompleted(completedSet.has(currentLesson.id))

      // Batch 3: everything keyed on the current lesson, in parallel.
      // Quiz attempts filter by lesson_id, so they don't wait on the quiz row.
      const [notesRes, quizRes, attemptsRes] = await Promise.all([
        supabase
          .from('lesson_notes')
          .select('*')
          .eq('lesson_id', currentLesson.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', currentLesson.id)
          .maybeSingle(),
        supabase
          .from('quiz_attempts')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', currentLesson.id),
      ])

      const notesData = notesRes.data
      if (notesData) {
        const noteText = notesData.notes || notesData.content || notesData.note_content || ''
        setNotesContent(noteText)
        setNotesId(notesData.id)
      } else {
        setNotesContent('')
        setNotesId(null)
      }

      const quizData = quizRes.data
      if (quizData) {
        let parsedQuestions = quizData.questions
        if (typeof quizData.questions === 'string') {
          try {
            parsedQuestions = JSON.parse(quizData.questions)
          } catch (e) {
            console.error('Failed to parse questions:', e)
            parsedQuestions = []
          }
        }

        if (!Array.isArray(parsedQuestions)) {
          parsedQuestions = []
        }

        if (parsedQuestions.length > 0) {
          setQuiz({ ...quizData, questions: parsedQuestions })
          setQuizAttempts(attemptsRes.data?.length || 0)
        } else {
          setQuiz(null)
        }
      } else {
        setQuiz(null)
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async () => {
    if (!lesson || !user) return

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
            course_id: course?.id,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()

      if (error) {
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          showModal(
            'Permission Error',
            `You don't have permission to mark lessons as complete.\n\nError: ${error.message}`,
            'warning'
          )
        } else {
          showModal('Error', `Error marking lesson as complete: ${error.message}`, 'error')
        }
        return
      }

      setIsCompleted(true)
      setCompletedLessonIds((prev) => {
        const next = new Set(prev)
        next.add(lesson.id)
        return next
      })

      const { data: completedLessons } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course?.id)
        .not('completed_at', 'is', null)

      const progress = Math.round(((completedLessons?.length || 0) / lessons.length) * 100)

      await supabase
        .from('course_enrollments')
        .update({ progress_percentage: progress })
        .eq('user_id', user.id)
        .eq('course_id', course?.id)
    } catch (error) {
      console.error('Unexpected error:', error)
      showModal('Error', `An unexpected error occurred: ${error}`, 'error')
    }
  }

  const saveNotes = async () => {
    if (!lesson || !user || !notesContent.trim()) return

    setSavingNotes(true)
    setNotesSaved(false)

    try {
      const { data: existingNote } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lesson.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingNote) {
        const updateData: any = { updated_at: new Date().toISOString() }
        if ('notes' in existingNote) updateData.notes = notesContent.trim()
        else if ('content' in existingNote) updateData.content = notesContent.trim()
        else if ('note_content' in existingNote) updateData.note_content = notesContent.trim()
        else updateData.content = notesContent.trim()

        const { error: updateError } = await supabase
          .from('lesson_notes')
          .update(updateData)
          .eq('id', existingNote.id)
          .eq('user_id', user.id)

        if (updateError) {
          showModal('Error', `Failed to update notes: ${updateError.message}`, 'error')
        } else {
          setNotesId(existingNote.id)
          setNotesSaved(true)
          setTimeout(() => setNotesSaved(false), 3000)
        }
      } else {
        const noteData = {
          user_id: user.id,
          lesson_id: lesson.id,
          content: notesContent.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: newNote, error: insertError } = await supabase
          .from('lesson_notes')
          .insert([noteData])
          .select()
          .single()

        if (insertError) {
          const altNoteData = {
            user_id: user.id,
            lesson_id: lesson.id,
            notes: notesContent.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { data: altNewNote, error: altInsertError } = await supabase
            .from('lesson_notes')
            .insert([altNoteData])
            .select()
            .single()

          if (altInsertError) {
            showModal('Error', 'Failed to create notes. Please check the table structure.', 'error')
          } else {
            setNotesId(altNewNote.id)
            setNotesSaved(true)
            setTimeout(() => setNotesSaved(false), 3000)
          }
        } else {
          setNotesId(newNote.id)
          setNotesSaved(true)
          setTimeout(() => setNotesSaved(false), 3000)
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      showModal('Error', `Unexpected error: ${error}`, 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const submitQuiz = async () => {
    if (!quiz || !user || !lesson || !course) return

    const answeredCount = Object.keys(selectedAnswers).length
    if (answeredCount < quiz.questions.length) {
      showModal(
        'Incomplete Quiz',
        `Please answer all questions. You've answered ${answeredCount} out of ${quiz.questions.length} questions.`,
        'warning'
      )
      return
    }

    try {
      let correctCount = 0
      const answers = quiz.questions.map((question, index) => {
        const questionId = question.id || `q-${index}`
        const selectedAnswer = selectedAnswers[questionId]
        const isCorrect = selectedAnswer === question.correct_answer

        if (isCorrect) correctCount++

        return {
          question_id: questionId,
          selected_answer: selectedAnswer,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
        }
      })

      const score = Math.round((correctCount / quiz.questions.length) * 100)
      const passed = score >= quiz.pass_percentage

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([
          {
            user_id: user.id,
            lesson_id: lesson.id,
            course_id: course.id,
            score_percentage: score,
            passed,
            answers,
          },
        ])
        .select()
        .single()

      if (attemptError) {
        showModal('Error', `Failed to save quiz attempt: ${attemptError.message}`, 'error')
        return
      }

      setQuizResults({
        score,
        passed,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
      })
      setQuizSubmitted(true)
      setQuizAttempts((prev) => prev + 1)

      if (passed && !isCompleted) {
        await markAsComplete()
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      showModal('Error', 'An error occurred while submitting the quiz. Please try again.', 'error')
    }
  }

  const resetQuiz = () => {
    setSelectedAnswers({})
    setQuizSubmitted(false)
    setQuizResults(null)
    setShowQuiz(false)
  }

  const navigateToLesson = (nextLesson: Lesson) => {
    router.push(`/courses/${params.slug}/lessons/${nextLesson.slug}`)
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const getYouTubeEmbedUrl = useCallback((url: string) => {
    if (!url) return ''
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }, [])

  const renderContent = () => {
    if (!lesson) return null

    switch (lesson.content_type) {
      case 'youtube':
        return (
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            {lesson.youtube_url?.includes('<iframe') ? (
              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: lesson.youtube_url }} />
            ) : (
              <iframe
                key={lesson.id}
                src={getYouTubeEmbedUrl(lesson.youtube_url || '')}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )

      case 'video':
        return (
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <video key={lesson.id} src={lesson.video_url} controls className="absolute inset-0 w-full h-full">
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'pdf':
        return (
          <div className="w-full">
            <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
              <iframe
                key={lesson.id}
                src={`${lesson.pdf_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                className="absolute inset-0 w-full h-full"
                title={lesson.title}
                allow="fullscreen"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => window.open(lesson.pdf_url, '_blank')}
                variant="outline"
                size="sm"
                className="text-xs bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Open in New Tab
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = lesson.pdf_url || ''
                  link.download = `${lesson.title}.pdf`
                  link.click()
                }}
                variant="outline"
                size="sm"
                className="text-xs bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )

      case 'powerpoint':
        return (
          <div className="w-full">
            {lesson.powerpoint_url?.includes('docs.google.com/presentation') ||
            lesson.powerpoint_url?.includes('onedrive.live.com') ||
            lesson.powerpoint_url?.includes('office.com') ? (
              <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
                <iframe
                  key={lesson.id}
                  src={lesson.powerpoint_url.replace('/edit', '/embed').replace('/view', '/embed')}
                  className="absolute inset-0 w-full h-full"
                  title={lesson.title}
                  allowFullScreen
                  allow="autoplay"
                />
              </div>
            ) : lesson.powerpoint_url?.includes('.ppt') || lesson.powerpoint_url?.includes('.pptx') ? (
              <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
                <iframe
                  key={lesson.id}
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.powerpoint_url)}`}
                  className="absolute inset-0 w-full h-full"
                  title={lesson.title}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-white/85 backdrop-blur rounded-2xl border-2 border-dashed border-rose-200 p-8 text-center">
                <p className="text-gray-600 mb-4">PowerPoint preview loading...</p>
                <Button
                  onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  Open Presentation
                </Button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                variant="outline"
                size="sm"
                className="text-xs bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Open in New Tab
              </Button>
              {(lesson.powerpoint_url?.includes('.ppt') || lesson.powerpoint_url?.includes('.pptx')) && (
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = lesson.powerpoint_url || ''
                    link.download = `${lesson.title}.pptx`
                    link.click()
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                >
                  Download PowerPoint
                </Button>
              )}
            </div>
          </div>
        )

      case 'text':
      default:
        return (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-5 md:p-8">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div
              className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-red-500 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
            />
          </div>
        )
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text={authLoading ? 'Checking authentication...' : 'Loading lesson...'} />
      </div>
    )
  }

  if (!enrollmentStatus && course?.instructor_id !== user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fffcfb]">
        <Card className="max-w-md w-full relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">Enrollment Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-5">
              You need to be enrolled in this course to access the lessons.
            </p>
            <Button
              onClick={() => router.push(`/courses/${params.slug}`)}
              className="w-full relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
              Go to Course Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentIndex = lessons.findIndex((l) => l.id === lesson?.id)
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  // Global lesson index map (for display numbering)
  const lessonIndexMap = new Map<string, number>()
  lessons.forEach((l, idx) => lessonIndexMap.set(l.id, idx))

  // Group lessons by module
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
  for (const mid of Object.keys(lessonsByModule)) {
    lessonsByModule[mid].sort((a, b) => a.lesson_order - b.lesson_order)
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.actions}
      />

      {/* Header */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur border-b border-rose-100 sticky top-0 z-10 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${params.slug}`)}
                size="sm"
                className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 flex-shrink-0 rounded-full shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 break-words">{course?.title}</p>
                <h1 className="text-sm md:text-base font-semibold tracking-tight text-gray-900 break-words">
                  Lesson {currentIndex + 1}: {lesson?.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lesson?.duration_minutes && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3 text-red-500" />
                  {lesson.duration_minutes}m
                </span>
              )}
              {isCompleted ? (
                <span className="px-2 md:px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Completed</span>
                </span>
              ) : (
                <Button
                  onClick={markAsComplete}
                  size="sm"
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-xs rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            variant="outline"
            size="sm"
            className="w-full bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
          >
            <Layers className="w-4 h-4 mr-2 text-red-500" />
            {showMobileSidebar ? 'Hide Lessons & Tools' : 'Show Lessons & Tools'}
            <ChevronDown
              className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${showMobileSidebar ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lesson Content */}
          <div className="lg:col-span-2 space-y-5">
            {renderContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => previousLesson && navigateToLesson(previousLesson)}
                disabled={!previousLesson}
                className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                onClick={() => nextLesson && navigateToLesson(nextLesson)}
                disabled={!nextLesson}
                className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`${showMobileSidebar ? 'block' : 'hidden'} lg:block lg:col-span-1 space-y-4`}>
            {/* My Notes Card */}
            <Card className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    My Notes
                  </span>
                  {notesSaved && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold flex items-center gap-1 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Take notes while learning..."
                  rows={6}
                  className="w-full resize-none text-sm bg-white/70 border-rose-100 focus:border-rose-300 focus:ring-rose-300 rounded-xl"
                />
                <Button
                  onClick={saveNotes}
                  disabled={savingNotes || !notesContent.trim()}
                  className="w-full relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <Save className="w-3 h-3 mr-2" />
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Quiz Card */}
            {quiz && quiz.questions && quiz.questions.length > 0 && (
              <Card className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] rounded-xl flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    {quiz.title}
                  </CardTitle>
                  {quiz.description && <CardDescription className="text-xs">{quiz.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-xs bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-semibold text-gray-900">{quiz.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pass Score:</span>
                      <span className="font-semibold text-gray-900">{quiz.pass_percentage}%</span>
                    </div>
                    {quiz.time_limit && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-semibold text-gray-900 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.time_limit} min
                        </span>
                      </div>
                    )}
                    {quizAttempts > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Your Attempts:</span>
                        <span className="font-semibold text-gray-900">{quizAttempts}</span>
                      </div>
                    )}
                  </div>

                  {showQuiz ? (
                    <div className="space-y-4">
                      {!quizSubmitted ? (
                        <>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              return (
                                <div key={questionId} className="p-3 border border-rose-100 rounded-xl bg-rose-50/40">
                                  <p className="font-medium text-sm mb-2">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <label
                                        key={optIndex}
                                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors ${
                                          selectedAnswers[questionId] === optIndex
                                            ? 'bg-rose-50 border-rose-200 border'
                                            : 'border border-transparent'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`question-${questionId}`}
                                          checked={selectedAnswers[questionId] === optIndex}
                                          onChange={() => handleAnswerSelect(questionId, optIndex)}
                                          className="mt-0.5 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="space-y-2">
                            <Button
                              className="w-full bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold text-sm rounded-full shadow-[0_14px_30px_-10px_rgba(16,185,129,0.55)] ring-1 ring-green-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                              onClick={submitQuiz}
                              size="sm"
                              disabled={Object.keys(selectedAnswers).length === 0}
                            >
                              Submit Quiz ({Object.keys(selectedAnswers).length}/{quiz.questions.length})
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowQuiz(false)
                                setSelectedAnswers({})
                              }}
                              className="w-full text-sm bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div
                            className={`p-4 rounded-xl text-center ${
                              quizResults?.passed
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-rose-50 border border-rose-100'
                            }`}
                          >
                            <h3
                              className={`text-xl font-semibold tracking-tight mb-1 ${
                                quizResults?.passed ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {quizResults?.passed ? 'Passed!' : 'Keep Learning!'}
                            </h3>
                            <p className="text-lg font-semibold">Score: {quizResults?.score}%</p>
                            <p className="text-xs mt-1">
                              {quizResults?.correctAnswers} out of {quizResults?.totalQuestions} correct
                            </p>
                          </div>

                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            <h4 className="font-semibold text-sm sticky top-0 bg-white/90 backdrop-blur py-2">Review Answers:</h4>
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              const selectedAnswer = selectedAnswers[questionId]
                              const isCorrect = selectedAnswer === question.correct_answer

                              return (
                                <div
                                  key={questionId}
                                  className={`p-3 border rounded-xl text-sm ${
                                    isCorrect ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'
                                  }`}
                                >
                                  <p className="font-medium mb-1">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-1 text-xs">
                                    <p className={isCorrect ? 'text-emerald-700' : 'text-rose-600'}>
                                      Your: {question.options[selectedAnswer]}
                                      {isCorrect ? ' ✓' : ' ✗'}
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-emerald-700">
                                        Correct: {question.options[question.correct_answer]}
                                      </p>
                                    )}
                                    {question.explanation && (
                                      <p className="text-gray-600 italic mt-1">{question.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="space-y-2">
                            {!quizResults?.passed && (
                              <Button
                                className="w-full relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                                onClick={() => {
                                  setSelectedAnswers({})
                                  setQuizSubmitted(false)
                                  setQuizResults(null)
                                }}
                                size="sm"
                              >
                                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                                Try Again
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={resetQuiz}
                              className="w-full text-sm bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                              size="sm"
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowQuiz(true)
                        setQuizSubmitted(false)
                        setQuizResults(null)
                        setSelectedAnswers({})
                      }}
                      className="w-full relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                      size="sm"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {quizAttempts > 0 ? `Retake Quiz (#${quizAttempts + 1})` : 'Start Quiz'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Tools */}
            {lesson?.content_type === 'text' && lesson?.content && (
              <>
                <div>
                  <LessonSummary lessonId={lesson.id} lessonContent={lesson.content} contentType={lesson.content_type} />
                </div>
                <div>
                  <LessonQA lessonId={lesson.id} lessonContent={lesson.content} contentType={lesson.content_type} />
                </div>
              </>
            )}

            {lesson && lesson.content_type !== 'text' && (
              <>
                <div>
                  <LessonSummary lessonId={lesson.id} contentType={lesson.content_type} />
                </div>
                <div>
                  <LessonQA lessonId={lesson.id} contentType={lesson.content_type} />
                </div>
              </>
            )}

            {/* Practice Quiz (fallback) */}
            {!quiz && (
              <Card className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                      <Award className="w-4 h-4 text-red-500" />
                    </div>
                    Practice Quiz
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test your understanding with AI-generated questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizTaker lessonId={lesson?.id || ''} onComplete={() => {}} />
                </CardContent>
              </Card>
            )}

            {/* ══════════════════════════════════════════════════════
                 COURSE NAVIGATION (Modules → Lessons)
                 ══════════════════════════════════════════════════════ */}
            <Card className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] rounded-xl flex items-center justify-center">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    Course Navigation
                  </span>
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
                    {completedLessonIds.size}/{lessons.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {/* Modules */}
                  {modules.map((module) => {
                    const moduleLessons = lessonsByModule[module.id] || []
                    if (moduleLessons.length === 0) return null

                    const isExpanded = expandedModules.has(module.id)
                    const completedInModule = moduleLessons.filter((l) => completedLessonIds.has(l.id)).length
                    const moduleAllComplete = completedInModule === moduleLessons.length && moduleLessons.length > 0

                    return (
                      <div key={module.id} className="border border-rose-100 rounded-xl overflow-hidden bg-white/70">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-3 hover:bg-rose-50/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                moduleAllComplete
                                  ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                                  : 'bg-rose-50 border border-rose-100'
                              }`}
                            >
                              {moduleAllComplete ? (
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Layers className="w-3.5 h-3.5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{module.title}</p>
                              <p className="text-xs text-gray-500">
                                {completedInModule}/{moduleLessons.length} lessons
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-2 pb-2 pt-0 border-t border-rose-100 bg-rose-50/30">
                            <div className="pt-2 space-y-1">
                              {moduleLessons.map((l) => {
                                const isActive = l.id === lesson?.id
                                const isLessonCompleted = completedLessonIds.has(l.id)
                                const globalIndex = lessonIndexMap.get(l.id) ?? 0
                                return (
                                  <button
                                    key={l.id}
                                    onClick={() => navigateToLesson(l)}
                                    className={`w-full text-left p-2.5 rounded-lg transition-all text-sm group ${
                                      isActive
                                        ? 'bg-rose-50/70 border border-rose-100 text-red-600'
                                        : 'hover:bg-rose-50/50 border border-transparent hover:border-rose-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {isLessonCompleted && !isActive ? (
                                          <span className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                          </span>
                                        ) : (
                                          <span
                                            className={`text-xs font-semibold flex-shrink-0 w-5 text-center ${
                                              isActive ? 'text-red-500' : 'text-gray-400'
                                            }`}
                                          >
                                            {globalIndex + 1}
                                          </span>
                                        )}
                                        <p
                                          className={`text-xs font-medium truncate ${
                                            isActive ? 'text-red-600' : 'text-gray-900'
                                          }`}
                                        >
                                          {l.title}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {(l.content_type === 'youtube' || l.content_type === 'video') && (
                                          <PlayCircle
                                            className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-gray-400'}`}
                                          />
                                        )}
                                        {(l.content_type === 'pdf' ||
                                          l.content_type === 'powerpoint' ||
                                          l.content_type === 'text') && (
                                          <FileText
                                            className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-gray-400'}`}
                                          />
                                        )}
                                        {l.duration_minutes && (
                                          <span
                                            className={`text-xs ${
                                              isActive ? 'text-red-400' : 'text-gray-400'
                                            }`}
                                          >
                                            {l.duration_minutes}m
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Unassigned lessons fallback */}
                  {unassignedLessons.length > 0 && (
                    <div className="border border-rose-100 rounded-xl p-3 bg-white/70">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Other Lessons
                      </p>
                      <div className="space-y-1">
                        {unassignedLessons.map((l) => {
                          const isActive = l.id === lesson?.id
                          const isLessonCompleted = completedLessonIds.has(l.id)
                          const globalIndex = lessonIndexMap.get(l.id) ?? 0
                          return (
                            <button
                              key={l.id}
                              onClick={() => navigateToLesson(l)}
                              className={`w-full text-left p-2.5 rounded-lg transition-all text-sm ${
                                isActive
                                  ? 'bg-rose-50/70 border border-rose-100 text-red-600'
                                  : 'hover:bg-rose-50/50 border border-transparent hover:border-rose-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isLessonCompleted && !isActive ? (
                                  <span className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  </span>
                                ) : (
                                  <span
                                    className={`text-xs font-semibold w-5 text-center ${
                                      isActive ? 'text-red-500' : 'text-gray-400'
                                    }`}
                                  >
                                    {globalIndex + 1}
                                  </span>
                                )}
                                <p
                                  className={`text-xs font-medium truncate ${
                                    isActive ? 'text-red-600' : 'text-gray-900'
                                  }`}
                                >
                                  {l.title}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructor Info */}
            <Card className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {course?.instructor?.full_name?.charAt(0) || 'I'}
                    </span>
                  </div>
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-sm text-gray-900">{course?.instructor?.full_name}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}