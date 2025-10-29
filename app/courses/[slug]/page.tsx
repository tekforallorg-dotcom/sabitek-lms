'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  BookOpen, 
  Users, 
  Clock, 
  PlayCircle,
  CheckCircle,
  Award,
  ArrowRight,
  PartyPopper,
  X
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  instructor_id: string
  cover_image_url?: string
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
  const [finishingCourse, setFinishingCourse] = useState(false)
  const [showCongratsModal, setShowCongratsModal] = useState(false)
  const [generatedCertificateId, setGeneratedCertificateId] = useState<string | null>(null)

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
      alert('Successfully enrolled!')
    } catch (error: any) {
      console.error('Error enrolling:', error)
      alert(error.message || 'Failed to enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleFinishCourse = async () => {
    if (!user || !course) return

    try {
      setFinishingCourse(true)

      console.log('🎓 Starting course completion check...')

      // Check if certificate already exists
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle()

      if (existingCert) {
        alert('You already have a certificate for this course!')
        router.push(`/certificates/${existingCert.id}`)
        return
      }

      // Check if all lessons completed
      if (completedLessons.size < lessons.length) {
        alert(`Please complete all lessons first. You've completed ${completedLessons.size} out of ${lessons.length} lessons.`)
        return
      }

      console.log('✅ All lessons completed')

      // Check if course has quizzes
      const lessonIds = lessons.map(l => l.id)
      const { data: courseQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .in('lesson_id', lessonIds)

      const courseHasQuizzes = courseQuizzes && courseQuizzes.length > 0
      console.log(`🎯 Course has ${courseQuizzes?.length || 0} quizzes`)

      let avgScore = 100

      if (courseHasQuizzes) {
        // Check quiz scores
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score_percentage, passed')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .eq('passed', true)

        if (!quizAttempts || quizAttempts.length === 0) {
          alert('Please pass all quizzes with at least 70% to earn your certificate.')
          return
        }

        avgScore = Math.round(
          quizAttempts.reduce((sum, attempt) => sum + attempt.score_percentage, 0) / quizAttempts.length
        )

        if (avgScore < 70) {
          alert(`Your average quiz score is ${avgScore}%. You need at least 70% to earn a certificate.`)
          return
        }

        console.log(`✅ Average quiz score: ${avgScore}%`)
      } else {
        console.log('✅ No quizzes in course - awarding 100%')
      }

      // Generate certificate
      const courseAbbrev = course.title
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 5)
      const timestamp = Date.now()
      const certificateNumber = `SABITEK-${courseAbbrev}-${timestamp}`

      console.log(`🎖️ Generating certificate: ${certificateNumber}`)

      const now = new Date().toISOString()

      const { data: newCert, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          course_id: course.id,
          certificate_number: certificateNumber,
          grade_percentage: avgScore,
          issued_at: now,
          completion_date: now  // ✅ FIXED: Added completion_date
        })
        .select()
        .single()

      if (certError) throw certError

      console.log('🎉 Certificate generated successfully!')

      // Update enrollment
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
      alert(error.message || 'Failed to complete course')
    } finally {
      setFinishingCourse(false)
    }
  }

  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0)
  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons.size / lessons.length) * 100) 
    : 0

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
          <Button onClick={() => router.push('/courses')} className="mt-4">
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Congratulations Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowCongratsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Congratulations!
              </h2>
              
              <p className="text-gray-600 mb-6">
                You've successfully completed <span className="font-semibold text-gray-900">{course.title}</span>!
              </p>
              
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
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
                  className="w-full border-gray-300"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {course.cover_image_url && (
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
          
          <div className="flex items-center gap-6 text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{course.instructor?.full_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>{lessons.length} Lessons</span>
            </div>
            {totalDuration > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{totalDuration} minutes</span>
              </div>
            )}
          </div>

          {course.description && (
            <p className="text-gray-700 max-w-3xl">{course.description}</p>
          )}

          {isEnrolled && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {!isEnrolled && (
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </Button>
          )}
        </div>
      </div>

      {/* Lessons List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Course Lessons</span>
              {isEnrolled && (
                <span className="text-sm text-gray-600">
                  {completedLessons.size} / {lessons.length} completed
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isEnrolled ? (
              <p className="text-center text-gray-600 py-8">
                Enroll in this course to start learning from the lessons below
              </p>
            ) : lessons.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
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
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-300">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors truncate">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {lesson.content_type === 'youtube' && <span>📺 YouTube</span>}
                              {lesson.content_type === 'video' && <span>🎥 Video</span>}
                              {lesson.content_type === 'pdf' && <span>📄 PDF</span>}
                              {lesson.content_type === 'powerpoint' && <span>📊 PowerPoint</span>}
                              {lesson.content_type === 'text' && <span>📝 Text</span>}
                              {lesson.duration_minutes && (
                                <span>• {lesson.duration_minutes}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>

                {/* Finish Course Button */}
                {isEnrolled && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleFinishCourse}
                      disabled={finishingCourse || completedLessons.size < lessons.length}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {finishingCourse ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : completedLessons.size < lessons.length ? (
                        <>
                          <CheckCircle className="w-6 h-6 mr-2" />
                          Complete All Lessons to Finish Course ({completedLessons.size}/{lessons.length})
                        </>
                      ) : (
                        <>
                          <Award className="w-6 h-6 mr-2" />
                          Finish Course & Get Certificate
                        </>
                      )}
                    </Button>
                    
                    {completedLessons.size === lessons.length && (
                      <p className="text-center text-sm text-gray-600 mt-3">
                        🎉 You've completed all lessons! Click above to generate your certificate.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}