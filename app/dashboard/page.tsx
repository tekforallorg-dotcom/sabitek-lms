'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import SabiLoader from '@/components/ui/SabiLoader'
import GamificationStrip from '@/components/dashboard/GamificationStrip'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import LeaderboardCard from '@/components/dashboard/LeaderboardCard'
import ResumeCard from '@/components/dashboard/ResumeCard'
import { Lock,
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
      <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-red-50 border border-gray-200 flex items-center justify-center">
          <Icon className="w-4 h-4 text-red-500" />
        </span>
        {children}
      </h2>
      {action}
    </div>
  )
}

const ghostBtnClass =
  'text-xs bg-white/70 border-gray-200 hover:border-gray-200 hover:bg-white hover:text-red-600 rounded-full font-medium transition-all'

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
              className="bg-white rounded-xl border border-gray-200 transition-all p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {item.program?.name || 'Program'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {item.cohort_name}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium flex-shrink-0 ml-2 ${
                    isCompleted
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : item.progress > 0
                      ? 'bg-red-50 text-red-600 border border-gray-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-100'
                  }`}
                >
                  {isCompleted ? 'Completed' : item.progress > 0 ? `${item.progress}%` : 'Not started'}
                </span>
              </div>

              {/* Sponsorship note */}
              {item.sponsorship === 'institution_sponsored' && (
                <p className="flex items-center gap-2 text-xs font-medium text-green-600 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Sponsored access
                </p>
              )}

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500">
                    {item.completed_courses}/{item.total_courses} courses
                  </span>
                  <span className="text-gray-600 font-medium tabular-nums">{item.progress}%</span>
                </div>
                <div className="w-full bg-red-50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-green-600'
                        : item.progress > 0
                        ? 'bg-red-600'
                        : 'bg-red-100'
                    }`}
                    style={{ width: `${Math.max(item.progress, 2)}%` }}
                  />
                </div>
              </div>

              {/* Course chips */}
              {item.courses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.courses.slice(0, 4).map((course: any) =>
                    course.locked ? (
                      <span
                        key={course.id}
                        title="Unlocks after the previous course in your program"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{course.title}</span>
                      </span>
                    ) : (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          course.completed || course.progress === 100
                            ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                            : course.progress > 0
                            ? 'bg-red-50 text-red-600 border-gray-200 hover:bg-red-100'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {course.completed || course.progress === 100 ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <BookOpen className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[120px]">{course.title}</span>
                      </Link>
                    )
                  )}
                  {item.courses.length > 4 && (
                    <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs font-medium">
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
      // Single consolidated loader: verifies the token server-side and runs
      // enrollments + courses + certificates + cohorts in parallel, returning
      // one payload (replaces the old browser-side query waterfall).
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return
      }

      const res = await fetch('/api/learner/dashboard-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const json = await res.json()
        const payload = json.data || json
        setEnrolledCourses(payload.enrolledCourses || [])
        setCertificates(payload.certificates || [])
        setCohorts(payload.cohorts || [])
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading your dashboard..." size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Greeting + resume strip ── */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
                Learner dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 mb-1">
                Welcome back,{' '}
                <span className="font-serif italic text-red-600">
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
                <div className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 transition-all cursor-pointer">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-red-50 border border-gray-200 flex-shrink-0">
                    {continueCourse.course.cover_image_url ? (
                      <Image
                        src={continueCourse.course.cover_image_url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-red-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-red-500 mb-1">
                      Continue learning
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {continueCourse.course.title}
                    </p>
                    <div className="mt-2 h-1 rounded-full bg-red-50 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(continueCourse.progress_percentage, 3)}%` }}
                        className="h-full rounded-full bg-red-600"
                      />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 transition-transform">
                    <Play className="w-4 h-4 text-white ml-1" />
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/courses">
                <Button className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white px-7 py-5 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all">
                  Browse Courses
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Total Courses', value: enrolledCourses.length, accent: 'text-gray-900' },
            { icon: Clock, label: 'In Progress', value: inProgressCount, accent: 'text-red-600' },
            { icon: CheckCircle, label: 'Completed', value: completedCount, accent: 'text-green-600' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-200 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-red-500" />
                </div>
                <TrendingUp className="w-4 h-4 text-red-200" />
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
              <p className={`text-2xl font-medium tabular-nums ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}

          <Link href="/certificates" className="block">
            <div className="group relative overflow-hidden bg-red-600 rounded-xl p-4 ring-1 ring-red-600/50 transition-all h-full cursor-pointer">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl ring-1 ring-white/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/70 transition-transform" />
                </div>
                <p className="text-xs text-white/80 font-medium mb-1">Certificates</p>
                <p className="text-2xl font-medium text-white tabular-nums">{certificates.length}</p>
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
                  className="group bg-white rounded-xl p-5 border border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-xs rounded-full font-medium tabular-nums">
                      {cert.grade_percentage}%
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{cert.course.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/certificates/${cert.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-white border border-gray-200 hover:border-gray-200 hover:bg-gray-50 rounded-full text-xs font-medium text-gray-700 transition-all cursor-pointer">
                        View
                      </button>
                    </Link>
                    <Link href={`/certificates/${cert.id}?download=true`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-all cursor-pointer">
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
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start your{' '}
                <span className="font-serif italic text-red-600">learning journey</span>
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                You haven&apos;t enrolled in any courses yet. Explore the catalog and start learning today.
              </p>
              <Link href="/courses">
                <Button className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white px-8 py-5 text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all">
                  Explore Courses
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
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
                    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative h-28 bg-red-50 overflow-hidden">
                        {enrollment.course.cover_image_url ? (
                          <Image
                            src={enrollment.course.cover_image_url}
                            alt={enrollment.course.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-red-200" />
                          </div>
                        )}

                        {/* Progress badge */}
                        <div className="absolute top-2 right-2">
                          {isCompleted ? (
                            <span className="px-2 py-1 bg-white text-green-600 text-xs rounded-full font-medium flex items-center gap-1 shadow-sm">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          ) : isStarted ? (
                            <span className="px-2 py-1 bg-white text-red-600 text-xs rounded-full font-medium shadow-sm tabular-nums">
                              {progress}%
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full font-medium shadow-sm">
                              New
                            </span>
                          )}
                        </div>

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-red-950/0 group-hover:bg-red-950/25 transition-all flex items-center justify-center">
                          <div className="w-11 h-11 bg-white/95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 transition-all shadow-sm">
                            <Play className="w-4 h-4 text-red-500 ml-1" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          {enrollment.course.instructor?.full_name}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-gray-500">Progress</span>
                            <span className={`font-medium tabular-nums ${isCompleted ? 'text-green-600' : isStarted ? 'text-red-600' : 'text-gray-400'}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-red-50 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-green-600' :
                                isStarted ? 'bg-red-600' :
                                'bg-red-100'
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
          <div className="relative mt-8 overflow-hidden rounded-xl bg-red-600 ring-1 ring-red-600/50 p-7 sm:p-8 text-center">
            <div className="relative">
              <div className="w-12 h-12 mx-auto bg-white/20 ring-1 ring-white/30 rounded-xl flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">
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
