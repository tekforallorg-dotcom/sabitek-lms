'use client'
import { useEffect, useState, use, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import type { jsPDF } from 'jspdf'
import SabiLoader from '@/components/ui/SabiLoader'
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
  ZoomIn,
  Linkedin,
  MessageCircle,
  Link2,
  Check,
  Printer,
  GraduationCap
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  user_id: string
  course_id: string | null
  kind?: 'course' | 'program'
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
  } | null
  program?: {
    name: string
    institution?: { name: string } | null
  } | null
}

// ============================================================
// DRAW 4-POINT STAR SPARKLE using jsPDF
// ============================================================
function drawSparkle(pdf: jsPDF, cx: number, cy: number, size: number) {
  pdf.setFillColor(220, 38, 38) // Red
  pdf.setDrawColor(220, 38, 38)

  // 4-point star vertices (outer and inner)
  const outer = size
  const inner = size * 0.35

  // Calculate all 8 points (4 outer, 4 inner)
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI / 4) - Math.PI / 2 // Start from top
    const r = i % 2 === 0 ? outer : inner
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r
    })
  }

  // Draw filled star using triangles from center
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8
    pdf.triangle(cx, cy, points[i].x, points[i].y, points[next].x, points[next].y, 'F')
  }

  // Small dot at top-right of star
  pdf.circle(cx + size * 0.6, cy - size * 0.6, size * 0.15, 'F')
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
  const [shareCopied, setShareCopied] = useState(false)
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
      setTimeout(() => handleDownloadPDF(), 500)
    }
  }, [certificate, shouldAutoDownload])

  const fetchCertificate = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users!certificates_user_id_fkey(full_name, email),
          course:courses(
            title,
            description,
            instructor:users!courses_instructor_id_fkey(full_name)
          ),
          program:programs(
            name,
            institution:institutions(name)
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

  const issueDate = certificate ? new Date(certificate.issued_at) : new Date()
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
  const verifyUrl = certificate
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://sabitek.app'}/verify/${certificate.certificate_number}`
    : ''

  // ============================================================
  // DIRECT jsPDF DRAWING - Perfect centering guaranteed
  // jsPDF is lazy-loaded here so it stays out of the page bundle
  // ============================================================
  const generatePDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Page dimensions
    const pageW = 297
    const pageH = 210

    // Certificate area (centered on page)
    const margin = 12
    const certW = pageW - margin * 2  // 273mm
    const certH = pageH - margin * 2  // 186mm
    const certX = margin
    const certY = margin
    const centerX = pageW / 2

    // === OUTER BORDER (dark, thick) ===
    pdf.setDrawColor(17, 24, 39)
    pdf.setLineWidth(3)
    pdf.rect(certX, certY, certW, certH, 'S')

    // === INNER BORDER (light gray, thin) ===
    const innerMargin = 5
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.4)
    pdf.rect(certX + innerMargin, certY + innerMargin, certW - innerMargin * 2, certH - innerMargin * 2, 'S')

    // === TOP RED BAR ===
    pdf.setFillColor(220, 38, 38)
    pdf.rect(certX + innerMargin, certY + innerMargin, certW - innerMargin * 2, 2, 'F')

    // === BOTTOM RED BAR ===
    pdf.rect(certX + innerMargin, certY + certH - innerMargin - 2, certW - innerMargin * 2, 2, 'F')

    // === HEADER SECTION ===
    let currentY = certY + 28

    // "Sabitek" title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(32)
    pdf.setTextColor(17, 24, 39)
    const sabitexText = 'Sabitek'
    pdf.text(sabitexText, centerX, currentY, { align: 'center' })

    // Draw sparkle to the right of "Sabitek"
    const textWidth = pdf.getTextWidth(sabitexText)
    drawSparkle(pdf, centerX + textWidth/2 + 5, currentY - 5, 3.5)

    currentY += 4

    // Red underline (centered under Sabitek)
    pdf.setDrawColor(220, 38, 38)
    pdf.setLineWidth(1)
    pdf.line(centerX - 18, currentY, centerX + 18, currentY)
    currentY += 8

    // "CERTIFICATE OF COMPLETION" (centered)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(107, 114, 128)
    pdf.text('C E R T I F I C A T E   O F   C O M P L E T I O N', centerX, currentY, { align: 'center' })

    // === MAIN CONTENT ===
    currentY += 22

    // "This is to certify that"
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    pdf.setTextColor(55, 65, 81)
    pdf.text('This is to certify that', centerX, currentY, { align: 'center' })
    currentY += 14

    // Recipient name (bold, underlined)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(26)
    pdf.setTextColor(17, 24, 39)
    pdf.text(certificate!.user.full_name, centerX, currentY, { align: 'center' })

    // Underline for name
    const nameWidth = pdf.getTextWidth(certificate!.user.full_name)
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.5)
    pdf.line(centerX - nameWidth/2 - 8, currentY + 3, centerX + nameWidth/2 + 8, currentY + 3)
    currentY += 16

    // "has successfully completed the course"
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    pdf.setTextColor(55, 65, 81)
    pdf.text('has successfully completed the course', centerX, currentY, { align: 'center' })
    currentY += 14

    // Course title
    pdf.setFont('helvetica', 'bold')
    const courseTitle = certificate!.course?.title || certificate!.program?.name || 'Program'
    const maxTitleWidth = 200
    let titleFontSize = 20
    pdf.setFontSize(titleFontSize)
    if (pdf.getTextWidth(courseTitle) > maxTitleWidth) {
      titleFontSize = 16
      pdf.setFontSize(titleFontSize)
    }
    pdf.setTextColor(17, 24, 39)
    pdf.text(courseTitle, centerX, currentY, { align: 'center', maxWidth: maxTitleWidth })
    currentY += 18

    // Grade and Date section
    const gradeX = centerX - 35
    const dateX = centerX + 35

    // "GRADE" label
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(107, 114, 128)
    pdf.text('GRADE', gradeX, currentY, { align: 'center' })

    // Divider line
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.3)
    pdf.line(centerX, currentY - 5, centerX, currentY + 14)

    // "ISSUED" label
    pdf.text('ISSUED', dateX, currentY, { align: 'center' })
    currentY += 10

    // Grade value
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(22)
    pdf.setTextColor(220, 38, 38)
    pdf.text(`${certificate!.grade_percentage}%`, gradeX, currentY, { align: 'center' })

    // Date value
    pdf.setTextColor(17, 24, 39)
    pdf.setFontSize(13)
    pdf.text(formattedDate, dateX, currentY, { align: 'center' })

    // === FOOTER SECTION ===
    const footerY = certY + certH - 38

    // Footer divider line
    pdf.setDrawColor(209, 213, 219)
    pdf.setLineWidth(0.4)
    pdf.line(certX + 20, footerY - 8, certX + certW - 20, footerY - 8)

    // Instructor signature (left)
    const instructorX = certX + 55
    pdf.setFont('times', 'italic')
    pdf.setFontSize(18)
    pdf.setTextColor(17, 24, 39)
    pdf.text(certificate!.course?.instructor?.full_name || certificate!.program?.institution?.name || 'Sabitek', instructorX, footerY + 4, { align: 'center' })

    // Instructor line
    pdf.setDrawColor(17, 24, 39)
    pdf.setLineWidth(0.6)
    pdf.line(instructorX - 35, footerY + 8, instructorX + 35, footerY + 8)

    // "COURSE INSTRUCTOR" label
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text('COURSE INSTRUCTOR', instructorX, footerY + 15, { align: 'center' })

    // Certificate number (center-left)
    const certNumX = centerX - 20
    pdf.setFontSize(7)
    pdf.setFont('courier', 'normal')
    pdf.text(certificate!.certificate_number, certNumX, footerY + 15, { align: 'center' })

    // QR Code
    const qrCanvas = document.querySelector('#qr-code-canvas canvas') as HTMLCanvasElement
    if (qrCanvas) {
      const qrX = centerX + 30
      const qrSize = 20
      const qrData = qrCanvas.toDataURL('image/png')
      pdf.addImage(qrData, 'PNG', qrX - qrSize/2, footerY - 8, qrSize, qrSize)

      // "Scan to verify" label
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.setTextColor(156, 163, 175)
      pdf.text('Scan to verify', qrX, footerY + 15, { align: 'center' })
    }

    // Director section (right) - ONLY STAMP, no signature text
    const directorX = certX + certW - 55

    // Tek4All stamp box
    pdf.setDrawColor(220, 38, 38)
    pdf.setLineWidth(0.8)
    const stampX = directorX
    const stampY = footerY - 2
    const stampW = 30
    const stampH = 16
    pdf.rect(stampX - stampW/2, stampY - stampH/2, stampW, stampH, 'S')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(220, 38, 38)
    pdf.text('TEK4ALL', stampX, stampY, { align: 'center' })
    pdf.setFontSize(7)
    pdf.text(stampDate, stampX, stampY + 5, { align: 'center' })

    // Director line (below stamp)
    pdf.setDrawColor(17, 24, 39)
    pdf.setLineWidth(0.6)
    pdf.line(directorX - 35, footerY + 8, directorX + 35, footerY + 8)

    // "SABITEK DIRECTOR" label
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text('SABITEK DIRECTOR', directorX, footerY + 15, { align: 'center' })

    return pdf
  }

  const handleDownloadPDF = async () => {
    if (!certificate) return
    setIsDownloading(true)

    try {
      const pdf = await generatePDF()
      pdf.save(`${certificate.certificate_number}.pdf`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!certificate || !user?.email) {
      toast.warning('No email address found')
      return
    }

    setIsSendingEmail(true)
    try {
      const pdf = await generatePDF()
      const pdfBase64 = pdf.output('dataurlstring').split(',')[1]

      const pdfSizeInMB = (pdfBase64.length * 3) / 4 / (1024 * 1024)
      if (pdfSizeInMB > 10) {
        throw new Error('PDF is too large to email.')
      }

      const response = await fetch('/api/certificates/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          pdfData: pdfBase64,
          certificateData: {
            userName: certificate.user.full_name,
            courseName: certificate.course?.title || certificate.program?.name || 'Program',
            certificateNumber: certificate.certificate_number,
            grade: certificate.grade_percentage,
            issuedAt: certificate.issued_at
          }
        })
      })

      if (!response.ok) throw new Error('Failed to send email')
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error: any) {
      console.error('Email send error:', error)
      toast.error(error.message || 'Failed to send email.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verify/${certificate?.certificate_number}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Certificate - ${certificate?.course?.title || certificate?.program?.name || 'Sabitek'}`, url: shareUrl })
      } catch {}
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate?.certificate_number}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareCopy = () => {
    navigator.clipboard.writeText(verifyUrl)
    toast.success('Verification link copied')
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading || authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
      <SabiLoader text="Loading certificate..." size="lg" />
    </div>
  )
}

  if (!certificate) {
    return (
      <div className="min-h-screen bg-[#fffcfb] p-4">
        <Link href="/certificates" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-center py-20">
          <Award className="w-16 h-16 text-rose-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">Certificate not found</h2>
          <Link href="/certificates" className="text-red-600 hover:underline">Back to certificates</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-[#fffcfb] relative">
        {/* Backdrop washes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[32rem] h-[24rem] bg-rose-100/70 rounded-full blur-[100px]" />
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
        <div className="bg-white/85 backdrop-blur border-b border-rose-100 sticky top-0 z-20 no-print">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/certificates" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Certificates</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-rose-200" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-b from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-[0_6px_12px_-4px_rgba(225,29,72,0.5)]">
                  <Award className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[150px]">
                  {certificate.certificate_number}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button onClick={handleShare} className="px-3 py-1.5 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-600 rounded-full shadow-sm text-sm flex items-center gap-1.5 transition-all cursor-pointer">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={handleSendEmail} disabled={isSendingEmail || emailSent} className="px-3 py-1.5 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-600 rounded-full shadow-sm text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer">
                {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSent ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Mail className="w-4 h-4" />}
                {emailSent ? 'Sent!' : 'Email'}
              </button>
              <button onClick={handlePrint} className="px-3 py-1.5 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-600 rounded-full shadow-sm text-sm flex items-center gap-1.5 transition-all cursor-pointer">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleDownloadPDF} disabled={isDownloading} className="relative overflow-hidden px-3.5 py-1.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="relative max-w-5xl mx-auto px-4 py-6">
          {/* ── The certificate: a premium document, fluid on every screen ── */}
          <div className="cert-print-root relative overflow-hidden bg-white rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_50px_-25px_rgba(225,29,72,0.45)] p-2 sm:p-3">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent no-print" aria-hidden="true" />
            <div className="relative rounded-xl border border-rose-200 bg-[#fffcf9] overflow-hidden">
              {/* inner decorative frame */}
              <div className="absolute inset-2 sm:inset-3 border-2 border-rose-300/50 rounded-lg pointer-events-none" aria-hidden="true" />
              {/* watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <GraduationCap className="w-[55%] h-[55%] text-rose-500 opacity-[0.04]" />
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,228,230,0.5), transparent)' }}
                aria-hidden="true"
              />

              <div className="relative px-5 py-7 sm:px-12 sm:py-10 text-center">
                {/* Wordmark */}
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  Sabi
                  <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">tek</span>
                </p>
                <p className="mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-gray-400">
                  Certificate of Completion
                </p>
                {certificate.kind === 'program' && (
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 border border-rose-200 text-red-600">
                    Program Certificate
                  </span>
                )}

                {/* Learner */}
                <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">This certifies that</p>
                <h2 className="mt-2 font-serif text-2xl sm:text-4xl text-gray-900 leading-tight break-words">
                  {certificate.user.full_name}
                </h2>
                <span className="block w-24 h-px mx-auto mt-3 bg-gradient-to-r from-transparent via-rose-400 to-transparent" aria-hidden="true" />

                {/* Achievement */}
                <p className="mt-4 text-xs sm:text-sm text-gray-500">
                  {certificate.kind === 'program'
                    ? 'has successfully completed the program'
                    : 'has successfully completed the course'}
                </p>
                <h3 className="mt-1.5 text-base sm:text-xl font-semibold text-gray-900 break-words">
                  {certificate.kind === 'program'
                    ? certificate.program?.name || 'Program'
                    : certificate.course?.title || 'Course'}
                </h3>
                {certificate.kind === 'program' && certificate.program?.institution?.name && (
                  <p className="mt-1 text-xs text-gray-500">
                    offered by <span className="font-semibold text-gray-700">{certificate.program.institution.name}</span>
                  </p>
                )}
                <p className="mt-2 text-[11px] sm:text-xs text-gray-400">{formattedDate}</p>

                {/* Bottom row */}
                <div className="mt-7 sm:mt-9 grid grid-cols-3 items-end gap-2">
                  {/* Grade / Instructor */}
                  <div className="text-left">
                    {certificate.kind !== 'program' && certificate.grade_percentage != null ? (
                      <>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Grade</p>
                        <p className="text-lg sm:text-2xl font-bold tabular-nums text-red-600">
                          {certificate.grade_percentage}%
                        </p>
                        {certificate.course?.instructor?.full_name && (
                          <p className="mt-1 text-[9px] sm:text-[10px] text-gray-400">
                            Instructor: <span className="text-gray-600">{certificate.course.instructor.full_name}</span>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Awarded by</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700">
                          {certificate.program?.institution?.name || 'Sabitek'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Seal */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-red-500 to-rose-600 ring-4 ring-rose-100 flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(225,29,72,0.6)]">
                      <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="mt-1.5 text-[8px] sm:text-[9px] tabular-nums text-gray-400">
                      {certificate.certificate_number}
                    </p>
                  </div>

                  {/* QR */}
                  <div className="flex flex-col items-end" id="qr-code-canvas">
                    <div className="p-1 bg-white border border-rose-100 rounded-lg">
                      <QRCodeCanvas value={verifyUrl} size={52} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#111111" />
                    </div>
                    <p className="mt-1 text-[8px] sm:text-[9px] text-gray-400">Scan to verify</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="no-print relative overflow-hidden mt-6 bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-b from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)]">
                <Award className="w-4 h-4 text-white" />
              </div>
              Certificate <span className="font-serif italic text-red-600">details</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Certificate ID</p>
                <p className="font-mono text-gray-900 text-sm truncate">{certificate.certificate_number}</p>
              </div>
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Issued Date</p>
                <p className="text-gray-900 font-medium">{formattedDate}</p>
              </div>
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Recipient</p>
                <p className="text-gray-900 font-medium truncate">{certificate.user.full_name}</p>
              </div>
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">Grade</p>
                <p className="text-red-600 font-semibold">{certificate.grade_percentage}%</p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-b from-emerald-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)]">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-900 mb-1">Verification Link</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-white/80 px-2 py-1 rounded-full border border-emerald-100 text-emerald-800 truncate flex-1">{verifyUrl}</code>
                    <button onClick={handleCopyLink} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 hover:border-emerald-200 shadow-sm text-xs font-semibold flex items-center gap-1 transition-all">
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <Link href={`/verify/${certificate.certificate_number}`} target="_blank" className="px-2.5 py-1 bg-gradient-to-b from-emerald-500 to-green-600 hover:to-green-500 text-white rounded-full text-xs font-semibold shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)] ring-1 ring-green-600/50 flex items-center gap-1 transition-all">
                      <ExternalLink className="w-3 h-3" /> View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Share block */}
          <div className="no-print relative overflow-hidden mt-6 bg-white/85 backdrop-blur rounded-2xl p-5 border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-b from-red-500 to-rose-500 rounded-lg flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)]">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              Share your <span className="font-serif italic text-red-600">achievement</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 border border-rose-100 hover:border-rose-200 rounded-full text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('I earned a certificate on Sabitek! Verify it here: ' + verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 border border-rose-100 hover:border-rose-200 rounded-full text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <button
                onClick={handleShareCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 border border-rose-100 hover:border-rose-200 rounded-full text-xs font-semibold text-gray-700 transition-all cursor-pointer"
              >
                {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
                {shareCopied ? 'Copied' : 'Copy link'}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">
              Anyone with this link can verify your certificate is genuine.
            </p>
          </div>

          {/* Mobile buttons */}
          <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur border-t border-rose-100 p-4 z-30">
            <div className="flex gap-2">
              <button onClick={handleShare} className="flex-1 py-2.5 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm font-medium text-sm flex items-center justify-center gap-1.5 transition-all">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={handleSendEmail} disabled={isSendingEmail || emailSent} className="flex-1 py-2.5 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm font-medium text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSent ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Mail className="w-4 h-4" />}
                {emailSent ? 'Sent!' : 'Email'}
              </button>
              <button onClick={handleDownloadPDF} disabled={isDownloading} className="relative overflow-hidden flex-[1.5] py-2.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full font-semibold text-sm shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Generating...' : 'Download'}
              </button>
            </div>
          </div>
          <div className="sm:hidden h-20" />
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .cert-print-root, .cert-print-root * { visibility: visible; }
          .cert-print-root {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: none !important;
          }
        }
      `}</style>
    </>
  )
}

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
  <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
    <SabiLoader text="Loading certificate..." size="lg" />
  </div>
}>
      <CertificateViewContent params={params} />
    </Suspense>
  )
}
