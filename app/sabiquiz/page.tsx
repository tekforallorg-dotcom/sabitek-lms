'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, BarChart3, BookOpen, Clock, ArrowRight, Trophy, Target, Zap, Lock, Crown,
  Brain, Flame, Star, Shield, Medal, TrendingUp, CheckCircle, Upload, Play, 
  RotateCcw, Lightbulb, Timer, Skull, Award
} from 'lucide-react'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useAuth } from '@/hooks/useAuth'

export default function SabiQuizHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccessSabiQuiz, loading: entitlementsLoading } = useEntitlements()

  const features = [
    {
      title: 'Analytics Dashboard',
      description: 'XP, levels, streaks, badges & performance insights',
      icon: BarChart3,
      href: '/sabiquiz/analytics',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Study Materials',
      description: 'Upload PDFs & generate AI quizzes instantly',
      icon: BookOpen,
      href: '/sabiquiz/materials',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Quiz History',
      description: 'Review attempts, retry wrong answers, track growth',
      icon: Clock,
      href: '/sabiquiz/history',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ]

  const heroStats = [
    { icon: Brain, label: 'AI-Generated Questions', desc: 'Smart, contextual questions from your materials' },
    { icon: Target, label: 'Adaptive Learning', desc: 'Focus on weak topics automatically' },
    { icon: Zap, label: 'Instant Feedback', desc: 'Learn from every answer immediately' },
  ]

  const problemsSolved = [
    { 
      problem: 'Boring, repetitive studying', 
      solution: 'Gamified learning with XP, levels, and badges',
      icon: Trophy
    },
    { 
      problem: 'No idea what to focus on', 
      solution: 'AI identifies your weak topics automatically',
      icon: Brain
    },
    { 
      problem: 'Hard to stay consistent', 
      solution: 'Streak tracking keeps you motivated daily',
      icon: Flame
    },
    { 
      problem: 'Generic quiz apps', 
      solution: 'Quizzes generated from YOUR study materials',
      icon: Sparkles
    },
  ]

  const challengeModes = [
    {
      name: 'Time Attack',
      description: 'Race against the clock with dynamic timers',
      icon: Timer,
      color: 'from-orange-500 to-red-500',
      features: ['Visual countdown fuse', 'Buzzer alerts at 1min & 30s', 'Difficulty-based timing']
    },
    {
      name: 'Perfect Run',
      description: 'One wrong answer and it\'s over',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      features: ['Candle lighting progress', 'Rank progression system', 'Milestone badges']
    },
    {
      name: 'Boss Quiz',
      description: 'Only the hardest questions',
      icon: Skull,
      color: 'from-red-600 to-red-800',
      features: ['Hard questions only', 'Battle progress bar', 'Ultimate challenge']
    },
  ]

  const gamificationFeatures = [
    { icon: Star, title: 'XP System', desc: 'Earn XP for every correct answer, quiz completion, and streak bonus' },
    { icon: TrendingUp, title: 'Level Up', desc: '20 levels from Novice to Ultimate with unique titles' },
    { icon: Flame, title: 'Study Streaks', desc: 'Build daily habits with streak tracking and protection' },
    { icon: Medal, title: 'Badges', desc: 'Unlock achievements like Accuracy Builder, Deep Diver, Consistency Champion' },
    { icon: Brain, title: 'Mastery Tracking', desc: 'See your mastery percentage for every topic' },
    { icon: RotateCcw, title: 'Smart Retry', desc: 'Retry only wrong answers or practice weak topics' },
  ]

  const handleStartLearning = () => {
    if (!user) {
      router.push('/auth/login?redirect=/sabiquiz')
      return
    }
    if (!canAccessSabiQuiz) {
      router.push('/pricing')
      return
    }
    router.push('/sabiquiz/materials')
  }

  const handleFeatureClick = (href: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/sabiquiz')
      return
    }
    if (!canAccessSabiQuiz) {
      router.push('/pricing')
      return
    }
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pro Badge - Show if locked */}
      {user && !canAccessSabiQuiz && !entitlementsLoading && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 sm:py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">SabiQuiz is a Pro feature</span>
            </div>
            <Button
              onClick={() => router.push('/pricing')}
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-3 sm:px-4 py-1"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-pink-50/80 via-pink-50/60 to-white" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-red-50 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            SabiQuiz
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-2 px-4">
            AI-powered quizzes designed for every learners.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-gray-800 font-medium max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 lg:mb-10 px-4">
            Upload any material. Get instant quizzes. Master every topic.
          </p>
          
          <Button
            onClick={handleStartLearning}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {!user ? 'Login to Start' : !canAccessSabiQuiz ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </>
            ) : (
              <>
                Start Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Hero Stats */}
          <div className="mt-10 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {heroStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-red-50 rounded-lg mb-2">
                    <Icon className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{stat.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Problems Solved Section */}
      <div className="bg-gray-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Study Smarter, Not Harder</h2>
            <p className="text-sm text-gray-400">Real problems. Real solutions.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {problemsSolved.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-gray-800 rounded-xl p-5">
                  <Icon className="w-8 h-8 text-red-400 mb-3" />
                  <p className="text-gray-400 text-xs line-through mb-2">{item.problem}</p>
                  <p className="text-white text-sm font-medium">{item.solution}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* How It Works - Enhanced */}
      <div className="bg-white border-y border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">How SabiQuiz Works</h2>
            <p className="text-sm text-gray-600">Three steps to mastery</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-12">
            <div className="text-center relative">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">1. Upload Material</h3>
              <p className="text-sm text-gray-600">Upload any PDF, document, or study material</p>
              <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gray-200" />
            </div>

            <div className="text-center relative">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">2. Take Quiz</h3>
              <p className="text-sm text-gray-600">AI generates questions instantly. Choose your challenge mode.</p>
              <div className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gray-200" />
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">3. Level Up</h3>
              <p className="text-sm text-gray-600">Earn XP, unlock badges, track mastery, and watch yourself grow.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Modes Section - NEW */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Challenge Modes</h2>
            <p className="text-sm text-gray-600">Test yourself in different ways</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {challengeModes.map((mode) => {
              const Icon = mode.icon
              return (
                <Card key={mode.name} className="overflow-hidden border-0 shadow-lg">
                  <div className={`bg-gradient-to-r ${mode.color} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{mode.name}</h3>
                        <p className="text-white/80 text-xs">{mode.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <ul className="space-y-2">
                      {mode.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gamification Features - NEW */}
      <div className="py-12 sm:py-16 bg-gradient-to-b from-red-50 via-pink-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Learning That Feels Like Gaming</h2>
            <p className="text-sm text-gray-600">Every feature designed to keep you motivated</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {gamificationFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sample Progress Preview */}
          <div className="mt-10 max-w-md mx-auto">
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="text-xl font-bold text-red-600">5</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="font-semibold text-gray-900">Expert</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total XP</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    1,260
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full w-[63%]" />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">740 XP to next level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Your Learning Hub</h2>
          <p className="text-sm text-gray-600">Everything in one place</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            const isLocked = user && !canAccessSabiQuiz
            return (
              <Card
                key={feature.title}
                className={`group cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200 ${isLocked ? 'opacity-75' : ''}`}
                onClick={() => handleFeatureClick(feature.href)}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-900 group-hover:text-red-500 transition-colors">
                    {isLocked ? 'Unlock with Pro' : 'Open'}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Smart Features Section - NEW */}
      <div className="bg-white border-y border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Smart Learning Features</h2>
            <p className="text-sm text-gray-600">AI that adapts to how you learn</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Instant Explanations</h3>
                <p className="text-sm text-gray-600">Every question comes with a detailed explanation. Learn why the answer is correct, not just what it is.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Weak Topic Detection</h3>
                <p className="text-sm text-gray-600">AI automatically identifies topics where you score below 60% and recommends practice quizzes.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Retry Wrong Only</h3>
                <p className="text-sm text-gray-600">After each quiz, retry only the questions you got wrong. No wasted time on what you already know.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Performance Analytics</h3>
                <p className="text-sm text-gray-600">Track score trends, see difficulty breakdowns, monitor your streak, and watch your mastery grow over time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Card className="bg-gray-900 border-0 overflow-hidden">
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            
            <div className="relative">
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
                Ready to transform how you study?
              </h2>
              <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-2xl mx-auto">
                Join thousands of learners mastering their courses with AI-powered quizzes, gamified learning, and smart analytics.
              </p>
              <Button
                onClick={handleStartLearning}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3"
              >
                {!user ? 'Login to Start' : !canAccessSabiQuiz ? 'Upgrade to Pro' : 'Start Learning Now'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}