'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  Award,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Shield,
  ExternalLink,
  Loader2,
  ArrowLeft
} from 'lucide-react'

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  user: {
    full_name: string
  }
  course: {
    title: string
    instructor: {
      full_name: string
    }
  }
}

export default function VerifyCertificatePage({ params }: { params: Promise<{ certificateNumber: string }> }) {
  const resolvedParams = use(params)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchCertificate()
  }, [resolvedParams.certificateNumber])

  const fetchCertificate = async () => {
    try {
      // Certificates are RLS-protected; verification goes through a
      // service-role API route instead of the anon supabase client.
      const res = await fetch(
        `/api/verify/${encodeURIComponent(resolvedParams.certificateNumber)}`
      )

      if (res.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        throw new Error('Verification request failed')
      }

      const { data } = await res.json()

      if (data) {
        // Extract data from Supabase relations (may be arrays or objects)
        const userData = Array.isArray(data.user) ? data.user[0] : data.user
        const courseData = Array.isArray(data.course) ? data.course[0] : data.course
        const instructorData = courseData?.instructor
          ? (Array.isArray(courseData.instructor) ? courseData.instructor[0] : courseData.instructor)
          : { full_name: 'Unknown Instructor' }

        const transformedData: Certificate = {
          id: data.id,
          certificate_number: data.certificate_number,
          grade_percentage: data.grade_percentage,
          issued_at: data.issued_at,
          user: {
            full_name: userData?.full_name || 'Unknown'
          },
          course: {
            title: courseData?.title || 'Unknown Course',
            instructor: {
              full_name: instructorData?.full_name || 'Unknown Instructor'
            }
          }
        }
        setCertificate(transformedData)
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = certificate
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : ''

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-rose-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#fffcfb] relative">
        {/* Backdrop washes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[30rem] h-[24rem] bg-rose-100/70 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)'
            }}
          />
        </div>

        {/* Header */}
        <div className="relative bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sabitek</span>
            </Link>
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-12">
          {/* Verification Card - Not Found */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            {/* Red Header */}
            <div className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 px-6 py-8 text-center">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" aria-hidden="true" />
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Certificate Not Found</h1>
              <p className="text-rose-100 text-sm">Unable to verify this certificate</p>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 mb-6">
                <p className="text-rose-800 text-sm">
                  The certificate number <strong className="font-mono">{resolvedParams.certificateNumber}</strong> was not found in our records.
                </p>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                This could mean the certificate doesn't exist, was entered incorrectly, or has been revoked.
              </p>

              <div className="space-y-3">
                <Link
                  href="/"
                  className="relative overflow-hidden block w-full px-5 py-3 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  Go to Sabitek
                </Link>
                <p className="text-xs text-gray-500">
                  If you believe this is an error, please contact support.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>Sabitek Certificate Verification</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Verified state
  return (
    <div className="min-h-screen bg-[#fffcfb] relative">
      {/* Backdrop washes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[30rem] h-[24rem] bg-rose-100/70 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sabitek</span>
          </Link>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Verification Card - Valid */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          {/* Green Header */}
          <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500 to-green-600 px-6 py-8 text-center">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" aria-hidden="true" />
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
              Certificate <span className="font-serif italic">verified</span>
            </h1>
            <p className="text-emerald-100 text-sm">This certificate is authentic and valid</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Certificate Number Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-4 py-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-sm">{certificate?.certificate_number}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm mb-1">Awarded to</p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{certificate?.user.full_name}</h2>
            </div>

            {/* Course Details */}
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-b from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)]">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Course Completed</p>
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 leading-tight">{certificate?.course.title}</h3>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/70 border border-rose-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Grade Achieved</span>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-gray-900">{certificate?.grade_percentage}%</p>
              </div>

              <div className="bg-white/70 border border-rose-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-xs text-gray-500">Issue Date</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
              </div>

              <div className="bg-white/70 border border-rose-100 rounded-xl p-4 col-span-2 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-xs text-gray-500">Course Instructor</span>
                </div>
                <p className="text-base font-semibold text-gray-900">{certificate?.course.instructor.full_name}</p>
              </div>
            </div>

            {/* Verification Info */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-b from-emerald-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)]">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 mb-1">Authenticity Confirmed</p>
                  <p className="text-xs text-emerald-700">
                    This certificate was issued by Sabitek and has been verified as authentic.
                    The recipient has successfully completed the course requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-rose-100 px-6 py-4 bg-rose-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-b from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)]">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-gray-900">Sabitek</p>
                  <p className="text-xs text-gray-500">Learning Platform</p>
                </div>
              </div>
              <Link
                href="/"
                className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                <span>Visit Sabitek</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Verification Timestamp */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Verified on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
