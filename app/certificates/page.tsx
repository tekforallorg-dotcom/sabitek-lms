'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Award, 
  Download, 
  Eye, 
  Calendar, 
  TrendingUp,
  ArrowLeft,
  Sparkles,
  BookOpen
} from 'lucide-react'

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  completion_date: string
  course: {
    id: string
    title: string
    description: string
    thumbnail_url?: string
    instructor?: {
      full_name: string
    }
  }
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
            instructor:users!courses_instructor_id_fkey(full_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false })

      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setCertificatesLoading(false)
    }
  }

  const handleView = (certId: string) => {
    router.push(`/certificates/${certId}`)
  }

  const handleDownload = (certId: string) => {
    router.push(`/certificates/${certId}?download=true`)
  }

  if (loading || certificatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading certificates...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-red-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumb */}
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Certificates</h1>
              <p className="text-white/80 text-sm">
                Your achievements and completed courses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 -mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Award className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Certificates</p>
            <p className="text-3xl font-bold text-gray-900">{certificates.length}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latest Certificate</p>
            <p className="text-xl font-bold text-gray-900">{latestCertDate}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Average Grade</p>
            <p className="text-3xl font-bold text-green-600">{averageGrade}%</p>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
              <Award className="w-10 h-10 text-red-300" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete courses and pass quizzes to earn certificates that showcase your achievements
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all"
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
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden hover:border-pink-200 hover:shadow-lg hover:shadow-pink-500/10 transition-all group"
              >
                {/* Certificate Preview */}
                <div className="relative h-44 bg-gradient-to-br from-gray-50 to-white p-5 flex flex-col items-center justify-center border-b border-gray-100">
                  {/* Decorative border effect */}
                  <div className="absolute inset-3 border-2 border-gray-200 rounded-lg pointer-events-none"></div>
                  <div className="absolute top-3 left-3 right-3 h-1 bg-red-500 rounded-t-lg"></div>
                  
                  <Award className="w-12 h-12 text-gray-800 mb-2 group-hover:scale-110 transition-transform relative z-10" strokeWidth={1.5} />
                  <div className="text-center relative z-10">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-[0.2em]">Certificate of Completion</p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 px-4">{cert.course.title}</p>
                  </div>
                  
                  {/* Grade badge */}
                  <div className="absolute top-5 right-5 z-10">
                    <span className={`px-2 py-1 text-xs rounded-lg font-bold ${
                      cert.grade_percentage >= 90 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                        : cert.grade_percentage >= 70 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                    }`}>
                      {cert.grade_percentage}%
                    </span>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="p-4">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Certificate ID</span>
                      <span className="font-mono text-xs text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg">
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
                      <span className="text-gray-500 text-xs">Instructor</span>
                      <span className="text-gray-900 text-sm truncate max-w-[150px]">
                        {cert.course.instructor?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(cert.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(cert.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading certificates...</p>
        </div>
      </div>
    }>
      <CertificatesContent />
    </Suspense>
  )
}