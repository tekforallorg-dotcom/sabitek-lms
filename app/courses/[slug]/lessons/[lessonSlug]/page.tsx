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
import { 
  Save, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Award,
  X,
  AlertCircle,
  AlertTriangle
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
                  : ''
                }
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
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
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrollmentStatus, setEnrollmentStatus] = useState(false)
  
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
    if (!authLoading && !user) {
      console.log('No user found after auth loaded, redirecting to login')
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && !authLoading) {
      console.log('User authenticated, fetching lesson data')
      fetchLessonData()
    }
  }, [user, authLoading, params.slug, params.lessonSlug])

  const fetchLessonData = async () => {
    if (!user) return

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

      if (courseError) {
        console.error('Course fetch error:', courseError)
        router.push('/courses')
        return
      }

      setCourse(courseData)

      const isInstructor = courseData.instructor_id === user.id
      
      if (isInstructor) {
        console.log('User is instructor, granting access')
        setEnrollmentStatus(true)
      } else {
        const { data: enrollment, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .single()

        console.log('Enrollment check:', enrollment, enrollError)
        setEnrollmentStatus(!!enrollment)
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('lesson_order')

      if (lessonsError) {
        console.error('Lessons fetch error:', lessonsError)
        return
      }
      
      const mappedLessons: Lesson[] = (lessonsData || []).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content || '',
        content_type: lesson.content_type || 'text',
        youtube_url: lesson.youtube_url,
        pdf_url: lesson.pdf_url,
        powerpoint_url: lesson.powerpoint_url,
        video_url: lesson.video_url,
        lesson_order: lesson.lesson_order,
        duration_minutes: lesson.duration_minutes,
        course_id: lesson.course_id
      }))
      
      setLessons(mappedLessons)

      const currentLesson = mappedLessons.find(l => l.slug === params.lessonSlug)
      if (!currentLesson) {
        console.error('Lesson not found')
        router.push(`/courses/${params.slug}`)
        return
      }
      setLesson(currentLesson)

      const { data: progress } = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('lesson_id', currentLesson.id)
        .maybeSingle()

      setIsCompleted(!!progress?.completed_at)
      
      console.log('Fetching notes for lesson:', currentLesson.id, 'and user:', user.id)
      
      const { data: notesData, error: notesError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Notes fetch result:', notesData, 'Error:', notesError)
      
      if (notesData) {
        const noteText = notesData.notes || notesData.content || notesData.note_content || ''
        setNotesContent(noteText)
        setNotesId(notesData.id)
        console.log('Notes loaded successfully')
      } else {
        console.log('No existing notes found for this lesson')
      }
      
      console.log('Fetching quiz for lesson ID:', currentLesson.id)
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .maybeSingle()
      
      console.log('Raw quiz data from DB:', quizData)
      console.log('Quiz fetch error:', quizError)
      
      if (quizData) {
        console.log('Quiz found, checking questions...')
        console.log('Questions type:', typeof quizData.questions)
        console.log('Questions value:', quizData.questions)
        
        let parsedQuestions = quizData.questions
        if (typeof quizData.questions === 'string') {
          try {
            parsedQuestions = JSON.parse(quizData.questions)
            console.log('Parsed questions:', parsedQuestions)
          } catch (e) {
            console.error('Failed to parse questions:', e)
            parsedQuestions = []
          }
        }
        
        if (!Array.isArray(parsedQuestions)) {
          console.log('Questions is not an array, converting...')
          parsedQuestions = []
        }
        
        const quizWithParsedQuestions = {
          ...quizData,
          questions: parsedQuestions
        }
        
        console.log('Final quiz object:', quizWithParsedQuestions)
        
        if (parsedQuestions.length > 0) {
          setQuiz(quizWithParsedQuestions)
          
          const { data: attemptsData } = await supabase
            .from('quiz_attempts')
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', currentLesson.id)
          
          setQuizAttempts(attemptsData?.length || 0)
        } else {
          console.log('Quiz has no questions, not displaying')
        }
      } else {
        console.log('No quiz found for lesson ID:', currentLesson.id)
      }
      
    } catch (error) {
      console.error('Error fetching lesson data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async () => {
    if (!lesson || !user) {
      console.error('❌ Missing required data:', { lesson: !!lesson, user: !!user })
      return
    }

    try {
      console.log('🔍 Attempting to mark complete:', {
        user_id: user.id,
        lesson_id: lesson.id,
        course_id: course?.id,
        timestamp: new Date().toISOString()
      })
      
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          course_id: course?.id,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()

      console.log('📊 Upsert response:', { data, error })

      if (error) {
        console.error('❌ Database error:', error)
        
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          showModal(
            'Permission Error',
            `You don't have permission to mark lessons as complete. This is a database security issue.\n\nError: ${error.message}\n\nPlease contact support or check your Supabase RLS policies.`,
            'warning'
          )
        } else {
          showModal('Error', `Error marking lesson as complete: ${error.message}`, 'error')
        }
        return
      }

      console.log('✅ Progress saved successfully')
      setIsCompleted(true)
      
      const { data: completedLessons, error: progressError } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course?.id)
        .not('completed_at', 'is', null)

      if (progressError) {
        console.error('Error fetching progress:', progressError)
      }

      const progress = Math.round((completedLessons?.length || 0) / lessons.length * 100)
      
      console.log('📈 Updating enrollment progress:', progress + '%')
      
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .update({ progress_percentage: progress })
        .eq('user_id', user.id)
        .eq('course_id', course?.id)

      if (enrollError) {
        console.error('Error updating enrollment:', enrollError)
      }
      
      console.log(`✅ Lesson marked complete - Course progress: ${progress}%`)
      
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      showModal('Error', `An unexpected error occurred: ${error}`, 'error')
    }
  }

  const saveNotes = async () => {
    if (!lesson || !user || !notesContent.trim()) {
      console.log('Missing required data:', { 
        lesson: !!lesson, 
        user: !!user, 
        notesContent: notesContent.trim() 
      })
      return
    }
    
    console.log('Starting save notes process...')
    setSavingNotes(true)
    setNotesSaved(false)
    
    try {
      const { data: existingNote, error: fetchError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lesson.id)
        .eq('user_id', user.id)
        .maybeSingle()
      
      console.log('Existing note check:', { existingNote, fetchError })
      
      if (existingNote) {
        console.log('Updating existing note with ID:', existingNote.id)
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        }
        
        if ('notes' in existingNote) {
          updateData.notes = notesContent.trim()
        } else if ('content' in existingNote) {
          updateData.content = notesContent.trim()
        } else if ('note_content' in existingNote) {
          updateData.note_content = notesContent.trim()
        } else {
          updateData.content = notesContent.trim()
        }
        
        const { data: updatedNote, error: updateError } = await supabase
          .from('lesson_notes')
          .update(updateData)
          .eq('id', existingNote.id)
          .eq('user_id', user.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Update failed:', updateError)
          showModal('Error', `Failed to update notes: ${updateError.message}`, 'error')
        } else {
          console.log('Note updated successfully:', updatedNote)
          setNotesId(existingNote.id)
          setNotesSaved(true)
          setTimeout(() => setNotesSaved(false), 3000)
        }
      } else {
        console.log('Creating new note...')
        
        const noteData = {
          user_id: user.id,
          lesson_id: lesson.id,
          content: notesContent.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('Inserting note data:', noteData)
        
        const { data: newNote, error: insertError } = await supabase
          .from('lesson_notes')
          .insert([noteData])
          .select()
          .single()
        
        if (insertError) {
          console.error('Insert failed with content column:', insertError)
          
          const altNoteData = {
            user_id: user.id,
            lesson_id: lesson.id,
            notes: notesContent.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: altNewNote, error: altInsertError } = await supabase
            .from('lesson_notes')
            .insert([altNoteData])
            .select()
            .single()
          
          if (altInsertError) {
            console.error('Insert also failed with notes column:', altInsertError)
            showModal('Error', 'Failed to create notes. Please check if the table structure is correct.', 'error')
          } else {
            console.log('Note created successfully with notes column:', altNewNote)
            setNotesId(altNewNote.id)
            setNotesSaved(true)
            setTimeout(() => setNotesSaved(false), 3000)
          }
        } else {
          console.log('Note created successfully:', newNote)
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
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
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
          is_correct: isCorrect
        }
      })
      
      const score = Math.round((correctCount / quiz.questions.length) * 100)
      const passed = score >= quiz.pass_percentage
      
      const attemptData = {
        user_id: user.id,
        lesson_id: lesson.id,
        course_id: course.id,
        score_percentage: score,
        passed: passed,
        answers: answers
      }
      
      console.log('Submitting quiz attempt:', attemptData)
      
      const { data: attemptResult, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([attemptData])
        .select()
        .single()
      
      if (attemptError) {
        console.error('Error saving quiz attempt:', attemptError)
        showModal('Error', `Failed to save quiz attempt: ${attemptError.message}`, 'error')
        return
      }
      
      console.log('Quiz attempt saved:', attemptResult)
      
      setQuizResults({
        score,
        passed,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length
      })
      setQuizSubmitted(true)
      setQuizAttempts(prev => prev + 1)
      
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
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
            {lesson.youtube_url?.includes('<iframe') ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: lesson.youtube_url }}
              />
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
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
            <video
              key={lesson.id}
              src={lesson.video_url}
              controls
              className="absolute inset-0 w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'pdf':
        return (
          <div className="w-full">
            <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
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
                className="text-xs rounded-xl border-gray-200 hover:bg-gray-50"
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
                className="text-xs rounded-xl border-gray-200 hover:bg-gray-50"
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
              <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
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
              <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
                <iframe
                  key={lesson.id}
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.powerpoint_url)}`}
                  className="absolute inset-0 w-full h-full"
                  title={lesson.title}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-600 mb-4">PowerPoint preview loading...</p>
                <Button
                  onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                >
                  Open Presentation
                </Button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                variant="outline"
                size="sm"
                className="text-xs rounded-xl border-gray-200 hover:bg-gray-50"
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
                  className="text-xs rounded-xl border-gray-200 hover:bg-gray-50"
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-8 shadow-sm">
            <div 
              className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-red-500 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
            />
          </div>
        )
    }
  }

  // Loading state with gradient
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            {authLoading ? 'Checking authentication...' : 'Loading lesson...'}
          </p>
        </div>
      </div>
    )
  }

  // Enrollment required state
  if (!enrollmentStatus && course?.instructor_id !== user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <Card className="max-w-md w-full rounded-2xl border-gray-100 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl">Enrollment Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm mb-5">
              You need to be enrolled in this course to access the lessons.
            </p>
            <Button 
              onClick={() => router.push(`/courses/${params.slug}`)}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
            >
              Go to Course Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentIndex = lessons.findIndex(l => l.id === lesson?.id)
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.actions}
      />

      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${params.slug}`)}
                size="sm"
                className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 flex-shrink-0 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 break-words">{course?.title}</p>
                <h1 className="text-sm md:text-base font-bold text-white break-words">
                  Lesson {currentIndex + 1}: {lesson?.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lesson?.duration_minutes && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {lesson.duration_minutes}m
                </span>
              )}
              {isCompleted ? (
                <span className="px-2 md:px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-medium flex items-center gap-1 shadow-lg shadow-green-500/20">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Completed</span>
                </span>
              ) : (
                <Button
                  onClick={markAsComplete}
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs rounded-xl shadow-lg shadow-red-500/20"
                >
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
                className="border-gray-200 hover:bg-gray-50 rounded-xl disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                onClick={() => nextLesson && navigateToLesson(nextLesson)}
                disabled={!nextLesson}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* My Notes Card */}
            <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    My Notes
                  </span>
                  {notesSaved && (
                    <span className="text-xs text-green-600 font-normal flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
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
                  className="w-full resize-none text-sm border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl"
                />
                <Button 
                  onClick={saveNotes} 
                  disabled={savingNotes || !notesContent.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-xl"
                  size="sm"
                >
                  <Save className="w-3 h-3 mr-2" />
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Quiz Card */}
            {quiz && quiz.questions && quiz.questions.length > 0 && (
              <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    {quiz.title}
                  </CardTitle>
                  {quiz.description && (
                    <CardDescription className="text-xs">{quiz.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-xs bg-gray-50 rounded-xl p-3">
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
                          {/* Display quiz questions */}
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              return (
                                <div key={questionId} className="p-3 border border-gray-200 rounded-xl bg-gray-50">
                                  <p className="font-medium text-sm mb-2">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <label 
                                        key={optIndex} 
                                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors ${
                                          selectedAnswers[questionId] === optIndex ? 'bg-red-50 border-red-300 border' : 'border border-transparent'
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
                          
                          {/* Submit and Cancel buttons */}
                          <div className="space-y-2">
                            <Button 
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-xl"
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
                              className="w-full text-sm rounded-xl border-gray-200"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* Quiz Results */
                        <div className="space-y-3">
                          <div className={`p-4 rounded-xl text-center ${
                            quizResults?.passed 
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500' 
                              : 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-500'
                          }`}>
                            <h3 className={`text-xl font-bold mb-1 ${
                              quizResults?.passed ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {quizResults?.passed ? '🎉 Passed!' : '📚 Keep Learning!'}
                            </h3>
                            <p className="text-lg font-semibold">
                              Score: {quizResults?.score}%
                            </p>
                            <p className="text-xs mt-1">
                              {quizResults?.correctAnswers} out of {quizResults?.totalQuestions} correct
                            </p>
                          </div>
                          
                          {/* Review Answers */}
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            <h4 className="font-semibold text-sm sticky top-0 bg-white py-2">Review Answers:</h4>
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              const selectedAnswer = selectedAnswers[questionId]
                              const isCorrect = selectedAnswer === question.correct_answer
                              
                              return (
                                <div key={questionId} className={`p-3 border rounded-xl text-sm ${
                                  isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                                }`}>
                                  <p className="font-medium mb-1">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-1 text-xs">
                                    <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                      Your: {question.options[selectedAnswer]}
                                      {isCorrect ? ' ✓' : ' ✗'}
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-green-700">
                                        Correct: {question.options[question.correct_answer]}
                                      </p>
                                    )}
                                    {question.explanation && (
                                      <p className="text-gray-600 italic mt-1">
                                        {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {!quizResults?.passed && (
                              <Button 
                                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm rounded-xl"
                                onClick={() => {
                                  setSelectedAnswers({})
                                  setQuizSubmitted(false)
                                  setQuizResults(null)
                                }}
                                size="sm"
                              >
                                Try Again
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={resetQuiz}
                              className="w-full text-sm rounded-xl border-gray-200"
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
                      className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm rounded-xl shadow-lg shadow-red-500/20"
                      size="sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {quizAttempts > 0 ? `Retake Quiz (#${quizAttempts + 1})` : 'Start Quiz'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Tools - Available to all users */}
            {lesson?.content_type === 'text' && lesson?.content && (
              <>
                <div>
                  <LessonSummary
                    lessonId={lesson.id}
                    lessonContent={lesson.content}
                    contentType={lesson.content_type}
                  />
                </div>
                <div>
                  <LessonQA
                    lessonId={lesson.id}
                    lessonContent={lesson.content}
                    contentType={lesson.content_type}
                  />
                </div>
              </>
            )}
            
            {lesson && lesson.content_type !== 'text' && (
              <>
                <div>
                  <LessonSummary
                    lessonId={lesson.id}
                    contentType={lesson.content_type}
                  />
                </div>
                <div>
                  <LessonQA
                    lessonId={lesson.id}
                    contentType={lesson.content_type}
                  />
                </div>
              </>
            )}
            {/* Practice Quiz Component (fallback if no instructor quiz) */}
            {!quiz && (
              <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    Practice Quiz
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test your understanding with AI-generated questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizTaker 
                    lessonId={lesson?.id || ''}
                    onComplete={() => {
                      console.log('Practice quiz completed')
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Course Lessons */}
            <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  Course Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {lessons.map((l, index) => {
                    const isActive = l.id === lesson?.id
                    return (
                      <button
                        key={l.id}
                        onClick={() => navigateToLesson(l)}
                        className={`w-full text-left p-3 rounded-xl transition-all text-sm group ${
                          isActive
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/20'
                            : 'hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                              Lesson {index + 1}
                            </p>
                            <p className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                              {l.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {l.content_type === 'youtube' && <span title="YouTube" className="text-xs">📺</span>}
                            {l.content_type === 'video' && <span title="Video" className="text-xs">🎥</span>}
                            {l.content_type === 'pdf' && <span title="PDF" className="text-xs">📄</span>}
                            {l.content_type === 'powerpoint' && <span title="PowerPoint" className="text-xs">📊</span>}
                            {l.content_type === 'text' && <span title="Text" className="text-xs">📝</span>}
                            {l.duration_minutes && (
                              <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                                {l.duration_minutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Instructor Info */}
            <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
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