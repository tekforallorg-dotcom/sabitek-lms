'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bot,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Briefcase,
  Globe,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react'

export default function SabiBotPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isStarting, setIsStarting] = useState(false)

  const handleStartChat = () => {
    if (!user) {
      router.push('/auth/login?redirect=/sabibot/chat')
      return
    }
    setIsStarting(true)
    router.push('/sabibot/chat')
  }

  const capabilities = [
    {
      icon: GraduationCap,
      title: 'Exam Preparation',
      description: 'WAEC, NECO, JAMB study plans with weekly targets and past question strategies',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Briefcase,
      title: 'Career Guidance',
      description: 'Tech career roadmaps, salary insights, and transition plans for job market',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      title: 'Tech Roadmaps',
      description: 'Frontend, Backend, DevOps, Data Science paths with realistic timelines',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Target,
      title: 'Study Planning',
      description: 'Personalized schedules that fit your work, commute, and family duties',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: BookOpen,
      title: 'Certification Help',
      description: 'AWS, Azure, Google Cloud, CompTIA study plans and cost-benefit analysis',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Shield,
      title: 'Interview Prep',
      description: 'Behavioral questions, technical prep, and salary negotiation coaching',
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
    "Help me prepare for JAMB, I have 4 months",
    "What's the salary range for DevOps engineers in Lagos?",
    "Create a study plan for AWS certification",
    "I'm a teacher, how can I earn online?",
    "How do I transition from banking to tech?",
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Bot Avatar */}
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-2xl">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              SabiBot
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-2">
              Your AI Learning Companion 
            </p>
            <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-2xl mx-auto">
             Clear guidance, better direction, and steady growth, tailored to your goals.
            </p>

            {/* Language Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {languages.map(lang => (
                <span 
                  key={lang.name}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm flex items-center gap-1.5"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              ))}
            </div>

            <Button
              onClick={handleStartChat}
              disabled={isStarting}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isStarting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {user ? 'Start Chatting' : 'Login to Chat'}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              Free to use • No limits • Remembers your progress
            </p>
          </div>
        </div>

        {/* Wave */}
        <div className="h-16 bg-gray-50 relative -mt-1">
          <svg 
            className="absolute -top-1 left-0 w-full h-16 text-gray-900" 
            viewBox="0 0 1440 64" 
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,32 C480,64 960,0 1440,32 L1440,0 L0,0 Z"></path>
          </svg>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            How SabiBot Can Help You
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From exam prep to career transitions, get practical, actionable guidance tailored to every learners realities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {capabilities.map((cap, idx) => {
            const IconComponent = cap.icon
            return (
              <Card key={idx} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className={`w-12 h-12 ${cap.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <IconComponent className={`w-6 h-6 ${cap.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{cap.title}</h3>
                  <p className="text-sm text-gray-600">{cap.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sample Prompts */}
      <div className="bg-white border-y border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Try Asking SabiBot
            </h2>
            <p className="text-gray-600">Click any prompt to start a conversation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!user) {
                    router.push('/auth/login?redirect=/sabibot/chat')
                  } else {
                    router.push(`/sabibot/chat?prompt=${encodeURIComponent(prompt)}`)
                  }
                }}
                className="text-left p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-colors group"
              >
                <p className="text-sm text-gray-700 group-hover:text-gray-900">"{prompt}"</p>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 mt-2 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Built for Every Learner
            </h2>
            <div className="space-y-4">
              {[
                'Understands examination requirements and education systems',
                'Knows realistic salary ranges for tech roles globally',
                'Considers power outages, data costs, and time constraints',
                'Speaks English, Pidgin, Yoruba, Hausa, and Igbo',
                'Remembers your goals and tracks your study streaks',
                'Provides actionable plans, not generic advice',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">SabiBot</p>
                <p className="text-xs text-gray-400">AI Learning Companion</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 mb-4">
              <p className="mb-3">
                How you dey! I see say you wan become frontend developer. Make we map the journey:
              </p>
              <p className="mb-2">
                <strong className="text-white">Month 1-2:</strong> HTML, CSS, JavaScript basics. Build 3 small projects.
              </p>
              <p className="mb-2">
                <strong className="text-white">Month 3-4:</strong> React fundamentals. Clone 2 real websites.
              </p>
              <p>
                <strong className="text-white">Month 5-6:</strong> Portfolio + job applications. Target entry roles: ₦150k-300k/month.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              * Example response in Nigerian Pidgin
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to accelerate your learning?
          </h2>
          <p className="text-red-100 mb-8 max-w-2xl mx-auto">
            Get personalized guidance from a mentor who understands your journey
          </p>
          <Button
            onClick={handleStartChat}
            size="lg"
            className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 text-base sm:text-lg rounded-xl"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            {user ? 'Start Chatting Now' : 'Login to Get Started'}
          </Button>
        </div>
      </div>
    </div>
  )
}