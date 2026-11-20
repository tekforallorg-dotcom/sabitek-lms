'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  Plus,
  Eye,
  Settings,
  ArrowRight,
  BarChart3,
  MessageCircleQuestion,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  status: string
  lessons?: any[]
}

const primaryBtnClass =
  'group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all'

const outlineBtnClass =
  'bg-white border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 text-sm font-medium rounded-full shadow-sm transition-all'

export default function InstructorDashboard() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        // Role routing is the layout guard's job (single authority);
        // duplicating it here caused redirect ping-pong for multi-persona
        // accounts.
        fetchCourses()
      }
    }
  }, [user, loading, router])

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading dashboard..." size="lg" />
      </div>
    )
  }

  const publishedCount = courses.filter(c => c.status === 'published').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalLessons = courses.reduce((acc, course) => acc + (course.lessons?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Greeting + stats ── */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
                Instructor portal
              </p>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 mb-1">
                Welcome back,{' '}
                <span className="font-serif italic text-red-600">
                  {userProfile?.full_name?.split(' ')[0] || 'Instructor'}
                </span>
              </h1>
              <p className="text-sm text-gray-500">
                Manage your courses, track performance, and grow your teaching impact.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Earnings feature hidden */}
              <Button
                onClick={() => router.push('/instructor/questions')}
                variant="outline"
                className={outlineBtnClass}
                size="sm"
              >
                <MessageCircleQuestion className="w-4 h-4 mr-2" />
                Questions
              </Button>
              <Button
                onClick={() => router.push('/instructor/courses/create')}
                className={primaryBtnClass}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            {[
              { icon: BookOpen, label: 'Total Courses', value: courses.length, accent: 'text-gray-900' },
              { icon: CheckCircle, label: 'Published', value: publishedCount, accent: 'text-green-600' },
              { icon: Clock, label: 'Drafts', value: draftCount, accent: 'text-red-600' },
              { icon: Layers, label: 'Total Lessons', value: totalLessons, accent: 'text-gray-900' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className={`text-2xl font-medium tabular-nums ${stat.accent}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
        {/* Onboarding checklist */}
        <div className="mb-6 empty:mb-0">
          <OnboardingChecklist persona="instructor" />
        </div>

        {/* Courses */}
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
          <span
            className="absolute top-0 inset-x-10 h-px bg-gray-200"
            aria-hidden="true"
          />
          <div className="p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Your Courses</h2>
                  <p className="text-xs text-gray-500">
                    Manage your course content and track performance
                  </p>
                </div>
              </div>
              {courses.length > 0 && (
                <Button
                  onClick={() => router.push('/instructor/courses/create')}
                  className={primaryBtnClass}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Course
                </Button>
              )}
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-red-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No courses{' '}
                  <span className="font-serif italic text-red-600">yet</span>
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Start sharing your knowledge with the world. Create your first course
                  and begin your teaching journey.
                </p>
                <Button
                  onClick={() => router.push('/instructor/courses/create')}
                  className={primaryBtnClass}
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
                    className="group rounded-xl p-5 bg-white border border-gray-200 hover:border-gray-200 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <span className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 border ${
                        course.status === 'published'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`} />
                        {course.status === 'published' ? 'Live' : 'Draft'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {course.description || 'No description provided'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-red-400" />
                        {course.lessons?.length || 0} lessons
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/instructor/courses/${course.slug}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white border-gray-200 hover:border-gray-200 hover:bg-gray-50 hover:text-red-600 rounded-full text-xs font-medium transition-all"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Manage
                      </Button>
                      <Button
                        onClick={() => router.push(`/courses/${course.slug}`)}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => router.push(`/instructor/courses/${course.slug}/analytics`)}
                        variant="outline"
                        size="sm"
                        title="Analytics"
                        aria-label="Analytics"
                        className="bg-white border-gray-200 hover:border-gray-200 hover:bg-gray-50 hover:text-red-600 rounded-full px-3 transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {courses.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Plus, title: 'Create Course', desc: 'Start a new course', href: '/instructor/courses/create' },
              { icon: BookOpen, title: 'Browse Courses', desc: 'See all courses', href: '/courses' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 transition-all text-left cursor-pointer"
              >
                <div className="w-11 h-11 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center group-hover:bg-red-700 transition-all duration-300">
                  <action.icon className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-red-200 group-hover:text-red-500 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
