'use client'
import { useEffect, useState, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
// Use QRCodeCanvas instead of QRCodeSVG for html2canvas compatibility
import { QRCodeCanvas } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  Award, 
  ArrowLeft, 
  Download, 
  Share2, 
  Mail, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  Copy,
  ChevronRight,
  ZoomIn
} from 'lucide-react'

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

function CertificateViewContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)
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
        handleDownloadPDF()
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

  const handleDownloadPDF = async () => {
    if (!certificate) return
    
    setIsDownloading(true)
    try {
      const certificateElement = document.getElementById('certificate-content')
      if (!certificateElement) {
        throw new Error('Certificate element not found')
      }

      // Wait for QR code canvas to fully render
      await new Promise(resolve => setTimeout(resolve, 300))

      // Capture the certificate as canvas
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // Create PDF in landscape A4
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      // A4 landscape dimensions
      const pdfWidth = 297
      const pdfHeight = 210
      
      // Convert canvas to mm (assuming 96 DPI, scaled by 2)
      // 1 inch = 25.4mm, 96 pixels = 1 inch
      // So 1 pixel = 25.4/96 mm = 0.2646mm
      // But we scaled by 2, so actual size is canvas.width / 2 in original pixels
      const pxToMm = 25.4 / 96
      const imgWidthMm = (canvas.width / 2) * pxToMm
      const imgHeightMm = (canvas.height / 2) * pxToMm
      
      // Calculate scale to fit within page with 10mm margin
      const margin = 10
      const maxWidth = pdfWidth - (margin * 2)
      const maxHeight = pdfHeight - (margin * 2)
      
      const scaleX = maxWidth / imgWidthMm
      const scaleY = maxHeight / imgHeightMm
      const scale = Math.min(scaleX, scaleY, 1)
      
      const finalWidth = imgWidthMm * scale
      const finalHeight = imgHeightMm * scale
      
      // Center on page
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      const imgData = canvas.toDataURL('image/png', 1.0)
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)

      pdf.save(`${certificate.certificate_number}.pdf`)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!certificate || !user?.email) {
      alert('No email address found')
      return
    }

    setIsSendingEmail(true)
    try {
      const certificateElement = document.getElementById('certificate-content')
      if (!certificateElement) {
        throw new Error('Certificate element not found')
      }

      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = 297
      const pdfHeight = 210
      
      const pxToMm = 25.4 / 96
      const imgWidthMm = (canvas.width / 2) * pxToMm
      const imgHeightMm = (canvas.height / 2) * pxToMm
      
      const margin = 10
      const maxWidth = pdfWidth - (margin * 2)
      const maxHeight = pdfHeight - (margin * 2)
      
      const scaleX = maxWidth / imgWidthMm
      const scaleY = maxHeight / imgHeightMm
      const scale = Math.min(scaleX, scaleY, 1)
      
      const finalWidth = imgWidthMm * scale
      const finalHeight = imgHeightMm * scale
      
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight)

      const pdfBase64 = pdf.output('dataurlstring').split(',')[1]

      const pdfSizeInMB = (pdfBase64.length * 3) / 4 / (1024 * 1024)
      if (pdfSizeInMB > 10) {
        throw new Error('PDF is too large to email. Please use Download instead.')
      }

      const response = await fetch('/api/certificates/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          pdfData: pdfBase64,
          certificateData: {
            userName: certificate.user.full_name,
            courseName: certificate.course.title,
            certificateNumber: certificate.certificate_number,
            grade: certificate.grade_percentage,
            issuedAt: certificate.issued_at
          }
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMsg = responseData.error || 'Failed to send email'
        console.error('Email API error:', responseData)
        throw new Error(errorMsg)
      }

      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error: any) {
      console.error('Email send error:', error)
      if (error.message.includes('Failed to send')) {
        alert('Email service is not configured. Please download the PDF instead.')
      } else {
        alert(error.message || 'Failed to send email. Please try downloading instead.')
      }
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleShare = async () => {
    const verifyUrl = `${window.location.origin}/verify/${certificate?.certificate_number}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${certificate?.course.title}`,
          text: `I completed ${certificate?.course.title} on Sabitek and earned a certificate! Verify at:`,
          url: verifyUrl,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    const verifyUrl = `${window.location.origin}/verify/${certificate?.certificate_number}`
    navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading certificate...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <Link 
              href="/certificates"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Certificates</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-red-300" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Certificate not found</h2>
            <p className="text-sm text-gray-500 mb-6">This certificate may have been removed or doesn't exist.</p>
            <Link
              href="/certificates"
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Certificates
            </Link>
          </div>
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

  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://sabitek.school'}/verify/${certificate.certificate_number}`

  return (
    <>
      {/* Google Fonts for Calligraphy */}
      <link
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-red-50/30">
        {/* Sub Header - Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 no-print">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link 
                  href="/certificates"
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Certificates</span>
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none text-xs sm:text-sm">
                    {certificate.certificate_number}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons - Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || emailSent}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : emailSent ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>{emailSent ? 'Sent!' : 'Email'}</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          
          {/* Mobile Scroll Hint */}
          <div className="sm:hidden flex items-center justify-center gap-2 text-xs text-gray-500 mb-3 bg-white/60 backdrop-blur-sm rounded-lg py-2">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Scroll horizontally to view full certificate</span>
          </div>
          
          {/* Certificate Container - Horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
            {/* The Actual Certificate - Fixed width for consistent PDF */}
            <div 
              id="certificate-content"
              className="bg-white shadow-xl rounded-lg overflow-hidden"
              style={{
                width: '800px',
                minWidth: '800px',
                height: '566px', // 800 / 1.414 for A4 landscape ratio
              }}
            >
              {/* Outer Border */}
              <div className="relative w-full h-full border-[8px] border-gray-900 p-4">
                {/* Inner Border */}
                <div className="relative w-full h-full border border-gray-400 p-4 flex flex-col">
                  
                  {/* Red Accent Top Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>

                  {/* SECTION 1: Header */}
                  <div className="text-center flex-shrink-0">
                    <div className="flex items-center justify-center mb-1">
                      <Award className="w-12 h-12 text-gray-900" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-0.5 tracking-tight">
                      Sabitek
                    </h1>
                    <div className="w-20 h-0.5 bg-red-600 mx-auto mb-1"></div>
                    <p className="text-xs text-gray-600 uppercase tracking-[0.2em] font-light">
                      Certificate of Completion
                    </p>
                  </div>

                  {/* SECTION 2: Main Content */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-2 min-h-0">
                    <p className="text-gray-700 text-sm mb-2 font-light">
                      This is to certify that
                    </p>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1 px-6">
                      {certificate.user.full_name}
                    </h2>

                    <p className="text-gray-700 text-sm mb-2 font-light">
                      has successfully completed the course
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3 max-w-lg leading-tight">
                      {certificate.course.title}
                    </h3>

                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Grade</p>
                        <p className="text-xl font-bold text-red-600">{certificate.grade_percentage}%</p>
                      </div>
                      <div className="w-px h-10 bg-gray-300"></div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Issued</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Footer/Signatures - 4 Column */}
                  <div className="border-t border-gray-300 pt-3 flex-shrink-0">
                    <div className="grid grid-cols-4 gap-3 items-end">
                      
                      {/* LEFT: Instructor Signature */}
                      <div className="text-left">
                        <p 
                          className="text-xl text-gray-900"
                          style={{
                            fontFamily: "'Great Vibes', cursive",
                            fontStyle: 'italic',
                            marginBottom: '-2px'
                          }}
                        >
                          {certificate.course.instructor.full_name}
                        </p>
                        <div className="w-full border-t-2 border-gray-900 mb-0.5"></div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                          Course Instructor
                        </p>
                      </div>
                      
                      {/* CENTER-LEFT: Certificate Number & Award */}
                      <div className="text-center">
                        <Award className="w-8 h-8 text-red-600 mx-auto mb-0.5" />
                        <p className="text-[9px] text-gray-500 font-mono tracking-wide">
                          {certificate.certificate_number}
                        </p>
                      </div>

                      {/* CENTER-RIGHT: QR Code */}
                      <div className="text-center flex flex-col items-center">
                        <div className="p-0.5 bg-white border border-gray-200 rounded inline-block">
                          <QRCodeCanvas 
                            value={verifyUrl}
                            size={50}
                            level="M"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                        </div>
                        <p className="text-[8px] text-gray-400 mt-0.5">Scan to verify</p>
                      </div>

                      {/* RIGHT: Sabitek Director with Stamp */}
                      <div className="text-right">
                        {/* Stamp ABOVE signature */}
                        <div className="flex justify-end mb-0.5">
                          <div 
                            className="inline-block border-2 border-red-600 rounded px-1.5 py-0.5"
                            style={{
                              background: 'rgba(220, 38, 38, 0.05)',
                              transform: 'rotate(-5deg)'
                            }}
                          >
                            <p className="text-[10px] font-black text-red-700 uppercase tracking-wide leading-tight">
                              Tek4All
                            </p>
                            <p className="text-[8px] text-red-600 font-bold text-center leading-tight">
                              {stampDate}
                            </p>
                          </div>
                        </div>
                        
                        {/* Signature ON the line */}
                        <p 
                          className="text-xl text-gray-900"
                          style={{
                            fontFamily: "'Allura', cursive",
                            marginBottom: '-2px'
                          }}
                        >
                          Sabitek
                        </p>
                        <div className="w-full border-t-2 border-gray-900 mb-0.5"></div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                          Sabitek Director
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Red Accent Bottom Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Info Card - Modern Styling */}
          <div className="no-print mt-4 sm:mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              Certificate Details
            </h3>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Certificate ID</p>
                <p className="font-mono text-gray-900 text-xs sm:text-sm truncate">{certificate.certificate_number}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Issued Date</p>
                <p className="text-gray-900 font-medium text-xs sm:text-sm">{formattedDate}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Recipient</p>
                <p className="text-gray-900 font-medium truncate text-xs sm:text-sm">{certificate.user.full_name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Grade Achieved</p>
                <p className="text-red-600 font-bold text-xs sm:text-sm">{certificate.grade_percentage}%</p>
              </div>
            </div>

            {/* Verification Link */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-900 mb-0.5 sm:mb-1">Verification Link</p>
                  <p className="text-[10px] sm:text-xs text-green-700 mb-2">Share this link to verify your certificate</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[10px] sm:text-xs bg-white/80 px-2 py-1 rounded border border-green-200 text-green-800 truncate flex-1 min-w-0">
                      {verifyUrl}
                    </code>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-green-100 text-green-700 rounded border border-green-200 text-[10px] sm:text-xs font-medium transition-colors flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={`/verify/${certificate.certificate_number}`}
                        target="_blank"
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] sm:text-xs font-medium transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons - Fixed at bottom */}
          <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-30">
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail || emailSent}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : emailSent ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {emailSent ? 'Sent!' : 'Email'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-[1.5] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Spacer for fixed mobile buttons */}
          <div className="sm:hidden h-20"></div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          #certificate-content {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  )
}

// Main page component with Suspense wrapper for useSearchParams
export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading certificate...</p>
        </div>
      </div>
    }>
      <CertificateViewContent params={params} />
    </Suspense>
  )
}