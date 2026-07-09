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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
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

        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Verification Card - Not Found */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Red Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Certificate Not Found</h1>
              <p className="text-red-100 text-sm">Unable to verify this certificate</p>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm">
                  The certificate number <strong className="font-mono">{resolvedParams.certificateNumber}</strong> was not found in our records.
                </p>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                This could mean the certificate doesn't exist, was entered incorrectly, or has been revoked.
              </p>

              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full px-5 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all"
                >
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
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

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Verification Card - Valid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Green Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Certificate Verified</h1>
            <p className="text-green-100 text-sm">This certificate is authentic and valid</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Certificate Number Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-full px-4 py-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="font-mono text-sm text-green-800">{certificate?.certificate_number}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm mb-1">Awarded to</p>
              <h2 className="text-2xl font-bold text-gray-900">{certificate?.user.full_name}</h2>
            </div>

            {/* Course Details */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Course Completed</p>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">{certificate?.course.title}</h3>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-gray-500">Grade Achieved</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{certificate?.grade_percentage}%</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Issue Date</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">Course Instructor</span>
                </div>
                <p className="text-base font-semibold text-gray-900">{certificate?.course.instructor.full_name}</p>
              </div>
            </div>

            {/* Verification Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">Authenticity Confirmed</p>
                  <p className="text-xs text-green-700">
                    This certificate was issued by Sabitek and has been verified as authentic. 
                    The recipient has successfully completed the course requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Sabitek</p>
                  <p className="text-xs text-gray-500">Learning Platform</p>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all"
              >
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