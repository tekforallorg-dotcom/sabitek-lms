'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, BarChart3, BookOpen, Clock, ArrowRight, Trophy, Target, Zap, Lock, Crown } from 'lucide-react'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useAuth } from '@/hooks/useAuth'

export default function SabiQuizHomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccessSabiQuiz, loading: entitlementsLoading } = useEntitlements()

  const features = [
    {
      title: 'Analytics',
      description: 'Track your progress and performance',
      icon: BarChart3,
      href: '/sabiquiz/analytics',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Materials',
      description: 'Browse and take quizzes',
      icon: BookOpen,
      href: '/sabiquiz/materials',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Quiz History',
      description: 'View all your past attempts',
      icon: Clock,
      href: '/sabiquiz/history',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ]

  const stats = [
    { icon: Trophy, label: 'AI-Generated Questions' },
    { icon: Target, label: 'Personalized Learning' },
    { icon: Zap, label: 'Instant Feedback' },
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
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 lg:mb-10 px-4">
            AI-powered quizzes designed for Nigerian learners. Test your knowledge, track your progress, and master any topic.
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

          {/* Stats */}
          <div className="mt-10 sm:mt-12 lg:mt-16 grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Everything you need to excel</h2>
          <p className="text-xs sm:text-sm text-gray-600">Comprehensive tools to help you learn and track your progress</p>
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
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.iconColor}`} />
                    </div>
                    {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{feature.description}</p>
                  
                  <div className="flex items-center text-xs sm:text-sm text-gray-900 group-hover:text-red-500 transition-colors">
                    {isLocked ? 'Unlock with Pro' : 'Open'}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-y border-gray-200 py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">How SabiQuiz Works</h2>
            <p className="text-xs sm:text-sm text-gray-600">Simple, effective, and designed for you</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                1
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Choose Material</h3>
              <p className="text-xs sm:text-sm text-gray-600">Browse materials and select your topic</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                2
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Take Quiz</h3>
              <p className="text-xs sm:text-sm text-gray-600">Answer AI-generated questions at your pace</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                3
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Track Progress</h3>
              <p className="text-xs sm:text-sm text-gray-600">Get insights and recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <Card className="bg-gray-900 border-0 overflow-hidden">
          <div className="relative p-6 sm:p-8 lg:p-12 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            
            <div className="relative">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to start learning?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join thousands of students mastering new topics with SabiQuiz
              </p>
              <Button
                onClick={handleStartLearning}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {!user ? 'Login to Start' : !canAccessSabiQuiz ? 'Upgrade to Pro' : 'Get Started Now'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}