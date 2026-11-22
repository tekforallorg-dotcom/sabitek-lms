'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'
import GamificationStrip from '@/components/dashboard/GamificationStrip'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import LeaderboardCard from '@/components/dashboard/LeaderboardCard'
import ResumeCard, { ContinueCourseCard } from '@/components/dashboard/ResumeCard'
import LearnerHome, {
  type Certificate,
  type CohortSummary,
  type EnrolledCourse,
} from '@/components/dashboard/LearnerHome'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, routeResolving } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [cohorts, setCohorts] = useState<CohortSummary[]>([])

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

  if (loading || routeResolving || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading your dashboard..." size="lg" />
      </div>
    )
  }

  // Used when the next lesson is not known: a started course, else any
  // unfinished one.
  const continueCourse =
    enrolledCourses.find((c) => c.progress_percentage > 0 && c.progress_percentage < 100) ||
    enrolledCourses.find((c) => c.progress_percentage < 100)

  return (
    <LearnerHome
      firstName={userProfile?.full_name?.split(' ')[0]}
      enrolledCourses={enrolledCourses}
      certificates={certificates}
      cohorts={cohorts}
      resume={
        <ResumeCard
          fallback={
            continueCourse && (
              <ContinueCourseCard
                title={continueCourse.course.title}
                href={`/courses/${continueCourse.course.slug}`}
                progress={continueCourse.progress_percentage || 0}
              />
            )
          }
        />
      }
      onboarding={<OnboardingChecklist persona="learner" />}
      achievements={
        <div className="space-y-4">
          <GamificationStrip />
          <LeaderboardCard />
        </div>
      }
    />
  )
}
