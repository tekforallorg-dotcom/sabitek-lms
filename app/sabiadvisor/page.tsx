'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  DollarSign,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Map,
  Wallet,
  Plus,
  ChevronRight,
  Briefcase
} from 'lucide-react'

interface PricingItem {
  operation_type: string
  display_name: string
  description: string
  base_cost_kobo: number
}

export default function SabiAdvisorPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { balance } = useWallet()
  const [pricing, setPricing] = useState<Record<string, PricingItem[]>>({})
  const [loadingPricing, setLoadingPricing] = useState(true)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/advisor/pricing')
      const data = await res.json()
      setPricing(data.pricing || {})
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
    } finally {
      setLoadingPricing(false)
    }
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  const tools = [
    {
      id: 'cv',
      title: 'CV Builder',
      description: 'Create ATS-optimized CVs tailored to your target role',
      icon: FileText,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      href: '/sabiadvisor/cv',
      features: ['Build from profile', 'Tailor to job description', 'ATS optimization'],
      startingPrice: pricing.cv?.[0]?.base_cost_kobo
    },
    {
      id: 'cover',
      title: 'Cover Letter',
      description: 'Generate personalized cover letters that feel human',
      icon: Mail,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      href: '/sabiadvisor/cover-letter',
      features: ['Section structure', 'Company research', 'Tone customization'],
      startingPrice: pricing.cover_letter?.[0]?.base_cost_kobo
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      description: 'Practice with AI and get feedback on your answers',
      icon: MessageSquare,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      href: '/sabiadvisor/interview',
      features: ['Question bank', 'Mock interviews', 'Answer grading'],
      startingPrice: pricing.interview?.[0]?.base_cost_kobo
    },
    {
      id: 'roadmap',
      title: 'Career Roadmap',
      description: 'Get a personalized plan for your career growth',
      icon: Map,
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      href: '/sabiadvisor/survey',
      features: ['Personalized path', '6-month plan', 'Learning resources'],
      startingPrice: pricing.roadmap?.[0]?.base_cost_kobo
    }
  ]

  const stats = [
    { icon: Target, value: '15+', label: 'Career Tracks', color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: DollarSign, value: '₦300k-2M', label: 'Salary Range', color: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Clock, value: '6-12mo', label: 'To Job-Ready', color: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">SabiAdvisor</span>
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
                  Top Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero - Matching SabiQuiz */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-red-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border border-red-200">
              <Zap className="w-3 h-3" />
              AI-Powered Career Tools
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">Professional Profile</span>
            </h1>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
              Create ATS-optimized CVs, write compelling cover letters, and ace your interviews with AI assistance.
            </p>

            {!user ? (
              <button
                onClick={() => router.push('/auth/login?redirect=/sabiadvisor')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
              >
                Login to Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/sabiadvisor/profile"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
              >
                Complete Your Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <p className="text-xs text-gray-500 mt-2">
              No subscriptions • Pay per use • Cached results free
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Reminder */}
        {user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 mb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">
                  <strong>Complete your profile</strong> to power all tools
                </span>
              </div>
              <Link
                href="/sabiadvisor/profile"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Edit Profile
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Tools Grid - 2x2 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.id}
                href={user ? tool.href : '/auth/login?redirect=/sabiadvisor'}
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
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tool.description}</p>
                    
                    <div className="space-y-1 mb-2">
                      {tool.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {tool.startingPrice && (
                      <div className="text-xs">
                        <span className="text-gray-400">From </span>
                        <span className="font-semibold text-gray-900">
                          {formatNaira(tool.startingPrice)}
                        </span>
                      </div>
                    )}
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

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 text-center">How It Works</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Create Profile', desc: 'Add experience & skills' },
              { num: 2, title: 'Choose Tool', desc: 'CV, Cover Letter, etc.' },
              { num: 3, title: 'Confirm Cost', desc: 'See price upfront' },
              { num: 4, title: 'Download', desc: 'Export PDF/DOCX' },
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