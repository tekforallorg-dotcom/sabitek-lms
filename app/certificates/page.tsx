'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Award, Download, Eye, Calendar, TrendingUp } from 'lucide-react'

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

export default function CertificatesPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading certificates...</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Certificates</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your achievements and completed courses
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-red-600" />
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Certificates</p>
            <p className="text-3xl font-bold text-red-600">{certificates.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-gray-700" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Latest Certificate</p>
            <p className="text-lg font-bold text-gray-900">{latestCertDate}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Grade</p>
            <p className="text-3xl font-bold text-green-600">{averageGrade}%</p>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-600 mb-6">
              Complete courses and pass quizzes to earn certificates
            </p>
            <Button
              onClick={() => router.push('/courses')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-400 hover:shadow-xl transition-all group"
              >
                {/* Certificate Preview */}
                <div className="relative h-48 bg-white p-6 flex flex-col items-center justify-center border-b-2 border-gray-900">
                  <Award className="w-16 h-16 text-gray-900 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Certificate of Completion</p>
                    <p className="text-lg font-bold text-gray-900 line-clamp-2">{cert.course.title}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
                      {cert.grade_percentage}%
                    </span>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="p-4 bg-gray-50">
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Certificate ID:</span>
                      <span className="font-mono text-xs text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {cert.certificate_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Issued:</span>
                      <span className="text-gray-900">{new Date(cert.issued_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Instructor:</span>
                      <span className="text-gray-900 truncate max-w-[150px]">{cert.course.instructor?.full_name}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleView(cert.id)}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownload(cert.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
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