'use client'
import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Award, ArrowLeft, Printer, Share2 } from 'lucide-react'

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  user_id: string
  course_id: string
  user: {
    full_name: string
    email: string
  }
  course: {
    title: string
    description: string
    instructor: {
      full_name: string
    }
  }
}

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const shouldAutoDownload = searchParams.get('download') === 'true'

  useEffect(() => {
    if (!authLoading && user) {
      fetchCertificate()
    } else if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, resolvedParams.id])

  useEffect(() => {
    if (certificate && shouldAutoDownload) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [certificate, shouldAutoDownload])

  const fetchCertificate = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users!certificates_user_id_fkey(
            full_name,
            email
          ),
          course:courses(
            title,
            description,
            instructor:users!courses_instructor_id_fkey(full_name)
          )
        `)
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error
      
      if (data.user_id !== user?.id) {
        router.push('/certificates')
        return
      }

      setCertificate(data)
    } catch (error) {
      console.error('Error fetching certificate:', error)
      router.push('/certificates')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${certificate?.course.title}`,
          text: `I completed ${certificate?.course.title} and earned a certificate!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Certificate link copied to clipboard!')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading certificate...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-700">Certificate not found</p>
          <Button onClick={() => router.push('/certificates')} className="mt-4">
            Back to Certificates
          </Button>
        </div>
      </div>
    )
  }

  const issueDate = new Date(certificate.issued_at)
  const formattedDate = issueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const stampDate = issueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase()

  return (
    <>
      {/* Google Fonts for Calligraphy */}
      <link
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&display=swap"
        rel="stylesheet"
      />

      {/* Action Bar - Hidden when printing */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.push('/certificates')}
              variant="outline"
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Certificates
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-gray-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Opens print dialog - save as PDF from there"
              >
                <Printer className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white print:min-h-0">
        <div className="max-w-5xl mx-auto px-4 print:px-0 print:max-w-full">
          {/* The Actual Certificate - COMPACT DESIGN */}
          <div 
            className="certificate-container bg-white shadow-2xl print:shadow-none mx-auto"
            style={{
              width: '100%',
              maxWidth: '1000px',
              aspectRatio: '1.414/1'
            }}
          >
            {/* Outer Border */}
            <div className="relative w-full h-full border-[10px] border-gray-900 p-6">
              {/* Inner Border */}
              <div className="relative w-full h-full border border-gray-400 p-6 flex flex-col">
                
                {/* Red Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600"></div>

                {/* SECTION 1: Header - Fixed Height */}
                <div className="text-center flex-shrink-0">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-16 h-16 text-gray-900" strokeWidth={1.5} />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-1 tracking-tight">
                    Sabitek
                  </h1>
                  <div className="w-28 h-1 bg-red-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 uppercase tracking-[0.25em] font-light">
                    Certificate of Completion
                  </p>
                </div>

                {/* SECTION 2: Main Content - Flexible */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-3 min-h-0">
                  <p className="text-gray-700 text-base mb-3 font-light">
                    This is to certify that
                  </p>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2 px-8">
                    {certificate.user.full_name}
                  </h2>

                  <p className="text-gray-700 text-base mb-3 font-light">
                    has successfully completed the course
                  </p>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {certificate.course.title}
                  </h3>

                  <div className="flex items-center justify-center gap-10">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Grade</p>
                      <p className="text-2xl font-bold text-red-600">{certificate.grade_percentage}%</p>
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">Issued</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Footer/Signatures - Fixed Height */}
                <div className="border-t border-gray-300 pt-4 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    
                    {/* LEFT: Instructor Signature */}
                    <div className="text-left">
                      <p 
                        className="text-2xl text-gray-900"
                        style={{
                          fontFamily: "'Great Vibes', cursive",
                          fontStyle: 'italic',
                          marginBottom: '-4px'
                        }}
                      >
                        {certificate.course.instructor.full_name}
                      </p>
                      <div className="w-full border-t-2 border-gray-900 mb-1"></div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Course Instructor
                      </p>
                    </div>
                    
                    {/* CENTER: Certificate Number & Award */}
                    <div className="text-center">
                      <Award className="w-10 h-10 text-red-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 font-mono tracking-wide">
                        {certificate.certificate_number}
                      </p>
                    </div>

                    {/* RIGHT: Sabitek Director with Stamp */}
                    <div className="text-right">
                      {/* Stamp ABOVE signature */}
                      <div className="flex justify-end mb-1">
                        <div 
                          className="inline-block border-[2.5px] border-red-600 rounded px-2 py-1"
                          style={{
                            background: 'rgba(220, 38, 38, 0.05)',
                            transform: 'rotate(-5deg)'
                          }}
                        >
                          <p className="text-sm font-black text-red-700 uppercase tracking-wide leading-tight">
                            Tek4All
                          </p>
                          <p className="text-xs text-red-600 font-bold text-center leading-tight">
                            {stampDate}
                          </p>
                        </div>
                      </div>
                      
                      {/* Signature ON the line */}
                      <p 
                        className="text-2xl text-gray-900"
                        style={{
                          fontFamily: "'Allura', cursive",
                          marginBottom: '-4px'
                        }}
                      >
                        Sabitek
                      </p>
                      <div className="w-full border-t-2 border-gray-900 mb-1"></div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Sabitek Director
                      </p>
                    </div>
                  </div>
                </div>

                {/* Red Accent Bottom Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-600"></div>
              </div>
            </div>
          </div>

          {/* Certificate Info (Hidden when printing) */}
          <div className="no-print mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Certificate ID</p>
                <p className="font-mono text-gray-900">{certificate.certificate_number}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Issued Date</p>
                <p className="text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Recipient</p>
                <p className="text-gray-900">{certificate.user.full_name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Grade Achieved</p>
                <p className="text-gray-900 font-semibold">{certificate.grade_percentage}%</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Click "Download PDF" to open print dialog, then select "Save as PDF" as your printer destination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AGGRESSIVE Print Styles - Hide EVERYTHING except certificate */}
      <style jsx global>{`
        @media screen {
          .no-print {
            display: block !important;
          }
        }

        @media print {
          /* Force single page */
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          /* Hide EVERYTHING by default */
          body *,
          body *::before,
          body *::after {
            visibility: hidden !important;
          }
          
          /* Completely remove these elements */
          .no-print,
          header,
          footer,
          nav,
          [role="banner"],
          [role="contentinfo"],
          [role="navigation"],
          #__next > *:not(.certificate-container):not([class*="print"]) {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          
          /* Show ONLY certificate and its children */
          .certificate-container,
          .certificate-container *,
          .certificate-container *::before,
          .certificate-container *::after {
            visibility: visible !important;
          }
          
          /* Position certificate to fill page */
          .certificate-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0.5in !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* Page setup */
          @page {
            size: letter landscape;
            margin: 0;
          }
          
          /* Force single page */
          * {
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Remove effects */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Hide all backgrounds except white */
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  )
}