'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import SabiLoader from '@/components/ui/SabiLoader'
import { 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Briefcase,
  Users,
  HelpCircle,
  Play,
  ChevronRight
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  const completedCount = enrolledCourses.filter(c => c.progress_percentage === 100).length
  const inProgressCount = enrolledCourses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length

  if (loading || coursesLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading your dashboard..." size="lg" />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-pink-50 to-red-50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50" />
        
        {/* Floating elements */}
        <div className="absolute top-6 right-[10%] w-16 h-16 bg-gradient-to-br from-red-200/30 to-rose-200/30 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-6 left-[5%] w-12 h-12 bg-gradient-to-br from-pink-200/30 to-red-200/30 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-red-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Learner Dashboard
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">{userProfile?.full_name?.split(' ')[0] || 'Learner'}</span>!
              </h1>
              <p className="text-sm text-gray-600">Continue your learning journey</p>
            </div>
            
            <Link href="/courses">
              <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-5 py-4 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5">
                <Sparkles className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-red-100 group-hover:to-rose-100 rounded-xl flex items-center justify-center transition-all">
                <BookOpen className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
              </div>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Total Courses</p>
            <p className="text-2xl font-black text-gray-900">{enrolledCourses.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">In Progress</p>
            <p className="text-2xl font-black text-orange-600">{inProgressCount}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-100 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Completed</p>
            <p className="text-2xl font-black text-green-600">{completedCount}</p>
          </div>

          <Link href="/certificates" className="block">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all hover:-translate-y-0.5 group h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-white/80 font-medium mb-0.5">Certificates</p>
              <p className="text-2xl font-black text-white">{certificates.length}</p>
            </div>
          </Link>
        </div>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-red-500" />
                Recent Certificates
              </h2>
              <Link href="/certificates">
                <Button variant="outline" size="sm" className="text-xs border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 group-hover:from-red-500 group-hover:to-pink-600 rounded-xl flex items-center justify-center transition-all">
                      <Award className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                      {cert.grade_percentage}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{cert.course.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/certificates/${cert.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                        View
                      </button>
                    </Link>
                    <Link href={`/certificates/${cert.id}?download=true`} className="flex-1">
                      <button className="w-full px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg">
                        Download
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-700" />
              My Courses
            </h2>
            {enrolledCourses.length > 4 && (
              <Link href="/my-courses">
                <Button variant="outline" size="sm" className="text-xs border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Start Your Learning Journey</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                You haven't enrolled in any courses yet. Explore our catalog and start learning today!
              </p>
              <Link href="/courses">
                <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-4 text-sm font-semibold rounded-xl shadow-lg shadow-red-500/25">
                  Explore Courses
                  <ArrowRight className="w-4 h-4 ml-2" />
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
                    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-red-100 transition-all cursor-pointer h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative h-28 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {enrollment.course.cover_image_url ? (
                          <img
                            src={enrollment.course.cover_image_url}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Progress Badge */}
                        <div className="absolute top-2 right-2">
                          {isCompleted ? (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-semibold flex items-center gap-1 shadow-lg">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          ) : isStarted ? (
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold shadow-lg">
                              {progress}%
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full font-semibold shadow-lg">
                              New
                            </span>
                          )}
                        </div>

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all shadow-xl">
                            <Play className="w-5 h-5 text-red-500 ml-0.5" />
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

                        {/* Progress Bar */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className={`font-semibold ${isCompleted ? 'text-green-600' : isStarted ? 'text-orange-600' : 'text-gray-400'}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                                isStarted ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                                'bg-gray-200'
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

        {/* Empty State for Certificates if none */}
        {certificates.length === 0 && enrolledCourses.length > 0 && (
          <div className="mt-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100 p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mb-3">
              <Award className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Earn Your First Certificate</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Complete courses and pass quizzes to earn certificates that showcase your achievements!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-red-600 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{enrolledCourses.length} course{enrolledCourses.length > 1 ? 's' : ''} in progress</span>
            </div>
          </div>
        )}

        {/* Quick Actions - SabiSuite */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
              <p className="text-xs text-gray-500">AI-powered learning tools</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Bot, name: 'SabiBot', desc: 'AI Assistant', href: '/sabibot', color: 'from-red-500 to-rose-500' },
              { icon: HelpCircle, name: 'SabiQuiz', desc: 'Take Quiz', href: '/sabiquiz', color: 'from-blue-500 to-blue-600' },
              { icon: Briefcase, name: 'SabiAdvisor', desc: 'Career Tools', href: '/sabiadvisor', color: 'from-green-500 to-green-600' },
              { icon: Users, name: 'Community', desc: 'Find Mentors', href: '/community', color: 'from-purple-500 to-purple-600' },
            ].map((tool, i) => (
              <Link key={i} href={tool.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className={`w-9 h-9 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}>
                    <tool.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className="font-semibold text-gray-900 text-xs truncate">{tool.name}</p>
                    <p className="text-xs text-gray-500 truncate">{tool.desc}</p>
                  </div>
                  <div className="sm:hidden">
                    <p className="font-semibold text-gray-900 text-xs">{tool.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all ml-auto hidden sm:block" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}