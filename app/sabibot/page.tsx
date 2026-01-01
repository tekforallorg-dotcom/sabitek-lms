'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Globe,
  BookOpen,
  Target,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  Brain,
  Clock,
  Sparkles,
  Users,
  Heart,
  Lightbulb,
  RotateCcw,
  MessageCircle
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
      icon: GraduationCap,
      title: 'Exam Preparation',
      description: 'school study plans with weekly targets',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Briefcase,
      title: 'Career Guidance',
      description: 'Tech roadmaps, salary insights, transition plans',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      title: 'Tech Roadmaps',
      description: 'Frontend, Backend, DevOps, Data Science paths',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Target,
      title: 'Study Planning',
      description: 'Schedules that fit work, commute, and family',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: BookOpen,
      title: 'Certification Help',
      description: 'AWS, Azure, Google Cloud, CompTIA guidance',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Shield,
      title: 'Interview Prep',
      description: 'Technical prep and salary negotiation tips',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ]

  const languages = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'Pidgin', flag: '🇳🇬' },
    { name: 'Yoruba', flag: '🇳🇬' },
    { name: 'Hausa', flag: '🇳🇬' },
    { name: 'Igbo', flag: '🇳🇬' },
  ]

  const samplePrompts = [
    "I want to become a frontend developer in 6 months",
    "Help me prepare for school exams, I have 4 months",
    "What's the salary range for DevOps in Lagos?",
    "Create a study plan for AWS certification",
    "I'm a teacher, how can I earn online?",
    "How do I transition from banking to tech?",
  ]

  const problemsSolved = [
    { problem: 'Generic career advice', solution: 'Context-aware guidance based on your realities', icon: Target },
    { problem: 'One-size-fits-all plans', solution: 'Personalized to your schedule & constraints', icon: Clock },
    { problem: 'Forgetting your progress', solution: 'Memory that tracks goals & streaks', icon: Brain },
    { problem: 'Language barriers', solution: '5 languages including Pidgin & local languages', icon: Globe },
  ]

  const smartFeatures = [
    { icon: Brain, title: 'Remembers You', desc: 'Tracks your goals, progress, and study streaks across sessions' },
    { icon: Lightbulb, title: 'Actionable Plans', desc: 'Not generic advice, specific steps with timelines you can follow' },
    { icon: Globe, title: 'Local Context', desc: 'Understands NYSC, salary ranges, data costs, power constraints' },
    { icon: RotateCcw, title: 'Continuous Support', desc: 'Pick up where you left off, adjust plans as life changes' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Compressed */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* Bot Avatar */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4 shadow-2xl">
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-white">
              SabiBot
            </h1>
            <p className="text-base sm:text-lg text-gray-300 mb-1">
              Your AI Learning Companion
            </p>
            <p className="text-sm text-gray-400 mb-6 max-w-xl mx-auto">
              Clear guidance, better direction, and steady growth, tailored to your goals.
            </p>

            {/* Language Pills - Compact */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {languages.map(lang => (
                <span 
                  key={lang.name}
                  className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs flex items-center gap-1"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              ))}
            </div>

            <Button
              onClick={() => handleStartChat()}
              disabled={isStarting}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chatting
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              Free to use • No limits • Remembers your progress
            </p>
          </div>
        </div>
      </div>

      {/* Problems Solved - NEW */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {problemsSolved.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="text-center p-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-xs text-gray-400 line-through mb-1">{item.problem}</p>
                  <p className="text-sm text-gray-900 font-medium">{item.solution}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Capabilities Grid - Compressed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            How SabiBot Helps You
          </h2>
          <p className="text-sm text-gray-600">
            Practical guidance tailored to every learner
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {capabilities.map((cap, idx) => {
            const IconComponent = cap.icon
            return (
              <Card key={idx} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${cap.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <IconComponent className={`w-5 h-5 ${cap.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{cap.title}</h3>
                  <p className="text-xs text-gray-600">{cap.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sample Prompts - Compact */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-y border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Try Asking
            </h2>
            <p className="text-sm text-gray-600">Click any prompt to start</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-4xl mx-auto">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleStartChat(prompt)}
                className="text-left p-3 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-colors group flex items-center justify-between gap-2"
              >
                <p className="text-sm text-gray-700 group-hover:text-gray-900 line-clamp-1">"{prompt}"</p>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 flex-shrink-0 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Features - NEW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Smarter Than Typical AI
          </h2>
          <p className="text-sm text-gray-600">
            Built specifically for learners in Africa
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {smartFeatures.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat Preview - Compact */}
      <div className="bg-gray-900 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Built for Your Reality
              </h2>
              <div className="space-y-3">
                {[
                  'Understands school requirements context',
                  'Knows realistic salary ranges across Africa',
                  'Considers data costs and power constraints',
                  'Speaks your language, literally',
                  'Remembers your goals and progress',
                  'Gives actionable plans, not fluff',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">SabiBot</p>
                  <p className="text-xs text-gray-500">AI Companion</p>
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300 space-y-2">
                <p>
                  How you dey! I see say you wan become frontend developer. Make we map am:
                </p>
                <p className="text-xs">
                  <span className="text-white font-medium">Month 1-2:</span> HTML, CSS, JavaScript basics. Build 3 small projects.
                </p>
                <p className="text-xs">
                  <span className="text-white font-medium">Month 3-4:</span> React fundamentals. Clone 2 real websites.
                </p>
                <p className="text-xs">
                  <span className="text-white font-medium">Month 5-6:</span> Portfolio + job applications. Entry: ₦150k-300k/month.
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * Example response in Pidgin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - NEW */}
      <div className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-600">Languages Supported</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">24/7</p>
              <p className="text-xs text-gray-600">Always Available</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">∞</p>
              <p className="text-xs text-gray-600">Unlimited Chats</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">Free</p>
              <p className="text-xs text-gray-600">No Hidden Costs</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Compact */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Ready to accelerate your growth?
          </h2>
          <p className="text-red-100 text-sm mb-6 max-w-xl mx-auto">
            Get personalized guidance from a companion who understands your journey
          </p>
          <Button
            onClick={() => handleStartChat()}
            size="lg"
            className="bg-white text-red-600 hover:bg-red-50 px-6 py-3 text-base rounded-xl"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Chatting Now
          </Button>
        </div>
      </div>
    </div>
  )
}