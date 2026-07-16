'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
            instructor:users!courses_instructor_id_fkey(full_name)
          ),
          program:programs(
            name,
            institution:institutions(name)
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

  if (loading || certificatesLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
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
    <div className="min-h-screen bg-[#fffcfb] relative">
      {/* Backdrop washes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-rose-100/70 rounded-full blur-[100px]" />
        <div className="absolute top-40 -right-32 w-[24rem] h-[24rem] bg-rose-100/70 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-4">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-b from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)] ring-1 ring-red-600/40">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
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
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-b from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)]">
                <Award className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Certificates</p>
            <p className="text-3xl font-semibold tracking-tight text-gray-900">{certificates.length}</p>
          </div>

          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-b from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(17,24,39,0.4)]">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latest Certificate</p>
            <p className="text-xl font-semibold tracking-tight text-gray-900">{latestCertDate}</p>
          </div>

          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-b from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)]">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Average Grade</p>
            <p className="text-3xl font-semibold tracking-tight text-emerald-600">{averageGrade}%</p>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 p-12 text-center shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-rose-300" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
              No certificates <span className="font-serif italic text-red-600">yet</span>
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Complete courses and pass quizzes to earn certificates that showcase your achievements
            </p>
            <Link
              href="/courses"
              className="relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
              <BookOpen className="w-4 h-4" />
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 overflow-hidden shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 transition-all group"
              >
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent z-10" aria-hidden="true" />
                {/* Certificate Preview */}
                <div className="relative h-44 bg-gradient-to-br from-rose-50/60 to-white p-5 flex flex-col items-center justify-center border-b border-rose-100">
                  {/* Decorative border effect */}
                  <div className="absolute inset-3 border-2 border-rose-100 rounded-lg pointer-events-none"></div>
                  <div className="absolute top-3 left-3 right-3 h-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-t-lg"></div>

                  <Award className="w-12 h-12 text-gray-800 mb-2 group-hover:scale-110 transition-transform relative z-10" strokeWidth={1.5} />
                  <div className="text-center relative z-10">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-[0.2em]">
                      {cert.kind === 'program' ? 'Program Certificate' : 'Certificate of Completion'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 px-4">
                      {cert.kind === 'program' ? cert.program?.name || 'Program' : cert.course?.title || 'Course'}
                    </p>
                    {cert.kind === 'program' && cert.program?.institution?.name && (
                      <p className="text-[10px] text-gray-400 mt-0.5">by {cert.program.institution.name}</p>
                    )}
                  </div>

                  {/* Grade badge */}
                  {cert.kind !== 'program' && (
                  <div className="absolute top-5 right-5 z-10">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
                      cert.grade_percentage >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : cert.grade_percentage >= 70
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
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
                      <span className="font-mono text-xs text-gray-900 bg-rose-50/70 border border-rose-100 px-2 py-0.5 rounded-full">
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
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full text-sm font-medium shadow-sm transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <Link
                      href={`/certificates/${cert.id}?download=true`}
                      className="relative overflow-hidden flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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
  <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
    <SabiLoader text="Loading certificates..." size="lg" />
  </div>
}>
      <CertificatesContent />
    </Suspense>
  )
}
