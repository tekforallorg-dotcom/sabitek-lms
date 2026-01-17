'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Target, Wallet, Plus, Briefcase, CheckCircle, HelpCircle, ChevronRight } from 'lucide-react'

const QUESTIONS = [
  {
    id: 'goals',
    title: 'What are your main career goals?',
    subtitle: 'Select all that apply',
    type: 'multiple',
    icon: '🎯',
    options: [
      'Get my first tech job',
      'Switch from non-tech to tech',
      'Advance in current tech role',
      'Earn money while learning (freelance)',
      'Build my own tech startup',
      'Work remotely for international companies',
    ],
  },
  {
    id: 'age_stage',
    title: 'What stage of life are you in?',
    type: 'single',
    icon: '👤',
    options: [
      'Secondary school student (SS1-SS3)',
      'University student (undergraduate)',
      'Recent graduate (0-2 years)',
      'Young professional (3-7 years work experience)',
      'Mid-career (8-15 years)',
      'Career switcher (15+ years in different field)',
    ],
  },
  {
    id: 'education',
    title: 'What is your educational background?',
    type: 'single',
    icon: '🎓',
    options: [
      'WAEC/NECO only',
      'JAMB candidate / Awaiting admission',
      'Current university student (any field)',
      'University graduate - Tech related',
      'University graduate - Non-tech field',
      'HND / OND',
      'Self-taught / No formal degree',
    ],
  },
  {
    id: 'tech_experience',
    title: 'What is your current tech experience?',
    type: 'single',
    icon: '💻',
    options: [
      'Complete beginner (never coded)',
      'Some HTML/CSS basics',
      'Built a few small projects',
      'Completed online courses/bootcamp',
      '1-2 years professional experience',
      '3+ years professional experience',
    ],
  },
  {
    id: 'interests',
    title: 'Which activities interest you most?',
    subtitle: 'Select all that apply',
    type: 'multiple',
    icon: '✨',
    options: [
      'Building websites and apps',
      'Working with data and numbers',
      'Designing user interfaces',
      'Solving security problems',
      'Managing cloud infrastructure',
      'Creating mobile apps',
      'Writing and documentation',
      'Teaching and mentoring others',
    ],
  },
  {
    id: 'learning_style',
    title: 'How do you learn best?',
    subtitle: 'Select your preferred style',
    type: 'single',
    icon: '📚',
    options: [
      'Video tutorials (YouTube, Udemy)',
      'Reading documentation and articles',
      'Hands-on projects and experimentation',
      'Structured courses with assignments',
      'Peer learning and study groups',
      'One-on-one mentorship',
    ],
  },
  {
    id: 'timeline',
    title: 'How soon do you need to be job-ready?',
    type: 'single',
    icon: '⏰',
    options: [
      '3-6 months (intensive learning)',
      '6-12 months (balanced pace)',
      '12-18 months (part-time)',
      'No rush, learning for knowledge',
    ],
  },
  {
    id: 'time_commitment',
    title: 'How much time can you dedicate daily?',
    type: 'single',
    icon: '🕐',
    options: [
      '1-2 hours (have full-time job)',
      '3-4 hours (flexible schedule)',
      '5-8 hours (full-time learning)',
      'Weekends only',
      'Inconsistent (as time permits)',
    ],
  },
  {
    id: 'commitment_level',
    title: 'How committed are you to this career change?',
    subtitle: 'Be honest - this helps us give better advice',
    type: 'single',
    icon: '💪',
    options: [
      'Absolutely committed - will do whatever it takes',
      'Very serious - ready to invest time and effort',
      'Interested but uncertain about commitment',
      'Just exploring options',
      'Considering multiple paths',
    ],
  },
  {
    id: 'constraints',
    title: 'What are your main constraints?',
    subtitle: 'Select all that apply',
    type: 'multiple',
    icon: '🚧',
    options: [
      'Limited budget (need free resources)',
      'Unstable power supply',
      'Limited internet data',
      'No computer (using phone)',
      'Family responsibilities',
      'Currently working full-time',
      'Health or physical limitations',
      'No major constraints',
    ],
  },
  {
    id: 'career_readiness',
    title: 'What best describes your current situation?',
    type: 'single',
    icon: '📋',
    options: [
      'Unemployed and urgently need income',
      'Employed but looking to switch',
      'Student planning for future career',
      'Currently freelancing/side hustling',
      'Have job offer pending skills',
      'Exploring before making decision',
    ],
  },
  {
    id: 'motivation',
    title: 'What motivates you most about tech?',
    subtitle: 'Select top 2-3',
    type: 'multiple',
    icon: '🔥',
    options: [
      'High earning potential',
      'Remote work opportunities',
      'Problem-solving and creativity',
      'Building impactful products',
      'Career growth and advancement',
      'Flexible work arrangements',
      'Global opportunities',
      'Passion for technology',
    ],
  },
]

interface CostEstimate {
  costKobo: number
  costFormatted: string
  displayName: string
}

export default function SurveyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { balance, refreshBalance } = useWallet()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Pricing state
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [chargedAmount, setChargedAmount] = useState<string | null>(null)

  const currentQuestion = QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [currentStep])

  // Fetch pricing on mount
  useEffect(() => {
    fetchCostEstimate()
  }, [])

  const fetchCostEstimate = async () => {
    try {
      const res = await fetch('/api/advisor/pricing?operation=roadmap_generate')
      if (res.ok) {
        const data = await res.json()
        setCostEstimate(data)
      }
    } catch (error) {
      console.error('Cost estimate error:', error)
    }
  }

  const handleAnswer = (option: string) => {
    const questionId = currentQuestion.id
    
    if (currentQuestion.type === 'single') {
      setAnswers({ ...answers, [questionId]: [option] })
    } else {
      const current = answers[questionId] || []
      if (current.includes(option)) {
        setAnswers({ ...answers, [questionId]: current.filter(a => a !== option) })
      } else {
        setAnswers({ ...answers, [questionId]: [...current, option] })
      }
    }
  }

  const isAnswered = () => {
    const answer = answers[currentQuestion.id]
    return answer && answer.length > 0
  }

  const handleNext = async () => {
    if (!isAnswered()) return

    if (currentStep < QUESTIONS.length - 1) {
      setDirection('forward')
      setCurrentStep(currentStep + 1)
    } else {
      // Show confirmation modal before submitting
      setShowConfirmModal(true)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('backward')
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/sabiadvisor/survey')
      return
    }

    setShowConfirmModal(false)
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/sabiadvisor/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          surveyAnswers: answers,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient wallet balance. Please top up to continue.')
        }
        throw new Error(responseData.error || 'Failed to generate recommendations')
      }

      setChargedAmount(responseData.cached ? '₦0 (cached)' : responseData.charged)
      refreshBalance()
      
      router.push(`/sabiadvisor/results/${responseData.resultId}`)
    } catch (err: unknown) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/50 via-white to-red-50/50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login?redirect=/sabiadvisor/survey')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-red-50/30">
      {/* Sub Header - Matching CV/Cover Letter style */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
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
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Career Assessment</span>
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-lg shadow-pink-500/20">
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white mb-1">Find Your Perfect Tech Path</h1>
                <p className="text-sm text-white/80">Answer honestly for personalized career recommendations</p>
              </div>
            </div>
            
            {/* Cost indicator */}
            {costEstimate && (
              <div className="mt-4 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/30">
                <Wallet className="w-3.5 h-3.5" />
                Cost: {costEstimate.costFormatted}
              </div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentQuestion.icon}</span>
              <span className="text-sm font-medium text-gray-700">
                Question {currentStep + 1} of {QUESTIONS.length}
              </span>
            </div>
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-between px-0.5">
            {QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx < currentStep) {
                    setDirection('backward')
                    setCurrentStep(idx)
                  }
                }}
                disabled={idx > currentStep}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx < currentStep 
                    ? 'bg-green-500 cursor-pointer hover:scale-150' 
                    : idx === currentStep 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 scale-125 ring-2 ring-pink-200' 
                      : 'bg-gray-200'
                }`}
                title={idx < currentStep ? `Go to: ${q.title}` : ''}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="relative mb-6">
          {/* Stack effect */}
          {currentStep < QUESTIONS.length - 1 && (
            <div 
              className="absolute inset-0 bg-white/50 rounded-2xl border border-gray-100"
              style={{ transform: 'translateY(6px) scale(0.98)', zIndex: 1 }}
            />
          )}
          
          <div
            className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 ${
              isAnimating ? (direction === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft') : ''
            }`}
            style={{ zIndex: 10 }}
          >
            {/* Question Header */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-lg shadow-md shadow-pink-500/20">
                  {currentQuestion.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                    {currentQuestion.title}
                  </h2>
                  {currentQuestion.subtitle && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-pink-400" />
                      {currentQuestion.subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Type indicator */}
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                currentQuestion.type === 'multiple' 
                  ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                <CheckCircle className="w-3 h-3" />
                {currentQuestion.type === 'multiple' ? 'Select multiple' : 'Select one'}
              </span>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id]?.includes(option)
                
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`group w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-red-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/30'
                    }`}
                    style={{
                      animation: `fadeInUp 0.25s ease-out ${idx * 0.03}s backwards`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'border-pink-500 bg-gradient-to-br from-red-500 to-pink-600'
                            : 'border-gray-300 group-hover:border-pink-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className={`text-sm leading-snug transition-colors ${
                        isSelected ? 'font-medium text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {option}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selection Count */}
            {currentQuestion.type === 'multiple' && answers[currentQuestion.id]?.length > 0 && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                  {answers[currentQuestion.id].length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 animate-shake">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            {error.includes('wallet') && (
              <Link
                href="/account/wallet"
                className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Top up wallet <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered() || isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : currentStep === QUESTIONS.length - 1 ? (
              <>
                <span>Get My Results</span>
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Motivational Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            {currentStep < 4 && "🚀 Great start! Keep going..."}
            {currentStep >= 4 && currentStep < 8 && "💪 You're doing amazing!"}
            {currentStep >= 8 && currentStep < 11 && "🔥 Almost there!"}
            {currentStep >= 11 && "✨ Last question!"}
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Generate Your Roadmap</h3>
                  <p className="text-sm text-white/80">AI-powered career guidance</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-semibold text-gray-900">{costEstimate?.costFormatted || '₦150'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your balance:</span>
                  <span className="font-medium text-gray-900">{balance?.balanceFormatted || '₦0'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">After charge:</span>
                    <span className={`font-semibold ${
                      balance && costEstimate && balance.balanceKobo >= costEstimate.costKobo 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {balance && costEstimate 
                        ? formatNaira(Math.max(0, balance.balanceKobo - costEstimate.costKobo))
                        : '...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 mb-5">
                <p className="text-xs text-amber-700">
                  💡 <strong>Cached for 7 days:</strong> Same answers won&apos;t be charged again.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!balance || balance.balanceKobo < (costEstimate?.costKobo || 0)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Roadmap
                </button>
              </div>

              {balance && costEstimate && balance.balanceKobo < costEstimate.costKobo && (
                <Link
                  href="/account/wallet"
                  className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Top up wallet to continue
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}