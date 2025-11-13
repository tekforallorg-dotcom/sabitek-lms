'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Target } from 'lucide-react'

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

export default function SurveyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isAnimating, setIsAnimating] = useState(false)

  const currentQuestion = QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [currentStep])

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
      await handleSubmit()
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
      router.push('/login?redirect=/sabiadvisor/survey')
      return
    }

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
        throw new Error(responseData.error || 'Failed to generate recommendations')
      }

      router.push(`/sabiadvisor/results/${responseData.resultId}`)
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login?redirect=/sabiadvisor/survey')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-pink-50/20 to-white relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-red-100 mb-3">
            <Target className="w-4 h-4 text-red-600" />
            <span className="text-xs font-semibold text-gray-700">SabiAdvisor Career Assessment</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Find Your Perfect Tech Path</h1>
          <p className="text-xs text-gray-600">Answer honestly for personalized recommendations</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">
              {currentStep + 1}/{QUESTIONS.length}
            </span>
            <span className="text-xs font-bold text-red-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="relative w-full bg-gray-200/50 backdrop-blur-sm rounded-full h-2 overflow-hidden">
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
        <div className="relative min-h-[500px] mb-6">
          {/* Background Cards (stack effect) */}
          {currentStep < QUESTIONS.length - 1 && (
            <>
              <div 
                className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm"
                style={{ transform: 'translateY(8px) scale(0.97)', zIndex: 1 }}
              ></div>
              {currentStep < QUESTIONS.length - 2 && (
                <div 
                  className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl border border-gray-200/30"
                  style={{ transform: 'translateY(16px) scale(0.94)', zIndex: 0 }}
                ></div>
              )}
            </>
          )}

          {/* Current Question Card */}
          <div
            className={`relative bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 transition-all duration-300 ${
              isAnimating ? (direction === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft') : ''
            }`}
            style={{ zIndex: 10 }}
          >
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {currentStep + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight mb-1">
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
                    className={`group w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-md shadow-red-100'
                        : 'border-gray-200 bg-white/50 hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm'
                    }`}
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s backwards`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'border-red-600 bg-red-600 scale-110'
                            : 'border-gray-300 group-hover:border-red-400'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`text-sm sm:text-base leading-snug transition-colors ${
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
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                  {answers[currentQuestion.id].length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-3 mb-4 animate-shake">
            <p className="text-red-800 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-white/60 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered() || isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
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
            {currentStep < 6 && "You're doing great! Keep going..."}
            {currentStep >= 6 && currentStep < 10 && "Almost there! Just a few more..."}
            {currentStep >= 10 && "Final stretch! Your results are almost ready..."}
          </p>
        </div>
      </div>

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