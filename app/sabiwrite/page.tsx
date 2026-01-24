'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import SabiLoader from '@/components/ui/SabiLoader'
import { 
  PenTool, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  ScanSearch,
  Wand2,
  FileCheck,
  Wallet,
  Plus,
  GraduationCap,
  Briefcase,
  Users
} from 'lucide-react'

export default function SabiWriteLandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { balance } = useWallet()

  const tools = [
    {
      id: 'writing',
      title: 'Writing Assistant',
      description: 'Rewrite, shorten, expand, or improve your text with AI',
      icon: PenTool,
      lightColor: 'bg-red-50',
      textColor: 'text-red-600',
      features: ['Rewrite & improve', 'Expand or shorten', 'Fix grammar'],
      price: 'From ₦30',
    },
    {
      id: 'detection',
      title: 'AI Detection',
      description: 'Check if content was written by AI with probability scores',
      icon: ScanSearch,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      features: ['AI probability score', 'Sentence analysis', 'Detailed report'],
      price: 'From ₦100',
    },
    {
      id: 'humanizer',
      title: 'Humanizer',
      description: 'Make AI-generated text sound natural and human-written',
      icon: Wand2,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      features: ['Natural rewrites', 'Bypass AI detection', 'Keep meaning'],
      price: 'From ₦150',
    },
    {
      id: 'plagiarism',
      title: 'Plagiarism Check',
      description: 'Check your content for similarity against online sources',
      icon: FileCheck,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      features: ['Source matching', 'Similarity score', 'Citation help'],
      price: 'From ₦200',
    },
  ]

  const stats = [
    { value: '100K+', label: 'Words Polished' },
    { value: '18s', label: 'Avg Time' },
    { value: '78%', label: 'Repeat Users' },
  ]

  const useCases = [
    { icon: GraduationCap, title: 'Students', desc: 'Essays, papers, assignments' },
    { icon: Briefcase, title: 'Professionals', desc: 'Reports, emails, proposals' },
    { icon: Users, title: 'Creators', desc: 'Blogs, social, marketing' },
  ]

  const handleGetStarted = () => {
    if (user) {
      router.push('/sabiwrite/editor')
    } else {
      router.push('/auth/login?redirect=/sabiwrite/editor')
    }
  }

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading SabiWrite..." />
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
              <PenTool className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-900">SabiWrite</span>
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
              AI-Powered Writing Suite
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Write, Polish, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">Perfect</span> Your Content
            </h1>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-4">
              AI writing tools built for students and professionals. Detect AI, humanize text, check plagiarism, and more.
            </p>

            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              {user ? 'Open Editor' : 'Login to Start'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Pay per use • No subscriptions • New users get ₦500 free
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
                onClick={handleGetStarted}
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
                    
                    <div className="space-y-1 mb-2">
                      {tool.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold text-red-600">{tool.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <h3 className="text-sm font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Use Cases Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {useCases.map((useCase) => {
            const Icon = useCase.icon
            return (
              <div key={useCase.title} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-0.5">{useCase.title}</h3>
                <p className="text-[10px] text-gray-500">{useCase.desc}</p>
              </div>
            )
          })}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 text-center">How It Works</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Choose Tool', desc: 'Pick a feature' },
              { num: 2, title: 'Enter Text', desc: 'Paste or type' },
              { num: 3, title: 'Process', desc: 'AI does the work' },
              { num: 4, title: 'Download', desc: 'Get results' },
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