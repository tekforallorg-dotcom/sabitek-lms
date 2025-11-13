'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  Clock, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Star,
  Target,
  BookOpen,
  Laptop,
  Users,
  Code,
  Briefcase,
  Award,
  Rocket,
  MapPin,
  TrendingUp,
  Lightbulb,
  Download,
  Mail,
  Loader2
} from 'lucide-react'

interface CareerTrack {
  name: string
  confidence: number
  why_fits: string
  salary_range_ngn: string
  time_to_job_ready: string
  top_skills: string[]
  entry_roles: string[]
  demand?: number
}

interface MonthPlan {
  month: number
  title: string
  focus: string
  milestones: string[]
  skills: string[]
  projects: string[]
  resources: string[]
}

interface NextStepBlock {
  icon: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

const iconMap: Record<string, any> = {
  book: BookOpen,
  laptop: Laptop,
  users: Users,
  target: Target,
  code: Code,
  briefcase: Briefcase,
  award: Award,
  rocket: Rocket,
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { id } = use(params)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchResult()
    } else if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, id])

  const fetchResult = async () => {
    try {
      const { data, error } = await supabase
        .from('career_results')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setResult(data)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const pdfContent = document.getElementById('pdf-content')
      if (!pdfContent) {
        throw new Error('Content not found')
      }

      // Collapse all roadmap months before capturing
      setSelectedMonth(null)
      
      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(pdfContent, {
        scale: 2, // Higher quality for download
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4', true)
      let position = 0

      const imgData = canvas.toDataURL('image/png')

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      pdf.save(`sabitek-career-path-${new Date().getTime()}.pdf`)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!user?.email) {
      alert('No email address found')
      return
    }

    setIsSendingEmail(true)
    try {
      const pdfContent = document.getElementById('pdf-content')
      if (!pdfContent) {
        throw new Error('Content not found')
      }

      // Collapse all roadmap months before capturing
      setSelectedMonth(null)
      
      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Use lower scale for email (reduces file size)
      const canvas = await html2canvas(pdfContent, {
        scale: 1.5, // Reduced from 2 to 1.5
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Fixed width for consistency
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4', true) // Added compression: true
      let position = 0

      // Compress image quality for email
      const imgData = canvas.toDataURL('image/jpeg', 0.85) // JPEG at 85% quality instead of PNG

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      const pdfBase64 = pdf.output('dataurlstring').split(',')[1]
      
      // Check PDF size (Resend limit is 40MB, we'll limit to 10MB to be safe)
      const pdfSizeInMB = (pdfBase64.length * 3) / 4 / (1024 * 1024)
      console.log('PDF size:', pdfSizeInMB.toFixed(2), 'MB')

      if (pdfSizeInMB > 10) {
        throw new Error('PDF is too large to email. Please use Download instead.')
      }

      const response = await fetch('/api/sabiadvisor/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          pdfData: pdfBase64,
          resultData: {
            primaryTracks: result.primary_tracks || [],
            alternativeTracks: result.alternative_tracks || [],
            confidence: result.confidence
          }
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send email')
      }

      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 5000)
    } catch (error: any) {
      console.error('Email send error:', error)
      alert(error.message || 'Failed to send email. Please try downloading instead.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/30 via-pink-50/20 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-red-50/30 via-pink-50/20 to-white">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Results not found'}</p>
          <button
            onClick={() => router.push('/sabiadvisor')}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    )
  }

  const primaryTracks: CareerTrack[] = result.primary_tracks || []
  const alternativeTracks: CareerTrack[] = result.alternative_tracks || []
  const nextSteps: NextStepBlock[] = result.next_steps || []
  const roadmap = result.roadmap_6m

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-12" id="pdf-content">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
            <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Your Career Path Found!
          </h1>
          <p className="text-sm text-gray-600">
            Personalized recommendations based on your responses
          </p>
        </div>

        {result.confidence && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-gray-700">Match Confidence</span>
              </div>
              <div className="text-2xl font-black text-gray-900">
                {Math.round(result.confidence)}%
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-red-600 fill-red-600" />
            Top Recommendations
          </h2>
          <div className="space-y-4">
            {primaryTracks.map((track, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-100 hover:border-red-200 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{track.name}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="px-2.5 py-1 bg-green-50 rounded-lg text-xs font-bold text-green-700">
                          {track.confidence}%
                        </div>
                        {track.demand && track.demand >= 70 && (
                          <div className="px-2 py-1 bg-blue-50 rounded-lg text-xs font-semibold text-blue-700">
                            High Demand
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{track.why_fits}</p>
                    
                    <div className="flex flex-wrap gap-3 mb-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 font-medium">{track.salary_range_ngn}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{track.time_to_job_ready}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {track.top_skills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {alternativeTracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-gray-600" />
              Alternative Paths
              <span className="text-xs font-normal text-gray-500">(if primary paths don't fit)</span>
            </h2>
            <div className="space-y-3">
              {alternativeTracks.map((track, idx) => (
                <div
                  key={idx}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900">{track.name}</h3>
                        <div className="px-2 py-0.5 bg-gray-50 rounded text-xs font-semibold text-gray-600 whitespace-nowrap">
                          {track.confidence}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{track.why_fits}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {track.salary_range_ngn}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {track.time_to_job_ready}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextSteps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-red-600" />
              Your Next Steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nextSteps.map((step, idx) => {
                const IconComponent = iconMap[step.icon] || Target
                const priorityColors = {
                  high: 'from-red-500 to-pink-600',
                  medium: 'from-pink-500 to-red-400',
                  low: 'from-gray-400 to-gray-500'
                }
                
                return (
                  <div
                    key={idx}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${priorityColors[step.priority]} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {roadmap && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
                <MapPin className="w-6 h-6 text-red-600" />
                Your 6-Month Learning Roadmap
              </h2>
              <p className="text-sm text-gray-600">{roadmap.track}</p>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-red-300 via-pink-300 to-red-300 hidden sm:block"></div>

              <div className="space-y-4">
                {roadmap.months.map((month: MonthPlan, idx: number) => {
                  const isExpanded = selectedMonth === month.month
                  
                  return (
                    <div key={month.month} className="relative">
                      <div
                        onClick={() => setSelectedMonth(isExpanded ? null : month.month)}
                        className={`bg-white/80 backdrop-blur-sm rounded-xl border transition-all cursor-pointer ${
                          isExpanded 
                            ? 'border-red-300 shadow-lg' 
                            : 'border-gray-100 hover:border-red-200 hover:shadow-md'
                        }`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex flex-col items-center justify-center shadow-lg">
                                <span className="text-[10px] text-red-100 font-medium">MONTH</span>
                                <span className="text-lg sm:text-xl font-black text-white">{month.month}</span>
                              </div>
                              {idx < roadmap.months.length - 1 && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-red-300 hidden sm:block"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                                {month.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600">{month.focus}</p>
                            </div>

                            <div className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 p-4 sm:p-5 space-y-4 animate-fadeIn">
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                Milestones
                              </h4>
                              <ul className="space-y-1">
                                {month.milestones.map((milestone, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-green-600 mt-0.5">✓</span>
                                    <span>{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                                Skills to Learn
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {month.skills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1">
                                <Code className="w-3.5 h-3.5 text-pink-600" />
                                Projects to Build
                              </h4>
                              <ul className="space-y-1">
                                {month.projects.map((project, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-pink-600 mt-0.5">•</span>
                                    <span>{project}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-gray-600" />
                                Resources
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {month.resources.map((resource, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs"
                                  >
                                    {resource}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download as PDF
                </>
              )}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || emailSent}
              className="group flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-xl text-sm font-bold border border-gray-200 hover:border-red-300 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Email Sent!
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to Email
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/courses')}
              className="group flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-xl text-sm font-bold border border-gray-200 hover:border-red-300 hover:bg-white transition-all"
            >
              Browse Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/sabiadvisor/survey')}
              className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-sm text-gray-600 px-6 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-white transition-all"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}