'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import InstructorHome, { type InstructorCourse } from '@/components/dashboard/InstructorHome'

export default function InstructorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<InstructorCourse[]>([])
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

  return <InstructorHome courses={courses} onboarding={<OnboardingChecklist persona="instructor" />} />
}
