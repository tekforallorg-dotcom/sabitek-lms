'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useEntitlements } from '@/hooks/useEntitlements'
import { 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  DollarSign,
  Clock,
  Lock,
  Crown
} from 'lucide-react'

export default function SabiAdvisorPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { canAccessSabiAdvisor, loading: entitlementsLoading } = useEntitlements()
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = () => {
    if (!user) {
      router.push('/auth/login?redirect=/sabiadvisor/survey')
      return
    }
    if (!canAccessSabiAdvisor) {
      router.push('/pricing')
      return
    }
    setIsStarting(true)
    router.push('/sabiadvisor/survey')
  }

// Show loading state while checking entitlements
  if (user && entitlementsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const isLocked = user && !canAccessSabiAdvisor

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Pro Badge */}
      {isLocked && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 sm:py-3 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">SabiAdvisor is a Pro feature</span>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-white text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-lg font-medium"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-12 lg:pt-16 pb-10 sm:pb-12 lg:pb-16">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 relative">
          <div className="absolute inset-x-0 -top-10 h-[320px] sm:h-[380px] lg:h-[420px] bg-gradient-to-br from-pink-200/70 via-pink-100/60 to-red-100/50 rounded-[2rem] sm:rounded-[3rem] -z-10"></div>
          <div className="absolute inset-x-0 -top-8 h-[300px] sm:h-[360px] lg:h-[400px] bg-gradient-to-tr from-red-100/60 via-pink-200/70 to-pink-50/50 rounded-[2rem] sm:rounded-[3rem] -z-10"></div>
          <div className="absolute inset-x-0 -top-6 h-[280px] sm:h-[340px] lg:h-[380px] bg-gradient-to-b from-pink-100/80 via-pink-50/60 to-transparent rounded-[2rem] sm:rounded-[3rem] -z-10"></div>
          
          <div className="relative z-10 pt-10 sm:pt-12 lg:pt-16 pb-6 sm:pb-8">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-red-600 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-red-200 shadow-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              Career Discovery Powered by SabiBot
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3 sm:mb-5 leading-tight px-4">
              Find Your Perfect<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
                Tech Career Path
              </span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
              Take a quick survey and discover a clear path into tech with guidance 
              on learning, growth, and reaching your full potential.
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={isStarting}
            className="group inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 shadow-lg relative z-10"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Starting...
              </>
            ) : isLocked ? (
              <>
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                Upgrade to Unlock
              </>
            ) : !user ? (
              <>
                Login to Start
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            ) : (
              <>
                Start Career Discovery
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
            10 minutes • {isLocked ? 'Pro Feature' : 'Free'} • Personalized insights
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12 lg:mb-16">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">15+ Tracks</h3>
            <p className="text-xs sm:text-sm text-gray-600">From Frontend to Cloud Architecture</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">₦300k-2M</h3>
            <p className="text-xs sm:text-sm text-gray-600">Monthly salary ranges in Nigeria</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">6-12 Months</h3>
            <p className="text-xs sm:text-sm text-gray-600">Average time to job-ready</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 border border-gray-200 shadow-sm mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 lg:mb-10">How It Works</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { num: 1, title: 'Answer Questions', desc: 'Share your goals and situation' },
              { num: 2, title: 'AI Analysis', desc: 'We evaluate your unique profile' },
              { num: 3, title: 'Get Recommendations', desc: 'Top 3 paths ranked for you' },
              { num: 4, title: 'Start Learning', desc: 'Follow your personalized plan' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 text-base sm:text-lg lg:text-xl font-bold shadow-md">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">{step.title}</h3>
                <p className="text-xs text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What You Get */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">What You'll Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {[
              'Top 3 career tracks matched to you',
              'Confidence scores with rationale',
              '7-day starter plan',
              'Realistic salary expectations',
              'Time to job-ready estimates',
              'Free learning resources',
              'Entry-level role guidance',
              'Nigerian market insights',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 text-left">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}