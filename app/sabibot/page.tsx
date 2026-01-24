'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import SabiLoader from '@/components/ui/SabiLoader'
import { 
  Bot,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Globe,
  BookOpen,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Zap,
  Brain,
  Clock,
  Lightbulb,
  RotateCcw
} from 'lucide-react'

export default function SabiBotPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isStarting, setIsStarting] = useState(false)

  const handleStartChat = (prompt?: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/sabibot/chat')
      return
    }
    setIsStarting(true)
    if (prompt) {
      router.push(`/sabibot/chat?prompt=${encodeURIComponent(prompt)}`)
    } else {
      router.push('/sabibot/chat')
    }
  }

  const capabilities = [
    {
      id: 'exam',
      title: 'Exam Preparation',
      description: 'Study plans with weekly targets for any exam',
      icon: GraduationCap,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      features: ['Custom study schedules', 'Topic breakdown', 'Progress tracking'],
    },
    {
      id: 'career',
      title: 'Career Guidance',
      description: 'Tech roadmaps, salary insights, transition plans',
      icon: Briefcase,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      features: ['Salary ranges', 'Skill gaps analysis', 'Job market trends'],
    },
    {
      id: 'tech',
      title: 'Tech Roadmaps',
      description: 'Frontend, Backend, DevOps, Data Science paths',
      icon: TrendingUp,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      features: ['Step-by-step paths', 'Resource recommendations', 'Timeline estimates'],
    },
    {
      id: 'cert',
      title: 'Certification Help',
      description: 'AWS, Azure, Google Cloud, CompTIA guidance',
      icon: BookOpen,
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      features: ['Exam strategies', 'Study resources', 'Practice tips'],
    },
  ]

  const languages = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'Pidgin', flag: '🇳🇬' },
    { name: 'Yoruba', flag: '🇳🇬' },
    { name: 'Hausa', flag: '🇳🇬' },
    { name: 'Igbo', flag: '🇳🇬' },
  ]

  const stats = [
    { icon: Globe, value: '5', label: 'Languages', color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Clock, value: '24/7', label: 'Available', color: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Brain, value: 'Free', label: 'Unlimited', color: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const samplePrompts = [
    "I want to become a frontend developer in 6 months",
    "Help me prepare for WAEC, I have 4 months",
    "What's the salary range for DevOps in Lagos?",
    "Create a study plan for AWS certification",
  ]

  const smartFeatures = [
    { icon: Brain, title: 'Remembers You', desc: 'Tracks goals & progress across sessions' },
    { icon: Lightbulb, title: 'Actionable Plans', desc: 'Specific steps with timelines' },
    { icon: Globe, title: 'Local Context', desc: 'Understands African realities' },
    { icon: RotateCcw, title: 'Continuous Support', desc: 'Pick up where you left off' },
  ]

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading SabiBot..." />
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
              <Bot className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">SabiBot</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
  {/* Desktop: Show all languages */}
  <div className="hidden sm:flex flex-wrap gap-1.5">
    {languages.map(lang => (
      <span 
        key={lang.name}
        className="px-2 py-0.5 bg-gray-100 rounded-full text-xs flex items-center gap-1"
      >
        <span>{lang.flag}</span>
        <span>{lang.name}</span>
      </span>
    ))}
  </div>
  {/* Mobile: Show only UK + Nigeria flags */}
  <div className="flex sm:hidden gap-1.5">
    <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">🇬🇧</span>
    <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">🇳🇬</span>
  </div>
</div>
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
              AI Learning Companion
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">Study Buddy</span>
            </h1>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
              Get personalized guidance for exams, career transitions, tech roadmaps, and certifications in your language.
            </p>

            <button
              onClick={() => handleStartChat()}
              disabled={isStarting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  {user ? 'Start Chatting' : 'Login to Chat'}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Free to use • No limits • Remembers your progress
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Sample Prompts */}
        {user && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-3 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Try asking:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartChat(prompt)}
                  className="text-xs bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg text-gray-700 hover:text-red-700 transition-colors"
                >
                  "{prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities Grid - 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.id}
                onClick={() => handleStartChat()}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${cap.lightColor} rounded-lg flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cap.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        {cap.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{cap.description}</p>
                    
                    <div className="space-y-1">
                      {cap.features.map((feature, i) => (
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
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold">{stat.value}</h3>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Smart Features Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {smartFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-gray-700" />
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
              { num: 1, title: 'Start Chat', desc: 'Ask anything' },
              { num: 2, title: 'Get Plan', desc: 'Personalized advice' },
              { num: 3, title: 'Track Progress', desc: 'SabiBot remembers' },
              { num: 4, title: 'Achieve Goals', desc: 'Step by step' },
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