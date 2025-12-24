'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { DollarSign } from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  status: string
  lessons?: any[]
}

export default function InstructorDashboard() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile?.role !== 'instructor') {
        router.push('/dashboard')
      } else {
        fetchCourses()
      }
    }
  }, [user, userProfile, loading, router])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons(id)
        `)
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-xs sm:text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-black">Instructor Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Welcome back, {userProfile?.full_name || user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => router.push('/instructor/billing')}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50 text-xs sm:text-sm w-full sm:w-auto"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="sm:hidden">Earnings</span>
                <span className="hidden sm:inline">View Earnings</span>
              </Button>
              <Button
                onClick={() => router.push('/instructor/courses/create')}
                className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm w-full sm:w-auto"
              >
                <span className="sm:hidden">+ New Course</span>
                <span className="hidden sm:inline">Create New Course</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm lg:text-base text-black">Total Courses</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-red-500">{courses.length}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm lg:text-base text-black">Published</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-green-500">
                {courses.filter(c => c.status === 'published').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm lg:text-base text-black">Drafts</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                {courses.filter(c => c.status === 'draft').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm lg:text-base text-black">Total Lessons</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-500">
                {courses.reduce((acc, course) => acc + (course.lessons?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <Card className="border-gray-200">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base lg:text-lg text-black">Your Courses</CardTitle>
                <CardDescription className="text-xs">Manage your course content and track performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {courses.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <div className="mb-4">
                  <svg className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">You haven't created any courses yet</p>
                <Button
                  onClick={() => router.push('/instructor/courses/create')}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm"
                >
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow border-gray-200">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xs sm:text-sm lg:text-base text-black line-clamp-2">{course.title}</CardTitle>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full whitespace-nowrap ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/instructor/courses/${course.slug}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300 hover:border-red-500 hover:text-red-500 text-xs"
                        >
                          Manage
                        </Button>
                        <Button
                          onClick={() => router.push(`/courses/${course.slug}`)}
                          size="sm"
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs"
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}