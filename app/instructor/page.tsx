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
  'group relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_12px_26px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(225,29,72,0.6)]'

const outlineBtnClass =
  'bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5'

function BtnSheen() {
  return (
    <span
      className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
      aria-hidden="true"
    />
  )
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
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading dashboard..." size="lg" />
      </div>
    )
  }

  const publishedCount = courses.filter(c => c.status === 'published').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalLessons = courses.reduce((acc, course) => acc + (course.lessons?.length || 0), 0)

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* ── Greeting + stats ── */}
      <section className="relative overflow-hidden border-b border-rose-100/80">
        <div className="absolute -top-24 right-[-8%] w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-[-8%] w-72 h-72 bg-red-50 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
                Instructor portal
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-1">
                Welcome back,{' '}
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
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
                onClick={() => router.push('/instructor/courses/create')}
                className={primaryBtnClass}
                size="sm"
              >
                <BtnSheen />
                <Plus className="w-4 h-4 mr-1.5" />
                Create Course
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-7">
            {[
              { icon: BookOpen, label: 'Total Courses', value: courses.length, accent: 'text-gray-900' },
              { icon: CheckCircle, label: 'Published', value: publishedCount, accent: 'text-emerald-600' },
              { icon: Clock, label: 'Drafts', value: draftCount, accent: 'text-rose-600' },
              { icon: Layers, label: 'Total Lessons', value: totalLessons, accent: 'text-gray-900' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(225,29,72,0.45)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className={`text-2xl font-semibold tabular-nums ${stat.accent}`}>{stat.value}</p>
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
        <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-25px_rgba(225,29,72,0.35)] overflow-hidden">
          <span
            className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
            aria-hidden="true"
          />
          <div className="p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
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
                  <BtnSheen />
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Course
                </Button>
              )}
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-rose-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
                  <BtnSheen />
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group rounded-2xl p-5 bg-gradient-to-b from-white to-rose-50/40 border border-rose-100 ring-1 ring-white shadow-[0_10px_28px_-20px_rgba(225,29,72,0.3)] hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 hover:border-rose-200 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 border ${
                        course.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
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
                        <Layers className="w-3.5 h-3.5 text-rose-400" />
                        {course.lessons?.length || 0} lessons
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/instructor/courses/${course.slug}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white border-rose-100 hover:border-rose-200 hover:bg-rose-50/60 hover:text-red-600 rounded-full text-xs font-semibold transition-all"
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Manage
                      </Button>
                      <Button
                        onClick={() => router.push(`/courses/${course.slug}`)}
                        size="sm"
                        className="flex-1 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-xs font-semibold shadow-[0_8px_18px_-8px_rgba(225,29,72,0.55)] transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Preview
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
                className="group flex items-center gap-4 p-5 bg-white/80 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.3)] hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 transition-all text-left cursor-pointer"
              >
                <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-500 transition-all duration-300">
                  <action.icon className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-200 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
