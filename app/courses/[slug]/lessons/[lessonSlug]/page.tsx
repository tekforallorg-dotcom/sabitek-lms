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
import QuizTaker from '@/components/quiz/quiz-taker'
import { Save, BookOpen, Clock, CheckCircle, PlayCircle } from 'lucide-react'

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

  // Redirect if not authenticated after auth loads
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('No user found after auth loaded, redirecting to login')
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  // Fetch lesson data when user is authenticated
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
      
      // Fetch course data
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

      // Check if user is the instructor
      const isInstructor = courseData.instructor_id === user.id
      
      if (isInstructor) {
        console.log('User is instructor, granting access')
        setEnrollmentStatus(true)
      } else {
        // Check enrollment for learners
        const { data: enrollment, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .single()

        console.log('Enrollment check:', enrollment, enrollError)
        setEnrollmentStatus(!!enrollment)
      }

      // Fetch all lessons
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

      // Find current lesson
      const currentLesson = mappedLessons.find(l => l.slug === params.lessonSlug)
      if (!currentLesson) {
        console.error('Lesson not found')
        router.push(`/courses/${params.slug}`)
        return
      }
      setLesson(currentLesson)

      // Check if completed
      const { data: progress } = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('lesson_id', currentLesson.id)
        .maybeSingle()

      setIsCompleted(!!progress?.completed_at)
      
      // Fetch notes for this lesson
      console.log('Fetching notes for lesson:', currentLesson.id, 'and user:', user.id)
      
      const { data: notesData, error: notesError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', currentLesson.id)
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Notes fetch result:', notesData, 'Error:', notesError)
      
      if (notesData) {
        // Try different column names since 'notes' might not exist
        const noteText = notesData.notes || notesData.content || notesData.note_content || ''
        setNotesContent(noteText)
        setNotesId(notesData.id)
        console.log('Notes loaded successfully')
      } else {
        console.log('No existing notes found for this lesson')
      }
      
      // Fetch quiz for this lesson (created by instructor)
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
        
        // Parse questions if they're stored as a string
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
        
        // Ensure questions is an array
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
          
          // Fetch number of attempts
          const { data: attemptsData } = await supabase
            .from('quiz_attempts')
            .select('id')
            .eq('user_id', user.id)
            .eq('quiz_id', quizData.id)
          
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
    if (!lesson || !user) return

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          course_id: course?.id,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (!error) {
        setIsCompleted(true)
        
        const { data: completedLessons } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', course?.id)
          .not('completed_at', 'is', null)

        const progress = Math.round((completedLessons?.length || 0) / lessons.length * 100)
        
        await supabase
          .from('course_enrollments')
          .update({ progress_percentage: progress })
          .eq('user_id', user.id)
          .eq('course_id', course?.id)
      }
    } catch (error) {
      console.error('Error marking as complete:', error)
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
      // Check if a note already exists for this lesson
      const { data: existingNote, error: fetchError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lesson.id)
        .eq('user_id', user.id)
        .maybeSingle()
      
      console.log('Existing note check:', { existingNote, fetchError })
      
      if (existingNote) {
        // Update existing note - try different column names
        console.log('Updating existing note with ID:', existingNote.id)
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        }
        
        // Try to update the correct column
        if ('notes' in existingNote) {
          updateData.notes = notesContent.trim()
        } else if ('content' in existingNote) {
          updateData.content = notesContent.trim()
        } else if ('note_content' in existingNote) {
          updateData.note_content = notesContent.trim()
        } else {
          // Default to 'content' if we can't determine the column
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
          alert(`Failed to update notes: ${updateError.message}`)
        } else {
          console.log('Note updated successfully:', updatedNote)
          setNotesId(existingNote.id)
          setNotesSaved(true)
          setTimeout(() => setNotesSaved(false), 3000)
        }
      } else {
        // Create new note
        console.log('Creating new note...')
        
        // Try to insert with 'content' column first
        const noteData = {
          user_id: user.id,
          lesson_id: lesson.id,
          content: notesContent.trim(), // Using 'content' instead of 'notes'
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
          
          // Try with 'notes' column if 'content' failed
          const altNoteData = {
            user_id: user.id,
            lesson_id: lesson.id,
            notes: notesContent.trim(), // Try 'notes' column
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
            alert(`Failed to create notes. Please check if the table structure is correct.`)
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
      alert(`Unexpected error: ${error}`)
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
    if (!quiz || !user || !lesson) return
    
    // Check if all questions are answered
    const answeredCount = Object.keys(selectedAnswers).length
    if (answeredCount < quiz.questions.length) {
      alert(`Please answer all questions. You've answered ${answeredCount} out of ${quiz.questions.length} questions.`)
      return
    }
    
    try {
      // Calculate score
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
      
      // Prepare attempt data
      const attemptData = {
        user_id: user.id,
        quiz_id: quiz.id,
        lesson_id: lesson.id,
        score: score,
        passed: passed,
        answers: answers,
        completed_at: new Date().toISOString()
      }
      
      console.log('Submitting quiz attempt:', attemptData)
      
      // Save to database
      const { data: attemptResult, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert([attemptData])
        .select()
        .single()
      
      if (attemptError) {
        console.error('Error saving quiz attempt:', attemptError)
        alert(`Failed to save quiz attempt: ${attemptError.message}`)
        return
      }
      
      console.log('Quiz attempt saved:', attemptResult)
      
      // Update local state
      setQuizResults({
        score,
        passed,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length
      })
      setQuizSubmitted(true)
      setQuizAttempts(prev => prev + 1)
      
      // If passed and lesson not completed, mark as complete
      if (passed && !isCompleted) {
        await markAsComplete()
      }
      
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('An error occurred while submitting the quiz. Please try again.')
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

  // Memoize the YouTube embed URL to prevent recalculation
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
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-xl">
            {lesson.youtube_url?.includes('<iframe') ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: lesson.youtube_url }}
              />
            ) : (
              <iframe
                key={lesson.id} // Add key to prevent re-render
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
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-xl">
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
            <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden shadow-xl">
              <iframe
                key={lesson.id}
                src={`${lesson.pdf_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                className="absolute inset-0 w-full h-full"
                title={lesson.title}
                allow="fullscreen"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                onClick={() => window.open(lesson.pdf_url, '_blank')}
                variant="outline"
                size="sm"
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
              <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden shadow-xl">
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
              <div className="relative aspect-video w-full bg-gray-100 rounded-lg overflow-hidden shadow-xl">
                <iframe
                  key={lesson.id}
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.powerpoint_url)}`}
                  className="absolute inset-0 w-full h-full"
                  title={lesson.title}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">PowerPoint preview loading...</p>
                <Button
                  onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Open Presentation
                </Button>
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <Button
                onClick={() => window.open(lesson.powerpoint_url, '_blank')}
                variant="outline"
                size="sm"
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
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
            />
          </div>
        )
    }
  }

  // Show loading while checking auth or fetching data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Loading lesson...'}
          </p>
        </div>
      </div>
    )
  }

  // Check enrollment after loading
  if (!enrollmentStatus && course?.instructor_id !== user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Enrollment Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need to be enrolled in this course to access the lessons.
            </p>
            <Button 
              onClick={() => router.push(`/courses/${params.slug}`)}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${params.slug}`)}
                className="border-gray-300"
              >
                ← Back to Course
              </Button>
              <div>
                <p className="text-sm text-gray-500">{course?.title}</p>
                <h1 className="text-xl font-bold">
                  Lesson {currentIndex + 1}: {lesson?.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lesson?.duration_minutes && (
                <span className="text-sm text-gray-500">
                  {lesson.duration_minutes} min
                </span>
              )}
              {isCompleted ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  ✓ Completed
                </span>
              ) : (
                <Button
                  onClick={markAsComplete}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            {renderContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => previousLesson && navigateToLesson(previousLesson)}
                disabled={!previousLesson}
                className="border-gray-300"
              >
                ← Previous Lesson
              </Button>
              <Button
                onClick={() => nextLesson && navigateToLesson(nextLesson)}
                disabled={!nextLesson}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Next Lesson →
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* My Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    My Notes
                  </span>
                  {notesSaved && (
                    <span className="text-sm text-green-600 font-normal">
                      Saved!
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Take notes while watching the lesson..."
                  rows={8}
                  className="w-full mb-4 resize-none"
                />
                <Button 
                  onClick={saveNotes} 
                  disabled={savingNotes || !notesContent.trim()}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Quiz Card */}
            {quiz && quiz.questions && quiz.questions.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {quiz.title}
                  </CardTitle>
                  {quiz.description && (
                    <CardDescription>{quiz.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{quiz.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pass Score:</span>
                      <span className="font-medium">{quiz.pass_percentage}%</span>
                    </div>
                    {quiz.time_limit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-medium flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {quiz.time_limit} min
                        </span>
                      </div>
                    )}
                    {quizAttempts > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Your Attempts:</span>
                        <span className="font-medium">{quizAttempts}</span>
                      </div>
                    )}
                  </div>
                  
                  {showQuiz ? (
                    <div className="space-y-4">
                      {!quizSubmitted ? (
                        <>
                          {/* Display quiz questions */}
                          <div className="space-y-4">
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              return (
                                <div key={questionId} className="p-4 border rounded-lg">
                                  <p className="font-medium mb-3">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <label 
                                        key={optIndex} 
                                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                          selectedAnswers[questionId] === optIndex ? 'bg-blue-50 border-blue-300 border' : ''
                                        }`}
                                      >
                                        <input 
                                          type="radio" 
                                          name={`question-${questionId}`}
                                          checked={selectedAnswers[questionId] === optIndex}
                                          onChange={() => handleAnswerSelect(questionId, optIndex)}
                                          className="text-blue-600"
                                        />
                                        <span>{option}</span>
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
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={submitQuiz}
                              disabled={Object.keys(selectedAnswers).length === 0}
                            >
                              Submit Quiz ({Object.keys(selectedAnswers).length}/{quiz.questions.length} answered)
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowQuiz(false)
                                setSelectedAnswers({})
                              }}
                              className="w-full"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* Quiz Results */
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg text-center ${
                            quizResults?.passed ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
                          } border-2`}>
                            <h3 className={`text-2xl font-bold mb-2 ${
                              quizResults?.passed ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {quizResults?.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
                            </h3>
                            <p className="text-lg font-semibold">
                              Your Score: {quizResults?.score}%
                            </p>
                            <p className="text-sm mt-1">
                              {quizResults?.correctAnswers} out of {quizResults?.totalQuestions} correct
                            </p>
                            <p className="text-sm mt-2">
                              {quizResults?.passed 
                                ? `You passed! (Required: ${quiz.pass_percentage}%)`
                                : `You need ${quiz.pass_percentage}% to pass. Try again!`}
                            </p>
                          </div>
                          
                          {/* Review Answers */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">Review Your Answers:</h4>
                            {quiz.questions.map((question, index) => {
                              const questionId = question.id || `q-${index}`
                              const selectedAnswer = selectedAnswers[questionId]
                              const isCorrect = selectedAnswer === question.correct_answer
                              
                              return (
                                <div key={questionId} className={`p-4 border rounded-lg ${
                                  isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                                }`}>
                                  <p className="font-medium mb-2">
                                    {index + 1}. {question.question}
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                      Your answer: {question.options[selectedAnswer]}
                                      {isCorrect ? ' ✓' : ' ✗'}
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-green-700">
                                        Correct answer: {question.options[question.correct_answer]}
                                      </p>
                                    )}
                                    {question.explanation && (
                                      <p className="text-gray-600 italic mt-2">
                                        Explanation: {question.explanation}
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
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSelectedAnswers({})
                                  setQuizSubmitted(false)
                                  setQuizResults(null)
                                }}
                              >
                                Try Again
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={resetQuiz}
                              className="w-full"
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {quizAttempts > 0 ? `Retake Quiz (Attempt ${quizAttempts + 1})` : 'Start Quiz'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Tools */}
            {lesson?.content_type === 'text' && lesson?.content && (
              <>
                <div className="mt-4">
                  <LessonSummary
                    lessonId={lesson.id}
                    lessonContent={lesson.content}
                    contentType={lesson.content_type}
                  />
                </div>
                <div className="mt-4">
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
                <div className="mt-4">
                  <LessonSummary
                    lessonId={lesson.id}
                    contentType={lesson.content_type}
                  />
                </div>
                <div className="mt-4">
                  <LessonQA
                    lessonId={lesson.id}
                    contentType={lesson.content_type}
                  />
                </div>
              </>
            )}

            {/* Practice Quiz Component (fallback if no instructor quiz) */}
            {!quiz && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Practice Quiz</CardTitle>
                  <CardDescription>
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
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((l, index) => {
                    const isActive = l.id === lesson?.id
                    return (
                      <button
                        key={l.id}
                        onClick={() => navigateToLesson(l)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-red-50 border-2 border-red-500'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Lesson {index + 1}</p>
                            <p className={`font-medium ${isActive ? 'text-red-600' : ''}`}>
                              {l.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {l.content_type === 'youtube' && <span title="YouTube">📺</span>}
                            {l.content_type === 'video' && <span title="Video">🎥</span>}
                            {l.content_type === 'pdf' && <span title="PDF">📄</span>}
                            {l.content_type === 'powerpoint' && <span title="PowerPoint">📊</span>}
                            {l.content_type === 'text' && <span title="Text">📝</span>}
                            {l.duration_minutes && (
                              <span className="text-xs text-gray-500">{l.duration_minutes}m</span>
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
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{course?.instructor?.full_name}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}