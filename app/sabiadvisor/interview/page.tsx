'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Mic, 
  Video, 
  Brain, 
  Sparkles, 
  Star,
  Target,
  Trophy,
  Zap,
  Clock,
  Users,
  ChevronRight,
  Bell,
  ArrowLeft,
  TrendingUp,
  Gamepad2,
  Timer,
  Gift,
  Flame,
  Crown,
  Briefcase
} from 'lucide-react'

export default function InterviewPrepComingSoon() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      // TODO: Save email to waitlist
    }
  }

  const coreFeatures = [
    {
      icon: Mic,
      title: 'AI Voice Interviews',
      description: 'Practice with a realistic AI interviewer that listens, responds, and challenges you in real-time.',
      details: ['Natural conversation flow', 'Real-time feedback', 'Multiple interviewer styles']
    },
    {
      icon: Video,
      title: 'Video Analysis',
      description: 'Get feedback on your body language, eye contact, and facial expressions during practice sessions.',
      details: ['Body language scoring', 'Eye contact tracking', 'Confidence metrics']
    },
    {
      icon: Brain,
      title: 'Smart Feedback',
      description: 'AI-powered analysis of your answers using the STAR method with instant improvement tips.',
      details: ['STAR method validation', 'Answer structure analysis', 'Personalized coaching']
    },
  ]

  const gamifiedFeatures = [
    {
      icon: Star,
      title: 'STAR Constellation Map',
      tagline: 'Light up your skills',
      description: 'Each soft skill is a star. Complete challenges to ignite constellations and earn "Role Ready" badges.',
    },
    {
      icon: Target,
      title: 'Um-Counter Minefield',
      tagline: 'Survive the speech challenge',
      description: 'Real-time health bar that tracks filler words. Too many "ums" and the session fails.',
    },
    {
      icon: Crown,
      title: 'Boss Level Interviews',
      tagline: 'Face the Skeptical Executive',
      description: 'Level up from friendly chatbot to tough executives who challenge every answer.',
    },
    {
      icon: Timer,
      title: '60-Second Elevator Pitch',
      tagline: 'Beat the closing doors',
      description: 'Deliver your value proposition before the elevator doors close. Master conciseness.',
    },
    {
      icon: TrendingUp,
      title: 'Career Skill Tree',
      tagline: 'Level up your identity',
      description: 'Spend XP to unlock advanced topics like Salary Negotiation and System Design.',
    },
    {
      icon: Gift,
      title: 'Mystery Box Follow-Ups',
      tagline: 'Expect the unexpected',
      description: 'After each answer, face surprise counter-questions that test the depth of your experience.',
    },
  ]

  const techStack = [
    { name: 'OpenAI Realtime API', desc: 'Low-latency speech-to-speech' },
    { name: 'Advanced Transcription', desc: 'Filler word detection' },
    { name: 'Video Analysis AI', desc: 'Body language scoring' },
    { name: 'GPT-4 Intelligence', desc: 'STAR method evaluation' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated Background - Pink/Red theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Star particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Sub Header */}
      <div className="relative z-10 bg-gray-900/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/sabiadvisor"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to SabiAdvisor</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full">
              <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
              <span className="text-xs font-medium text-pink-300">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero - Compact */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-500/30 px-4 py-1.5 rounded-full mb-3">
            <Zap className="w-3 h-3 text-pink-400" />
            <span className="text-xs font-semibold text-pink-300">
              AI-Powered Interview Coach
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
              Master Your Next
            </span>
            {' '}
            <span className="bg-gradient-to-r from-red-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Interview
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-400 max-w-xl mx-auto mb-4">
            Practice interviews with AI that sees, hears, and challenges you. 
            Gamified learning meets real-world job pressure.
          </p>

          {/* Core Tech Icons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-gray-500">Voice AI</span>
            </div>
            <div className="text-xl text-gray-700">+</div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-gray-500">Video</span>
            </div>
            <div className="text-xl text-gray-700">+</div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-gray-500">Feedback</span>
            </div>
          </div>

          {/* Notify Form */}
          {!isSubscribed ? (
            <form onSubmit={handleNotify} className="max-w-sm mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for early access"
                  className="flex-1 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-pink-500/25"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Be the first to know when we launch</p>
            </form>
          ) : (
            <div className="max-w-sm mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">You're on the list!</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">We'll notify you when Interview Prep launches.</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Core Features - 3 Column Grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {coreFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-pink-500/30 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{feature.description}</p>
                
                <div className="space-y-1">
                  {feature.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                      <div className="w-1 h-1 bg-pink-500 rounded-full" />
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Gamified Features Section */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg">
              <Gamepad2 className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gamified Learning</h2>
              <p className="text-[10px] text-gray-500">Not just practice. A game.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gamifiedFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-gray-800/50 border border-white/5 rounded-lg p-3 hover:border-pink-500/20 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  <h3 className="text-xs font-bold text-white mb-0.5">{feature.title}</h3>
                  <p className="text-[10px] text-pink-400 mb-1">{feature.tagline}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tech Stack Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {techStack.map((tech, index) => (
            <div key={index} className="text-center p-3 bg-gray-900/50 border border-white/10 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-pink-400" />
              </div>
              <h4 className="text-[10px] font-semibold text-white mb-0.5">{tech.name}</h4>
              <p className="text-[9px] text-gray-500">{tech.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-pink-600 to-red-600 rounded-xl p-5 text-center">
          {/* Animated circles */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full mb-2">
              <Flame className="w-3 h-3 text-yellow-300 animate-pulse" />
              <span className="text-xs font-medium">Early Access: 50% Off</span>
            </div>
            
            <h2 className="text-lg font-bold mb-2">
              Be Ready for Your Dream Job
            </h2>
            <p className="text-xs text-white/80 mb-4 max-w-md mx-auto">
              Join the waitlist for exclusive early access and special pricing.
            </p>
            
            <Link
              href="/sabiadvisor"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Explore SabiAdvisor Tools
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-6 border-t border-white/5">
        <p className="text-[10px] text-gray-600">
          © 2026 Sabitek. Interview Prep is coming soon.
        </p>
      </div>
    </div>
  )
}