'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/providers/auth-provider'

interface Lesson {
  id: string
  title: string
  slug: string
  lesson_order: number
  content_type: string
  duration_minutes?: number
}

interface Course {
  id: string
  title: string
  slug: string
  description: string
  difficulty_level: string
  instructor_id: string
  status: string
  cover_image_url?: string
  category?: string
  users?: {
    full_name: string
    email: string
  }
  lessons?: Lesson[]
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuthContext()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return

    // Only redirect if truly not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    // If user is authenticated, fetch course and profile
    if (user) {
      fetchUserProfile(user.id)
      fetchCourseDetails()
    }
  }, [user, authLoading, params.slug])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchCourseDetails = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch course with lessons and instructor info - Fixed query
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          users!instructor_id(full_name, email),
          lessons(id, title, slug, lesson_order, content_type, duration_minutes)
        `)
        .eq('slug', params.slug)
        .single()

      if (courseError) {
        console.error('Error fetching course:', courseError)
        return
      }

      setCourse(courseData)

      // Check enrollment status (but instructors don't need to be enrolled in their own courses)
      if (courseData.instructor_id !== user.id) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .single()

        setIsEnrolled(!!enrollment)
      } else {
        // Instructor can view their own course
        setIsEnrolled(true)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollment = async () => {
    if (!user || !course) return

    // Instructors can't enroll in their own courses
    if (course.instructor_id === user.id) {
      alert("You can't enroll in your own course. You can preview it as the instructor.")
      return
    }

    setEnrolling(true)
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          enrolled_at: new Date().toISOString()
        })

      if (error) {
        console.error('Enrollment error:', error)
        alert('Failed to enroll. Please try again.')
      } else {
        setIsEnrolled(true)
        alert('Successfully enrolled!')
      }
    } catch (error) {
      console.error('Error enrolling:', error)
    } finally {
      setEnrolling(false)
    }
  }

  const viewLesson = (lesson: Lesson) => {
    // Allow viewing if enrolled OR if user is the instructor
    if (isEnrolled || course?.instructor_id === user?.id) {
      router.push(`/courses/${params.slug}/lessons/${lesson.slug}`)
    } else {
      alert('Please enroll in this course to view lessons')
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube': return '📺'
      case 'pdf': return '📄'
      case 'powerpoint': return '📊'
      case 'text': return '📝'
      default: return '📚'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => router.push('/courses')} className="bg-red-500 hover:bg-red-600 text-white">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  const isInstructor = course.instructor_id === user?.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header - No duplicate navigation */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {course.cover_image_url ? (
            <div className="h-64 bg-gray-200">
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <h1 className="text-4xl font-bold text-white">{course.title}</h1>
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600">{course.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(course.difficulty_level)}`}>
                  {course.difficulty_level}
                </span>
                {course.category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {course.category}
                  </span>
                )}
                {isInstructor && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Your Course
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Instructor: <span className="font-medium">{course.users?.full_name || 'Unknown'}</span></p>
                <p>{course.lessons?.length || 0} lessons</p>
              </div>

              {isInstructor ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(`/instructor/courses/${course.slug}`)}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Manage Course
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled
                  >
                    Instructor Preview Mode
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleEnrollment}
                  disabled={isEnrolled || enrolling}
                  className={`${
                    isEnrolled 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  {enrolling ? 'Enrolling...' : isEnrolled ? '✓ Enrolled' : 'Enroll in Course'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {isInstructor 
                    ? "Preview your course content as an instructor"
                    : isEnrolled 
                      ? "Start learning from the lessons below" 
                      : "Enroll to access all lessons"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.lessons && course.lessons.length > 0 ? (
                  <div className="space-y-3">
                    {course.lessons
                      .sort((a, b) => a.lesson_order - b.lesson_order)
                      .map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className={`border rounded-lg p-4 ${
                            isEnrolled || isInstructor
                              ? 'hover:bg-gray-50 cursor-pointer' 
                              : 'opacity-60'
                          }`}
                          onClick={() => (isEnrolled || isInstructor) && viewLesson(lesson)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-medium text-gray-500">
                                {index + 1}
                              </span>
                              <div>
                                <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span title={lesson.content_type}>
                                    {getContentTypeIcon(lesson.content_type)}
                                  </span>
                                  {lesson.duration_minutes && (
                                    <span className="text-sm text-gray-500">
                                      {lesson.duration_minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(isEnrolled || isInstructor) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                              >
                                View Lesson →
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No lessons available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Info Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                  <p className="text-sm text-gray-600">
                    {course.lessons?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0} minutes total
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Level</h4>
                  <p className="text-sm text-gray-600 capitalize">{course.difficulty_level}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Lessons</h4>
                  <p className="text-sm text-gray-600">{course.lessons?.length || 0} lessons</p>
                </div>
                {course.category && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                    <p className="text-sm text-gray-600 capitalize">{course.category}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructor Card - Fixed */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>About Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{course.users?.full_name || 'Instructor Name'}</p>
                <p className="text-sm text-gray-600 mt-1">{course.users?.email || 'No email provided'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}