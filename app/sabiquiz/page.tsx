'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import SabiLoader from '@/components/ui/SabiLoader'
import { 
  HelpCircle,
  BarChart3, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Target, 
  Zap,
  Brain, 
  Flame, 
  Star, 
  CheckCircle,
  Wallet,
  Plus,
  Sparkles
} from 'lucide-react'

export default function SabiQuizHomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { balance } = useWallet()

  const tools = [
    {
      id: 'materials',
      title: 'Study Materials',
      description: 'Upload PDFs & generate AI quizzes instantly',
      icon: BookOpen,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      href: '/sabiquiz/materials',
      features: ['Upload any PDF', 'AI question generation', 'Organize by topic'],
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'XP, levels, streaks, badges & performance insights',
      icon: BarChart3,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/sabiquiz/analytics',
      features: ['Track progress', 'View weak topics', 'Performance trends'],
    },
    {
      id: 'history',
      title: 'Quiz History',
      description: 'Review attempts, retry wrong answers, track growth',
      icon: Clock,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      href: '/sabiquiz/history',
      features: ['Past attempts', 'Retry wrong only', 'Score trends'],
    },
    {
      id: 'challenges',
      title: 'Challenge Modes',
      description: 'Time Attack, Perfect Run, Boss Quiz and more',
      icon: Trophy,
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      href: '/sabiquiz/materials',
      features: ['Timed challenges', 'Perfect streaks', 'Boss mode'],
    },
  ]

  const stats = [
    { icon: Brain, value: 'AI', label: 'Generated', color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Target, value: '₦50', label: 'Per Generation', color: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Flame, value: 'XP', label: 'Rewards', color: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const gamificationFeatures = [
    { icon: Star, title: 'XP System', desc: 'Earn XP for every correct answer' },
    { icon: Flame, title: 'Streaks', desc: 'Build daily study habits' },
    { icon: Trophy, title: 'Badges', desc: 'Unlock achievements' },
    { icon: Brain, title: 'Mastery', desc: 'Track topic progress' },
  ]

  const handleStartLearning = () => {
    if (!user) {
      router.push('/auth/login?redirect=/sabiquiz/materials')
      return
    }
    router.push('/sabiquiz/materials')
  }

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading SabiQuiz..." size="lg" />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-red-500" />
                <Sparkles className="w-2.5 h-2.5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <span className="font-semibold text-gray-900">SabiQuiz</span>
            </div>
            {user && (
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
            )}
          </div>
        </div>
      </div>

      {/* Hero - Compact with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-red-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border border-red-200">
              <Zap className="w-3 h-3" />
              AI-Powered Quiz Generator
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Turn Any Material Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">Smart Quizzes</span>
            </h1>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
              Upload PDFs, generate AI questions instantly, track progress with XP and streaks. Learning made fun.
            </p>

            <button
              onClick={handleStartLearning}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              {user ? 'Start Learning' : 'Login to Start'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-500 mt-2">
              ₦50 per quiz generation • Results cached free • XP rewards
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tools Grid - 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.id}
                href={user ? tool.href : '/auth/login?redirect=/sabiquiz'}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${tool.lightColor} rounded-lg flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${tool.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        {tool.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{tool.description}</p>
                    
                    <div className="space-y-1">
                      {tool.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold">{stat.value}</h3>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Gamification Features Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {gamificationFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-0.5">{feature.title}</h3>
                <p className="text-[10px] text-gray-500">{feature.desc}</p>
              </div>
            )
          })}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 text-center">How It Works</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Upload', desc: 'Any PDF file' },
              { num: 2, title: 'Generate', desc: 'AI creates quiz' },
              { num: 3, title: 'Practice', desc: 'Take the quiz' },
              { num: 4, title: 'Level Up', desc: 'Earn XP & badges' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center mx-auto mb-1.5 text-sm font-bold">
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 text-xs mb-0.5">{step.title}</h3>
                <p className="text-[10px] text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}