'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Layers,
  Plus,
  Eye,
  Settings,
  ArrowRight,
  TrendingUp,
  GraduationCap
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-sm text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const publishedCount = courses.filter(c => c.status === 'published').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalLessons = courses.reduce((acc, course) => acc + (course.lessons?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-pink-900/20" />
        
        {/* Floating elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-white/10">
                <GraduationCap className="w-3 h-3" />
                Instructor Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Instructor'}!
              </h1>
              <p className="text-gray-400 text-sm">
                Manage your courses, track performance, and grow your teaching impact.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/instructor/billing')}
                variant="outline"
                className="border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-1.5" />
                View Earnings
              </Button>
              <Button
                onClick={() => router.push('/instructor/courses/create')}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Course
              </Button>
            </div>
          </div>

          {/* Stats Grid - Inside Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Courses</p>
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Published</p>
                  <p className="text-2xl font-bold text-white">{publishedCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Drafts</p>
                  <p className="text-2xl font-bold text-white">{draftCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Lessons</p>
                  <p className="text-2xl font-bold text-white">{totalLessons}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Courses Section */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Your Courses</CardTitle>
                  <CardDescription className="text-xs">
                    Manage your course content and track performance
                  </CardDescription>
                </div>
              </div>
              {courses.length > 0 && (
                <Button
                  onClick={() => router.push('/instructor/courses/create')}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Course
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Start sharing your knowledge with the world. Create your first course and begin your teaching journey.
                </p>
                <Button
                  onClick={() => router.push('/instructor/courses/create')}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="group border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-lg hover:border-gray-200 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        course.status === 'published'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {course.status === 'published' ? '● Live' : '○ Draft'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {course.description || 'No description provided'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {course.lessons?.length || 0} lessons
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/instructor/courses/${course.slug}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:border-red-300 hover:text-red-600 rounded-xl text-xs"
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Manage
                      </Button>
                      <Button
                        onClick={() => router.push(`/courses/${course.slug}`)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {courses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/instructor/courses/create')}
              className="group flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center group-hover:from-red-100 group-hover:to-pink-100 transition-colors">
                <Plus className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Create Course</h3>
                <p className="text-xs text-gray-500">Start a new course</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => router.push('/instructor/billing')}
              className="group flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">View Analytics</h3>
                <p className="text-xs text-gray-500">Track your earnings</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => router.push('/courses')}
              className="group flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Browse Courses</h3>
                <p className="text-xs text-gray-500">See all courses</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}