'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { supabase } from '@/lib/supabase'
import {
  Clock, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
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
  Loader2,
  ChevronRight,
  Wallet,
  Plus,
  Sparkles,
  ChevronDown
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

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
  const { balance } = useWallet()
  const { id } = use(params)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [expandAllForPDF, setExpandAllForPDF] = useState(false)
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

      // Lazy-load the heavy PDF libs only when the user actually exports,
      // keeping them out of the initial page bundle.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      setExpandAllForPDF(true)
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
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
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setExpandAllForPDF(false)
      setIsDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!user?.email) {
      toast.warning('No email address found')
      return
    }

    setIsSendingEmail(true)
    try {
      const pdfContent = document.getElementById('pdf-content')
      if (!pdfContent) {
        throw new Error('Content not found')
      }

      // Lazy-load the heavy PDF libs only when the user actually exports.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      setExpandAllForPDF(true)
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(pdfContent, {
        scale: 1.5,
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

      const imgData = canvas.toDataURL('image/jpeg', 0.85)

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      const pdfBase64 = pdf.output('dataurlstring').split(',')[1]
      
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
      toast.error(error.message || 'Failed to send email. Please try downloading instead.')
    } finally {
      setExpandAllForPDF(false)
      setIsSendingEmail(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading your career roadmap...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        {/* Sub Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link 
                href="/sabiadvisor"
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="font-medium text-gray-900">Results</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">{error || 'Results not found'}</p>
            <button
              onClick={() => router.push('/sabiadvisor')}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all"
            >
              Start New Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  const primaryTracks: CareerTrack[] = result.primary_tracks || []
  const alternativeTracks: CareerTrack[] = result.alternative_tracks || []
  const nextSteps: NextStepBlock[] = result.next_steps || []
  const roadmap = result.roadmap_6m

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-red-50/30">
      {/* Sub Header - Matching CV/Cover Letter style */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link 
                href="/sabiadvisor"
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Your Results</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/account/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {balance?.balanceFormatted || '₦0'}
                </span>
              </Link>
              <Link
                href="/account/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Top Up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6" id="pdf-content">
        {/* Hero Card */}
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden shadow-lg shadow-pink-500/20">
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Your Career Path Found!</h1>
                <p className="text-sm text-white/80">Personalized recommendations based on your responses</p>
              </div>
            </div>

            {/* Confidence Badge */}
            {result.confidence && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                <Target className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">Match Confidence:</span>
                <span className="text-lg font-bold text-white">{Math.round(result.confidence)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Top Recommendations</h2>
          </div>
          
          <div className="space-y-4">
            {primaryTracks.map((track, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 hover:border-pink-200 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-pink-500/20">
                    <span className="text-lg font-bold text-white">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{track.name}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="px-2.5 py-1 bg-green-50 rounded-lg text-xs font-bold text-green-700 border border-green-100">
                          {track.confidence}% match
                        </div>
                        {track.demand && track.demand >= 70 && (
                          <div className="px-2.5 py-1 bg-blue-50 rounded-lg text-xs font-semibold text-blue-700 border border-blue-100">
                            🔥 High Demand
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{track.why_fits}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{track.salary_range_ngn}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-gray-600">{track.time_to_job_ready}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {track.top_skills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-gradient-to-r from-pink-50 to-red-50 text-gray-700 rounded-lg text-xs font-medium border border-pink-100"
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

        {/* Alternative Paths */}
        {alternativeTracks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Alternative Paths</h2>
              <span className="text-xs text-gray-500">(if primary paths don't fit)</span>
            </div>
            
            <div className="space-y-3">
              {alternativeTracks.map((track, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900">{track.name}</h3>
                        <div className="px-2 py-0.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-100">
                          {track.confidence}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{track.why_fits}</p>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
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

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Your Next Steps</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nextSteps.map((step, idx) => {
                const IconComponent = iconMap[step.icon] || Target
                const priorityColors = {
                  high: 'from-red-500 to-pink-600',
                  medium: 'from-orange-400 to-pink-500',
                  low: 'from-gray-400 to-gray-500'
                }
                const priorityBg = {
                  high: 'bg-red-50 border-red-100',
                  medium: 'bg-orange-50 border-orange-100',
                  low: 'bg-gray-50 border-gray-100'
                }
                
                return (
                  <div
                    key={idx}
                    className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 border hover:shadow-md transition-all group ${priorityBg[step.priority]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${priorityColors[step.priority]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
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

        {/* 6-Month Roadmap */}
        {roadmap && (
          <div className="mb-6">
            {/* Roadmap Header Card */}
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl p-5 mb-4 relative overflow-hidden shadow-lg shadow-pink-500/20">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-2 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-10 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Your 6-Month Learning Roadmap</h2>
                  <p className="text-sm text-white/80">{roadmap.track}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-red-300 via-pink-300 to-red-300 hidden sm:block"></div>

              <div className="space-y-3">
                {roadmap.months.map((month: MonthPlan, idx: number) => {
                  const isExpanded = expandAllForPDF || selectedMonth === month.month
                  
                  return (
                    <div key={month.month} className="relative">
                      <div
                        onClick={() => setSelectedMonth(isExpanded ? null : month.month)}
                        className={`bg-white/90 backdrop-blur-sm rounded-xl border transition-all cursor-pointer ${
                          isExpanded 
                            ? 'border-pink-300 shadow-md' 
                            : 'border-gray-100 hover:border-pink-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex flex-col items-center justify-center shadow-md shadow-pink-500/20">
                                <span className="text-[9px] text-red-100 font-medium uppercase">Month</span>
                                <span className="text-lg font-black text-white leading-none">{month.month}</span>
                              </div>
                              {idx < roadmap.months.length - 1 && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-3 bg-pink-200 hidden sm:block"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 mb-0.5">
                                {month.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-1">{month.focus}</p>
                            </div>

                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isExpanded ? 'bg-pink-100 rotate-180' : 'bg-gray-50'
                            }`}>
                              <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-pink-600' : 'text-gray-400'}`} />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 p-4 space-y-4 animate-fadeIn">
                            {/* Milestones */}
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                Milestones
                              </h4>
                              <ul className="space-y-1.5">
                                {month.milestones.map((milestone, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Skills */}
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                                  <TrendingUp className="w-3 h-3 text-red-600" />
                                </div>
                                Skills to Learn
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {month.skills.map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-lg text-xs font-medium border border-red-100"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Projects */}
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
                                  <Code className="w-3 h-3 text-pink-600" />
                                </div>
                                Projects to Build
                              </h4>
                              <ul className="space-y-1.5">
                                {month.projects.map((project, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-pink-500 mt-0.5">•</span>
                                    <span>{project}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Resources */}
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                  <BookOpen className="w-3 h-3 text-gray-600" />
                                </div>
                                Resources
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {month.resources.map((resource, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs border border-gray-100"
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

        {/* Action Buttons */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl text-sm font-bold border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link
              href="/courses"
              className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 transition-all group"
            >
              <BookOpen className="w-4 h-4" />
              Browse Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/sabiadvisor/survey"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 px-6 py-3 rounded-xl text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Retake Assessment
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
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