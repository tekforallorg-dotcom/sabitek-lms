'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fetchPublicProfiles } from '@/lib/public-profiles'
import SabiLoader from '@/components/ui/SabiLoader'
import {
  Award,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  ArrowLeft,
  BookOpen
} from 'lucide-react'

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  completion_date: string
  kind?: 'course' | 'program'
  course: {
    id: string
    title: string
    description: string
    thumbnail_url?: string
    instructor_id?: string | null
    instructor?: {
      full_name: string
    }
  } | null
  program?: {
    name: string
    institution?: { name: string } | null
  } | null
}

function CertificatesContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificatesLoading, setCertificatesLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCertificates()
    }
  }, [user, loading, router])

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          course:courses(
            id,
            title,
            description,
            thumbnail_url,
            instructor_id
          ),
          program:programs(
            name,
            institution:institutions(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false })

      if (error) throw error

      // Instructors are other users: resolve their names through the
      // public-profile lookup rather than an embed of the users table.
      const rows = (data || []) as Certificate[]
      const profiles = await fetchPublicProfiles(rows.map((c) => c.course?.instructor_id))
      for (const cert of rows) {
        const name = cert.course?.instructor_id
          ? profiles.get(cert.course.instructor_id)?.full_name
          : null
        if (cert.course && name) cert.course.instructor = { full_name: name }
      }

      setCertificates(rows)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setCertificatesLoading(false)
    }
  }

  const handleView = (certId: string) => {
    router.push(`/certificates/${certId}`)
  }

  if (loading || certificatesLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading certificates..." size="lg" />
    </div>
  )
}
  const latestCertDate = certificates.length > 0
    ? new Date(certificates[0].issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A'

  const averageGrade = certificates.length > 0
    ? Math.round(certificates.reduce((sum, cert) => sum + cert.grade_percentage, 0) / certificates.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Backdrop washes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      </div>

      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-4">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center ring-1 ring-red-600/40">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900">
                My <span className="font-serif italic text-red-600">certificates</span>
              </h1>
              <p className="text-gray-500 text-sm">
                Your achievements and completed courses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200">
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Certificates</p>
            <p className="text-3xl font-medium tracking-tight text-gray-900">{certificates.length}</p>
          </div>

          <div className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200">
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latest Certificate</p>
            <p className="text-xl font-medium tracking-tight text-gray-900">{latestCertDate}</p>
          </div>

          <div className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200">
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Average Grade</p>
            <p className="text-3xl font-medium tracking-tight text-green-600">{averageGrade}%</p>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <div className="w-20 h-20 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-red-300" />
            </div>
            <h3 className="text-xl font-medium tracking-tight text-gray-900 mb-2">
              No certificates <span className="font-serif italic text-red-600">yet</span>
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete courses and pass quizzes to earn certificates that showcase your achievements
            </p>
            <Link
              href="/courses"
              className="relative overflow-hidden inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium ring-1 ring-red-600/50 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all group"
              >
                <span className="absolute top-0 inset-x-10 h-px bg-gray-200 z-10" aria-hidden="true" />
                {/* Certificate Preview */}
                <div className="relative h-44 bg-gray-50 p-5 flex flex-col items-center justify-center border-b border-gray-200">
                  {/* Decorative border effect */}
                  <div className="absolute top-3 left-3 right-3 h-1 bg-red-600 rounded-t-lg"></div>

                  <Award className="w-12 h-12 text-gray-800 mb-2 transition-transform relative z-10" strokeWidth={1.5} />
                  <div className="text-center relative z-10">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-[0.2em]">
                      {cert.kind === 'program' ? 'Program Certificate' : 'Certificate of Completion'}
                    </p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 px-4">
                      {cert.kind === 'program' ? cert.program?.name || 'Program' : cert.course?.title || 'Course'}
                    </p>
                    {cert.kind === 'program' && cert.program?.institution?.name && (
                      <p className="text-xs text-gray-400 mt-1">by {cert.program.institution.name}</p>
                    )}
                  </div>

                  {/* Grade badge */}
                  {cert.kind !== 'program' && (
                  <div className="absolute top-5 right-5 z-10">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                      cert.grade_percentage >= 90
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : cert.grade_percentage >= 70
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-red-50 text-red-700 border-gray-200'
                    }`}>
                      {cert.grade_percentage}%
                    </span>
                  </div>
                  )}
                </div>

                {/* Certificate Info */}
                <div className="p-4">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Certificate ID</span>
                      <span className="font-mono text-xs text-gray-900 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
                        {cert.certificate_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Issued</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {new Date(cert.issued_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{cert.kind === 'program' ? 'Awarded by' : 'Instructor'}</span>
                      <span className="text-gray-900 text-sm truncate max-w-[150px]">
                        {cert.kind === 'program'
                          ? cert.program?.institution?.name || 'Sabitek'
                          : cert.course?.instructor?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(cert.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 rounded-full text-sm font-medium shadow-sm transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <Link
                      href={`/certificates/${cert.id}?download=true`}
                      className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium ring-1 ring-red-600/50 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function CertificatesPage() {
  return (
    <Suspense fallback={
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <SabiLoader text="Loading certificates..." size="lg" />
  </div>
}>
      <CertificatesContent />
    </Suspense>
  )
}
