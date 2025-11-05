'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, BarChart3, BookOpen, Clock, ArrowRight, Trophy, Target, Zap } from 'lucide-react'

export default function SabiQuizHomePage() {
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Baby Pink Gradient */}
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            SabiQuiz
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            AI-powered quizzes designed for Nigerian learners. Test your knowledge, track your progress, and master any topic.
          </p>
          
          <Button
            onClick={() => router.push('/sabiquiz/materials')}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-base"
          >
            Start Learning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to excel</h2>
          <p className="text-gray-600">Comprehensive tools to help you learn and track your progress</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200"
                onClick={() => router.push(feature.href)}
              >
                <div className="p-6">
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-900 group-hover:text-red-500 transition-colors">
                    Open
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How SabiQuiz Works</h2>
            <p className="text-gray-600">Simple, effective, and designed for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Material</h3>
              <p className="text-sm text-gray-600">Browse materials and select your topic</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Take Quiz</h3>
              <p className="text-sm text-gray-600">Answer AI-generated questions at your pace</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">Get insights and recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gray-900 border-0 overflow-hidden">
          <div className="relative p-12 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to start learning?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of students mastering new topics with SabiQuiz
              </p>
              <Button
                onClick={() => router.push('/sabiquiz/materials')}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}