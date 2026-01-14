'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Target, Wallet, Plus, Briefcase } from 'lucide-react'

const QUESTIONS = [
  {
    id: 'goals',
    title: 'What are your main career goals?',
    subtitle: 'Select all that apply',
    type: 'multiple',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-white">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs sm:text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login?redirect=/sabiadvisor/survey')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-white relative overflow-hidden">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/sabiadvisor"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Back</span>
              </Link>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-gray-900 text-sm">SabiAdvisor</span>
              </div>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-600">Career Assessment</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/account/wallet"
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {balance?.balanceFormatted || '₦0'}
                </span>
              </Link>
              <Link
                href="/account/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Top Up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-red-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-100 mb-2 sm:mb-3">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            <span className="text-xs font-semibold text-gray-700">SabiAdvisor Career Assessment</span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 mb-1">Find Your Perfect Tech Path</h1>
          <p className="text-xs text-gray-600">Answer honestly for personalized recommendations</p>
          
          {/* Cost indicator */}
          {costEstimate && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
              <Wallet className="w-3 h-3" />
              Cost: {costEstimate.costFormatted}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold text-gray-700">
              {currentStep + 1}/{QUESTIONS.length}
            </span>
            <span className="text-xs font-bold text-red-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="relative w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-full transition-all duration-700 ease-out shadow-lg shadow-red-200"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            {QUESTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  idx <= currentStep ? 'bg-red-600 scale-125' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Card Stack Effect */}
        <div className="relative min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] mb-4 sm:mb-6">
          {/* Background Cards (stack effect) */}
          {currentStep < QUESTIONS.length - 1 && (
            <>
              <div 
                className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-sm"
                style={{ transform: 'translateY(8px) scale(0.97)', zIndex: 1 }}
              ></div>
              {currentStep < QUESTIONS.length - 2 && (
                <div 
                  className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/30"
                  style={{ transform: 'translateY(16px) scale(0.94)', zIndex: 0 }}
                ></div>
              )}
            </>
          )}

          {/* Current Question Card */}
          <div
            className={`relative bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-gray-100 transition-all duration-300 ${
              isAnimating ? (direction === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft') : ''
            }`}
            style={{ zIndex: 10 }}
          >
            {/* Question Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm">
                  {currentStep + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-tight mb-1">
                    {currentQuestion.title}
                  </h2>
                  {currentQuestion.subtitle && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-pink-500" />
                      {currentQuestion.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id]?.includes(option)
                
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`group w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-md shadow-red-100'
                        : 'border-gray-200 bg-white/50 hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm'
                    }`}
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s backwards`
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'border-red-600 bg-red-600 scale-110'
                            : 'border-gray-300 group-hover:border-red-400'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm leading-snug transition-colors ${
                        isSelected ? 'font-semibold text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {option}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selection Count for Multiple Choice */}
            {currentQuestion.type === 'multiple' && answers[currentQuestion.id]?.length > 0 && (
              <div className="mt-3 sm:mt-4 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 sm:px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                  {answers[currentQuestion.id].length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg sm:rounded-xl p-3 mb-4 animate-shake">
            <p className="text-red-800 text-xs font-medium">{error}</p>
            {error.includes('wallet') && (
              <button
                onClick={() => router.push('/account/wallet')}
                className="mt-2 text-xs text-red-600 underline"
              >
                Top up wallet →
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 hover:text-gray-900 font-medium text-xs sm:text-sm disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-white/60 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered() || isSubmitting}
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : currentStep === QUESTIONS.length - 1 ? (
              <>
                <span>Get My Results</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>

        {/* Motivational Footer */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs text-gray-500">
            {currentStep < 6 && "You're doing great! Keep going..."}
            {currentStep >= 6 && currentStep < 10 && "Almost there! Just a few more..."}
            {currentStep >= 10 && "Final stretch! Your results are almost ready..."}
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm bg-white rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Your Career Roadmap</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will cost <strong>{costEstimate?.costFormatted || '₦150'}</strong> from your wallet.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your balance:</span>
                <span className="font-medium">{balance?.balanceFormatted || '₦0'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">After charge:</span>
                <span className="font-medium">
                  {balance && costEstimate 
                    ? formatNaira(balance.balanceKobo - costEstimate.costKobo)
                    : '...'}
                </span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-orange-700">
                💡 <strong>Cached for 7 days:</strong> Same answers won&apos;t be charged again.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!balance || balance.balanceKobo < (costEstimate?.costKobo || 0)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Roadmap
              </button>
            </div>

            {balance && costEstimate && balance.balanceKobo < costEstimate.costKobo && (
              <button
                onClick={() => router.push('/account/wallet')}
                className="w-full mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Top up wallet →
              </button>
            )}
          </div>
        </>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
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