'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface EnrolledCourse {
  id: string
  course_id: string
  progress_percentage: number
  course: {
    id: string
    title: string
    description: string
    instructor_id: string
    slug: string
    cover_image_url?: string
    instructor?: {
      full_name: string
    }
  }
}

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  course: {
    title: string
    cover_image_url?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile?.role === 'instructor') {
        router.push('/instructor')
      } else {
        fetchDashboardData()
      }
    }
  }, [user, userProfile, loading, router])

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data for user:', user?.id)
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:users!courses_instructor_id_fkey(full_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false })

      if (coursesError) {
        console.error('Error fetching enrollments:', coursesError)
        
        if (coursesError.code === 'PGRST116' || coursesError.message.includes('policy')) {
          console.log('RLS policy issue detected - trying alternative query')
          
          const { data: simpleEnrollments, error: simpleError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', user?.id)
          
          if (simpleError) {
            console.error('Simple enrollment query also failed:', simpleError)
            setEnrolledCourses([])
          } else {
            console.log('Simple enrollment query succeeded, fetching courses separately')
            
            const courseIds = simpleEnrollments?.map(e => e.course_id) || []
            if (courseIds.length > 0) {
              const { data: courseDetails } = await supabase
                .from('courses')
                .select(`
                  *,
                  instructor:users!courses_instructor_id_fkey(full_name)
                `)
                .in('id', courseIds)
              
              const combined = simpleEnrollments.map(enrollment => ({
                ...enrollment,
                course: courseDetails?.find(c => c.id === enrollment.course_id) || null
              }))
              
              setEnrolledCourses(combined.filter(e => e.course !== null))
            }
          }
        } else {
          setEnrolledCourses([])
        }
      } else {
        console.log('Enrollments fetched successfully:', coursesData?.length || 0)
        setEnrolledCourses(coursesData || [])
      }

      const { data: certsData, error: certsError } = await supabase
        .from('certificates')
        .select(`
          *,
          course:courses(
            title,
            cover_image_url
          )
        `)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false })
        .limit(3)

      if (certsError) {
        console.error('Error fetching certificates:', certsError)
        setCertificates([])
      } else {
        console.log('Certificates fetched successfully:', certsData?.length || 0)
        setCertificates(certsData || [])
      }
    } catch (error) {
      console.error('Unexpected error fetching dashboard data:', error)
      setEnrolledCourses([])
      setCertificates([])
    } finally {
      setCoursesLoading(false)
    }
  }

  const continueLearning = (courseSlug: string) => {
    router.push(`/courses/${courseSlug}`)
  }

  const completedCount = enrolledCourses.filter(c => c.progress_percentage === 100).length
  const inProgressCount = enrolledCourses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs sm:text-sm text-gray-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Learner'}!
            </h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Continue your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Total Courses */}
          <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </div>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5 sm:mb-1">Total Courses</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5 sm:mb-1">In Progress</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{inProgressCount}</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5 sm:mb-1">Completed</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{completedCount}</p>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-xl p-3 sm:p-5 border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all cursor-pointer group"
               onClick={() => router.push('/certificates')}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-600 font-medium mb-0.5 sm:mb-1">Certificates</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{certificates.length}</p>
          </div>
        </div>

        {/* Certificates Showcase */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              Your Certificates
            </h2>
            {certificates.length > 0 && (
              <Button
                onClick={() => router.push('/certificates')}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600 hover:bg-red-50 text-xs"
              >
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-red-600 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-red-600 group-hover:scale-110 transition-all" />
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
                      {cert.grade_percentage}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1 line-clamp-1">
                    {cert.course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/certificates/${cert.id}`)
                      }}
                      className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-xs font-medium text-gray-700"
                    >
                      View
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/certificates/${cert.id}?download=true`)
                      }}
                      className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 sm:p-8 text-center">
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
              <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
                Complete courses and pass quizzes to earn certificates that showcase your achievements!
              </p>
              <Button
                onClick={() => router.push('/courses')}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
                size="sm"
              >
                Start Learning
              </Button>
            </div>
          )}
        </div>

        {/* My Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              My Courses
            </h2>
            <Button
              onClick={() => router.push('/courses')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              size="sm"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Browse More</span>
              <span className="sm:hidden">Browse</span>
            </Button>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 sm:p-8 text-center">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2">Start Your Learning Journey</h3>
              <p className="text-xs text-gray-600 mb-4 max-w-md mx-auto">
                You haven't enrolled in any courses yet. Explore our courses and start learning today!
              </p>
              <Button
                onClick={() => router.push('/courses')}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
                size="sm"
              >
                Explore Courses
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {enrolledCourses.map((enrollment) => {
                const progress = enrollment.progress_percentage || 0
                const isCompleted = progress === 100
                const isStarted = progress > 0

                return (
                  <div
                    key={enrollment.id}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-red-600 hover:shadow-xl transition-all cursor-pointer flex flex-col"
                    onClick={() => continueLearning(enrollment.course.slug)}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-24 sm:h-28 bg-gray-100 overflow-hidden">
                      {enrollment.course.cover_image_url ? (
                        <img
                          src={enrollment.course.cover_image_url}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Progress Badge */}
                      <div className="absolute top-2 right-2">
                        {isCompleted ? (
                          <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium flex items-center gap-1 border-2 border-white shadow-lg">
                            <CheckCircle className="w-3 h-3" />
                          </span>
                        ) : isStarted ? (
                          <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium border-2 border-white shadow-lg flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            {progress}%
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-700 text-white text-xs rounded-full font-medium border-2 border-white shadow-lg">
                            Start
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        By {enrollment.course.instructor?.full_name}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-green-500' : isStarted ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Continue Button */}
                      <button
                        className="w-full py-1.5 bg-gray-900 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium flex items-center justify-center gap-1 group-hover:shadow-md mt-auto"
                      >
                        {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start'}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}