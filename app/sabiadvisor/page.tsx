'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  GraduationCap,
  DollarSign,
  Clock
} from 'lucide-react'

export default function SabiAdvisorPage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = () => {
    if (!user) {
      router.push('/login?redirect=/sabiadvisor/survey')
      return
    }
    setIsStarting(true)
    router.push('/sabiadvisor/survey')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-16">
        {/* Hero with Pink Gradient Background */}
       {/* Hero with Visible Pink Gradient Background */}
        <div className="text-center mb-16 relative">
          {/* Pink Hero Background - Multiple Layers */}
          <div className="absolute inset-x-0 -top-10 h-[420px] bg-gradient-to-br from-pink-200/70 via-pink-100/60 to-red-100/50 rounded-[3rem] -z-10"></div>
          <div className="absolute inset-x-0 -top-8 h-[400px] bg-gradient-to-tr from-red-100/60 via-pink-200/70 to-pink-50/50 rounded-[3rem] -z-10"></div>
          <div className="absolute inset-x-0 -top-6 h-[380px] bg-gradient-to-b from-pink-100/80 via-pink-50/60 to-transparent rounded-[3rem] -z-10"></div>
          
          <div className="relative z-10 pt-16 pb-8">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-red-600 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 border border-red-200 shadow-sm">
              <Zap className="w-4 h-4" />
              Career Discovery Powered by SabiBot
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight px-4">
              Find Your Perfect<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
                Tech Career Path
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed px-4">
              Take a quick survey and discover a clear path into tech with guidance 
              on learning, growth, and reaching your full potential.
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={isStarting}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 shadow-lg relative z-10"
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                Start Career Discovery
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 mt-4">
            10 minutes • Free • Personalized insights
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">15+ Tracks</h3>
            <p className="text-gray-600">From Frontend to Cloud Architecture</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">₦300k-2M</h3>
            <p className="text-gray-600">Monthly salary ranges in Nigeria</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">6-12 Months</h3>
            <p className="text-gray-600">Average time to job-ready</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-200 shadow-sm mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Answer Questions', desc: 'Share your goals and situation' },
              { num: 2, title: 'AI Analysis', desc: 'We evaluate your unique profile' },
              { num: 3, title: 'Get Recommendations', desc: 'Top 3 paths ranked for you' },
              { num: 4, title: 'Start Learning', desc: 'Follow your personalized plan' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold shadow-md">
                  {step.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What You Get */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What You'll Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
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
              <div key={i} className="flex items-center gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}