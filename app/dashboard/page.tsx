'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import SabiLoader from '@/components/ui/SabiLoader'
import GamificationStrip from '@/components/dashboard/GamificationStrip'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import LeaderboardCard from '@/components/dashboard/LeaderboardCard'
import ResumeCard from '@/components/dashboard/ResumeCard'
import {
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  Play,
  GraduationCap,
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

/* Section heading with thin gradient rule */
function SectionHeading({
  icon: Icon,
  children,
  action,
}: {
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-500" />
        </span>
        {children}
      </h2>
      {action}
    </div>
  )
}

const ghostBtnClass =
  'text-xs bg-white/70 border-rose-100 hover:border-rose-200 hover:bg-white hover:text-red-600 rounded-full font-semibold transition-all'

/* ── My Cohorts / Programs Section (receives data, no fetching) ── */
function MyCohorts({ cohorts }: { cohorts: any[] }) {
  if (cohorts.length === 0) return null

  return (
    <div className="mb-8">
      <SectionHeading
        icon={GraduationCap}
        action={
          <Link href="/cohorts/join">
            <Button variant="outline" size="sm" className={ghostBtnClass}>
              Join Cohort
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        }
      >
        My Programs
      </SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cohorts.map((item) => {
          const isCompleted = item.progress === 100

          return (
            <div
              key={item.cohort_id}
              className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 transition-all p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {item.program?.name || 'Program'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {item.cohort_name}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs rounded-full font-semibold flex-shrink-0 ml-2 ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : item.progress > 0
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-gray-50 text-gray-500 border border-gray-100'
                  }`}
                >
                  {isCompleted ? 'Completed' : item.progress > 0 ? `${item.progress}%` : 'Not started'}
                </span>
              </div>

              {/* Sponsorship note */}
              {item.sponsorship === 'institution_sponsored' && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sponsored access
                </p>
              )}

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">
                    {item.completed_courses}/{item.total_courses} courses
                  </span>
                  <span className="text-gray-600 font-semibold tabular-nums">{item.progress}%</span>
                </div>
                <div className="w-full bg-rose-50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                        : item.progress > 0
                        ? 'bg-gradient-to-r from-red-500 to-pink-400'
                        : 'bg-rose-100'
                    }`}
                    style={{ width: `${Math.max(item.progress, 2)}%` }}
                  />
                </div>
              </div>

              {/* Course chips */}
              {item.courses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.courses.slice(0, 4).map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        course.progress === 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          : course.progress > 0
                          ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                          : 'bg-white text-gray-600 border-rose-100 hover:bg-rose-50/60'
                      }`}
                    >
                      {course.progress === 100 ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <BookOpen className="w-3 h-3" />
                      )}
                      <span className="truncate max-w-[120px]">{course.title}</span>
                    </Link>
                  ))}
                  {item.courses.length > 4 && (
                    <span className="px-2.5 py-1 bg-white border border-rose-100 text-gray-500 rounded-lg text-xs font-medium">
                      +{item.courses.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, routeResolving } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [cohorts, setCohorts] = useState<any[]>([])

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
        if (coursesError.code === 'PGRST116' || coursesError.message.includes('policy')) {
          const { data: simpleEnrollments, error: simpleError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', user?.id)

          if (!simpleError && simpleEnrollments) {
            const courseIds = simpleEnrollments.map(e => e.course_id)
            if (courseIds.length > 0) {
              const { data: courseDetails } = await supabase
                .from('courses')
                .select(`*, instructor:users!courses_instructor_id_fkey(full_name)`)
                .in('id', courseIds)

              const combined = simpleEnrollments.map(enrollment => ({
                ...enrollment,
                course: courseDetails?.find(c => c.id === enrollment.course_id) || null
              }))
              setEnrolledCourses(combined.filter(e => e.course !== null))
            }
          }
        }
      } else {
        setEnrolledCourses(coursesData || [])
      }

      const { data: certsData } = await supabase
        .from('certificates')
        .select(`*, course:courses(title, cover_image_url)`)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false })
        .limit(3)

      setCertificates(certsData || [])

      // Fetch cohort memberships
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch('/api/cohorts/my-cohorts', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          const json = await res.json()
          const cohortData = json.data?.cohorts || json.cohorts
          if (res.ok && cohortData) {
            setCohorts(cohortData)
          }
        }
      } catch (cohortErr) {
        console.error('Failed to load cohorts:', cohortErr)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  const completedCount = enrolledCourses.filter(c => c.progress_percentage === 100).length
  const inProgressCount = enrolledCourses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length
  // Most recently enrolled course that is started but unfinished, for the resume card.
  const continueCourse = enrolledCourses.find(
    c => c.progress_percentage > 0 && c.progress_percentage < 100
  ) || enrolledCourses.find(c => c.progress_percentage < 100)

  if (loading || routeResolving || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading your dashboard..." size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* ── Greeting + resume strip ── */}
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
                Learner dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-1">
                Welcome back,{' '}
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                  {userProfile?.full_name?.split(' ')[0] || 'Learner'}
                </span>
              </h1>
              <p className="text-sm text-gray-500">
                {inProgressCount > 0
                  ? `You have ${inProgressCount} course${inProgressCount > 1 ? 's' : ''} in progress. Keep going.`
                  : 'Pick up where you left off, or start something new.'}
              </p>
            </div>

            {/* Resume card */}
            {continueCourse ? (
              <Link href={`/courses/${continueCourse.course.slug}`} className="lg:w-96">
                <div className="group flex items-center gap-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_18px_40px_-22px_rgba(225,29,72,0.4)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-22px_rgba(225,29,72,0.5)] cursor-pointer">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex-shrink-0">
                    {continueCourse.course.cover_image_url ? (
                      <img
                        src={continueCourse.course.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-rose-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-0.5">
                      Continue learning
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {continueCourse.course.title}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-rose-50 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(continueCourse.progress_percentage, 3)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-400"
                      />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_8px_18px_-6px_rgba(225,29,72,0.55)] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/courses">
                <Button className="group relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white px-7 py-5 text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  Browse Courses
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Onboarding checklist + gamification strip ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        <ResumeCard />
        <OnboardingChecklist persona="learner" />
        <GamificationStrip />
      </div>

      {/* ── Weekly leaderboard ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <LeaderboardCard />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {[
            { icon: BookOpen, label: 'Total Courses', value: enrolledCourses.length, accent: 'text-gray-900' },
            { icon: Clock, label: 'In Progress', value: inProgressCount, accent: 'text-rose-600' },
            { icon: CheckCircle, label: 'Completed', value: completedCount, accent: 'text-emerald-600' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/85 backdrop-blur rounded-2xl p-4 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(225,29,72,0.45)] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-red-500" />
                </div>
                <TrendingUp className="w-4 h-4 text-rose-200" />
              </div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">{stat.label}</p>
              <p className={`text-2xl font-semibold tabular-nums ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}

          <Link href="/certificates" className="block">
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 ring-1 ring-red-600/50 shadow-[0_18px_40px_-18px_rgba(225,29,72,0.6)] hover:shadow-[0_24px_50px_-18px_rgba(225,29,72,0.7)] transition-all hover:-translate-y-0.5 h-full cursor-pointer">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl ring-1 ring-white/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-white/80 font-medium mb-0.5">Certificates</p>
                <p className="text-2xl font-semibold text-white tabular-nums">{certificates.length}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── My Programs & Cohorts ── */}
        <MyCohorts cohorts={cohorts} />

        {/* ── Recent Certificates ── */}
        {certificates.length > 0 && (
          <div className="mb-8">
            <SectionHeading
              icon={Award}
              action={
                <Link href="/certificates">
                  <Button variant="outline" size="sm" className={ghostBtnClass}>
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              }
            >
              Recent Certificates
            </SectionHeading>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="group bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-full font-semibold tabular-nums">
                      {cert.grade_percentage}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{cert.course.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/certificates/${cert.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-white border border-rose-100 hover:border-rose-200 hover:bg-rose-50/60 rounded-full text-xs font-semibold text-gray-700 transition-all cursor-pointer">
                        View
                      </button>
                    </Link>
                    <Link href={`/certificates/${cert.id}?download=true`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-xs font-semibold transition-all shadow-[0_8px_18px_-8px_rgba(225,29,72,0.55)] hover:shadow-[0_10px_22px_-8px_rgba(225,29,72,0.6)] cursor-pointer">
                        Download
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── My Courses ── */}
        <div>
          <SectionHeading
            icon={BookOpen}
            action={
              enrolledCourses.length > 4 ? (
                <Link href="/my-courses">
                  <Button variant="outline" size="sm" className={ghostBtnClass}>
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : undefined
            }
          >
            My Courses
          </SectionHeading>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-25px_rgba(225,29,72,0.35)] p-10 text-center">
              <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-rose-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start your{' '}
                <span className="font-serif italic text-red-600">learning journey</span>
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                You haven&apos;t enrolled in any courses yet. Explore the catalog and start learning today.
              </p>
              <Link href="/courses">
                <Button className="group relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white px-8 py-5 text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  Explore Courses
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {enrolledCourses.slice(0, 8).map((enrollment) => {
                const progress = enrollment.progress_percentage || 0
                const isCompleted = progress === 100
                const isStarted = progress > 0

                return (
                  <Link key={enrollment.id} href={`/courses/${enrollment.course.slug}`}>
                    <div className="group bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative h-28 bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden">
                        {enrollment.course.cover_image_url ? (
                          <img
                            src={enrollment.course.cover_image_url}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-rose-200" />
                          </div>
                        )}

                        {/* Progress badge */}
                        <div className="absolute top-2 right-2">
                          {isCompleted ? (
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-emerald-600 text-xs rounded-full font-semibold flex items-center gap-1 shadow-sm">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          ) : isStarted ? (
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-rose-600 text-xs rounded-full font-semibold shadow-sm tabular-nums">
                              {progress}%
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-gray-600 text-xs rounded-full font-semibold shadow-sm">
                              New
                            </span>
                          )}
                        </div>

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-rose-950/0 group-hover:bg-rose-950/25 transition-all flex items-center justify-center">
                          <div className="w-11 h-11 bg-white/95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-xl">
                            <Play className="w-4 h-4 text-red-500 ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          {enrollment.course.instructor?.full_name}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-500">Progress</span>
                            <span className={`font-semibold tabular-nums ${isCompleted ? 'text-emerald-600' : isStarted ? 'text-rose-600' : 'text-gray-400'}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-rose-50 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                isStarted ? 'bg-gradient-to-r from-red-500 to-pink-400' :
                                'bg-rose-100'
                              }`}
                              style={{ width: `${Math.max(progress, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Earn-first-certificate nudge ── */}
        {certificates.length === 0 && enrolledCourses.length > 0 && (
          <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 ring-1 ring-red-600/50 shadow-[0_30px_60px_-30px_rgba(225,29,72,0.6)] p-7 sm:p-8 text-center">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-16 -right-12 w-56 h-56 bg-white/10 rounded-full blur-[60px]" />
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-white/20 backdrop-blur ring-1 ring-white/30 rounded-2xl flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Earn your first{' '}
                <span className="font-serif italic">certificate</span>
              </h3>
              <p className="text-sm text-white/85 max-w-md mx-auto">
                Complete courses and pass quizzes to earn QR-verified certificates.
                You have {enrolledCourses.length} course{enrolledCourses.length > 1 ? 's' : ''} in progress.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
