'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageSquare, 
  GraduationCap,
  ArrowRight,
  Sparkles,
  Clock,
  Globe,
  Star,
  Target,
  Zap,
  BookOpen,
  Award,
  CheckCircle,
  Handshake,
  Wallet
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

  const handleBrowseRequests = () => {
    if (!user) {
      router.push('/auth/login?redirect=/community/requests')
      return
    }
    router.push('/community/requests')
  }

  const features = [
    {
      title: 'Browse Requests',
      description: 'Find learners who need your expertise',
      icon: MessageSquare,
      href: '/community/requests',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Find Mentors',
      description: 'Connect with experts in any skill',
      icon: Users,
      href: '/community/mentors',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'My Profile',
      description: 'Set your skills and availability',
      icon: Target,
      href: '/community/profile',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ]

 const stats = [
  { icon: Handshake, label: 'Peer-to-Pro Learning' },
  { icon: Sparkles, label: 'Smart Matching' },
  { icon: Wallet, label: 'Earn with Skills' },
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
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/80 via-red-50/60 to-white" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-red-600 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-red-200 shadow-sm">
           <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            AI Powered Peer-to-Peer Learning
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            SabiCommunity
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 lg:mb-10 px-4">
            Connect with mentors and learners across Nigeria. Share your knowledge, 
            learn new skills, and earn credits through peer-to-peer sessions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGetStarted}
              disabled={isStarting}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : !user ? (
                'Login to Get Started'
              ) : (
                <>
                  Setup My Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              onClick={handleBrowseRequests}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Browse Requests
            </Button>
          </div>

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
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Learn and Teach Together</h2>
          <p className="text-xs sm:text-sm text-gray-600">Everyone has something to teach and something to learn</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200"
                onClick={() => handleFeatureClick(feature.href)}
              >
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.iconColor}`} />
                    </div>
                  </div>
                  
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{feature.description}</p>
                  
                  <div className="flex items-center text-xs sm:text-sm text-gray-900 group-hover:text-red-500 transition-colors">
                    {!user ? 'Login to access' : 'Open'}
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
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">How SabiCommunity Works</h2>
            <p className="text-xs sm:text-sm text-gray-600">Simple peer-to-peer learning in 4 steps</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                1
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Set Your Skills</h3>
              <p className="text-xs sm:text-sm text-gray-600">Add skills you can teach and want to learn</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                2
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Post or Browse</h3>
              <p className="text-xs sm:text-sm text-gray-600">Post a request or find mentors for any skill</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                3
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Book Session</h3>
              <p className="text-xs sm:text-sm text-gray-600">Schedule a 1:1 session at your convenience</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-bold">
                4
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Learn & Earn</h3>
              <p className="text-xs sm:text-sm text-gray-600">Complete sessions and earn credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Why SabiCommunity?</h2>
          <p className="text-xs sm:text-sm text-gray-600">Built for Nigerian learners and mentors</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {[
            'Learn from peers who understand your context',
            'Teach what you know and earn credits',
            'Flexible scheduling that fits your life',
            'Support for low-bandwidth connections',
            'Languages: English, Pidgin, Yoruba, Hausa, Igbo',
            'Google Meet, Zoom, or WhatsApp calls',
            'Build your reputation with reviews',
            'Free to start - no upfront payment',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3 text-left bg-white p-3 rounded-lg border border-gray-200">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <Card className="bg-gray-900 border-0 overflow-hidden">
          <div className="relative p-6 sm:p-8 lg:p-12 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            
            <div className="relative">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to join the community?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Set up your profile in 2 minutes and start connecting with learners and mentors
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {!user ? 'Login to Get Started' : 'Complete My Profile'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}