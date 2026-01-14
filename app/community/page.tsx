'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  CheckCircle,
  Handshake,
  Wallet,
  UserPlus,
  Calendar
} from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isStarting, setIsStarting] = useState(false)

  const handleGetStarted = () => {
    if (!user) {
      router.push('/auth/login?redirect=/community/profile')
      return
    }
    setIsStarting(true)
    router.push('/community/profile')
  }

  const tools = [
    {
      id: 'requests',
      title: 'Browse Requests',
      description: 'Find learners who need your expertise',
      icon: MessageSquare,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/community/requests',
      features: ['View all requests', 'Filter by skill', 'Make offers'],
    },
    {
      id: 'mentors',
      title: 'Find Mentors',
      description: 'Connect with experts in any skill',
      icon: Users,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      href: '/community/browse',
      features: ['Search by skill', 'View profiles', 'Book sessions'],
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Set your skills and availability',
      icon: Target,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      href: '/community/profile',
      features: ['Add teach skills', 'Add learn skills', 'Set rates'],
    },
    {
      id: 'sessions',
      title: 'My Sessions',
      description: 'Manage your scheduled sessions',
      icon: Calendar,
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      href: '/community/sessions',
      features: ['View upcoming', 'Track history', 'Leave reviews'],
    },
  ]

  const stats = [
    { icon: Handshake, value: 'P2P', label: 'Learning' },
    { icon: Sparkles, value: 'AI', label: 'Matching' },
    { icon: Wallet, value: 'Earn', label: 'Credits' },
  ]

  const benefits = [
    { icon: Users, title: 'Peer Learning', desc: 'Learn from those who understand your context' },
    { icon: Wallet, title: 'Earn Credits', desc: 'Teach what you know and get paid' },
    { icon: Calendar, title: 'Flexible', desc: 'Schedule sessions that fit your life' },
    { icon: UserPlus, title: 'Free Start', desc: 'No upfront payment required' },
  ]

  const handleFeatureClick = (href: string) => {
    if (!user) {
      router.push(`/auth/login?redirect=${href}`)
      return
    }
    router.push(href)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
       <div className="min-h-screen bg-gray-50">

      {/* Hero - Compact with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-red-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border border-red-200">
              <Zap className="w-3 h-3" />
              AI-Powered Peer Learning
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Learn and <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">Earn Together</span>
            </h1>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
              Connect with mentors and learners across Nigeria. Share your knowledge, learn new skills, and earn credits.
            </p>

            <button
              onClick={handleGetStarted}
              disabled={isStarting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  {user ? 'Setup My Profile' : 'Login to Get Started'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Free to start • Earn by teaching • Learn from peers
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
              <div
                key={tool.id}
                onClick={() => handleFeatureClick(tool.href)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer"
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
              </div>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-bold">{stat.value}</h3>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Benefits Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-0.5">{benefit.title}</h3>
                <p className="text-[10px] text-gray-500">{benefit.desc}</p>
              </div>
            )
          })}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 text-center">How It Works</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Set Skills', desc: 'Teach & learn' },
              { num: 2, title: 'Connect', desc: 'Find matches' },
              { num: 3, title: 'Book', desc: 'Schedule session' },
              { num: 4, title: 'Earn', desc: 'Get credits' },
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