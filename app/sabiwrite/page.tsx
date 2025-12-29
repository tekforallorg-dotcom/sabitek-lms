'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  PenTool, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  BookOpen,
  GraduationCap,
  Briefcase,
  Globe,
  Clock,
  Shield,
  Coins,
  Wallet,
  ChevronRight,
  Star,
  FileCheck,
  ScanSearch,
  Wand2,
  Users,
  RefreshCw,
  X,
  Loader2
} from 'lucide-react'

const MAIN_TOOLS = [
  {
    icon: PenTool,
    title: 'Writing Assistant',
    description: 'Rewrite, shorten, expand, or improve your text with AI',
    price: 'From ₦30',
    color: 'red',
  },
  {
    icon: ScanSearch,
    title: 'AI Detection',
    description: 'Check if content was written by AI with probability scores',
    price: 'From ₦100',
    color: 'blue',
  },
  {
    icon: Wand2,
    title: 'Humanizer',
    description: 'Make AI-generated text sound natural and human-written',
    price: 'From ₦150',
    color: 'purple',
  },
  {
    icon: FileCheck,
    title: 'Plagiarism Check',
    description: 'Check your content for similarity against online sources',
    price: 'From ₦200',
    color: 'green',
  },
]

const FEATURES = [
  {
    icon: FileText,
    title: 'Essay & Report Writing',
    description: 'Generate well-structured essays, research papers, and reports.',
  },
  {
    icon: Globe,
    title: 'Educational Context',
    description: 'Optimized for school and local writing styles.',
  },
  {
    icon: BookOpen,
    title: 'Summarization',
    description: 'Condense long documents into clear, concise summaries.',
  },
  {
    icon: RefreshCw,
    title: 'Instant Results',
    description: 'Get polished content in seconds, not hours.',
  },
]

const USE_CASES = [
  {
    icon: GraduationCap,
    title: 'Students',
    items: ['Essays & assignments', 'Research papers', 'Study notes', 'Exam prep'],
  },
  {
    icon: Briefcase,
    title: 'Professionals',
    items: ['Business proposals', 'Reports & memos', 'Email drafts', 'Presentations'],
  },
  {
    icon: Users,
    title: 'Content Creators',
    items: ['Blog posts', 'Social media content', 'Marketing copy', 'Scripts'],
  },
]

const TOPUP_AMOUNTS = [
  { value: 500, label: '₦500' },
  { value: 1000, label: '₦1,000', popular: true },
  { value: 2000, label: '₦2,000' },
  { value: 5000, label: '₦5,000' },
]

export default function SabiWriteLandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchWalletBalance()
    }
  }, [user])

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch('/api/sabiwrite/wallet')
      if (res.ok) {
        const data = await res.json()
        setWalletBalance(data.wallet?.balanceKobo ? data.wallet.balanceKobo / 100 : 0)
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error)
    }
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/sabiwrite/editor')
    } else {
      router.push('/auth/login?redirect=/sabiwrite/editor')
    }
  }

  const handleTopUpClick = () => {
    if (user) {
      setShowTopUpModal(true)
      setError('')
    } else {
      router.push('/auth/login?redirect=/sabiwrite')
    }
  }

  const handleTopUpSubmit = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount
    
    if (!amount || amount < 100) {
      setError('Minimum top-up amount is ₦100')
      return
    }

    if (amount > 100000) {
      setError('Maximum top-up amount is ₦100,000')
      return
    }

    if (!user) {
      setError('Please log in to continue')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/sabiwrite/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100,
          userId: user.id,
          email: user.email,
          callback_url: `${window.location.origin}/sabiwrite/billing?verify=true`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err: any) {
      console.error('Top-up error:', err)
      setError(err.message || 'Failed to process payment. Please try again.')
      setIsProcessing(false)
    }
  }

  const getToolColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      red: { bg: 'bg-red-100', text: 'text-red-500', border: 'hover:border-red-300' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-500', border: 'hover:border-blue-300' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-500', border: 'hover:border-purple-300' },
      green: { bg: 'bg-green-100', text: 'text-green-500', border: 'hover:border-green-300' },
    }
    return colors[color] || colors.red
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Up Modal */}
      {showTopUpModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isProcessing && setShowTopUpModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Top Up Wallet</h2>
                  <p className="text-sm text-white/80">Add funds to your SabiWrite wallet</p>
                </div>
                <button
                  onClick={() => !isProcessing && setShowTopUpModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {walletBalance !== null && (
                <div className="mt-4 bg-white/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-white/80">Current Balance</p>
                  <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Select Amount</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {TOPUP_AMOUNTS.map((amt) => (
                  <button
                    key={amt.value}
                    onClick={() => {
                      setSelectedAmount(amt.value)
                      setCustomAmount('')
                    }}
                    disabled={isProcessing}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedAmount === amt.value && !customAmount
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {amt.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        POPULAR
                      </span>
                    )}
                    <span className="text-lg font-bold text-gray-900">{amt.label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount(0)
                    }}
                    disabled={isProcessing}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Min: ₦100 • Max: ₦100,000</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                onClick={handleTopUpSubmit}
                disabled={isProcessing || (!selectedAmount && !customAmount)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5 mr-2" />
                    Pay ₦{(customAmount ? parseInt(customAmount) || 0 : selectedAmount).toLocaleString()} with Paystack
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Secure payment powered by Paystack
              </p>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-pink-500"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-32 sm:pb-36">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">AI-Powered Writing Suite</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              <span className="text-white">Sabi</span>Write
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-2xl mx-auto">
              Write, Polish, and Perfect Your Content
            </p>
            <p className="text-base sm:text-lg text-white/70 mb-8 max-w-xl mx-auto">
              AI writing tools built for students and professionals. 
              Detect AI, humanize text, check plagiarism, and more.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-red-600 hover:bg-white hover:text-red-700 text-base px-8 py-6 rounded-xl shadow-lg transition-all group"
              >
                Start Writing Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              {user && (
                <Button 
                  onClick={handleTopUpClick}
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/40 text-base px-6 py-6 rounded-xl transition-all"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {walletBalance !== null ? `Balance: ₦${walletBalance.toLocaleString()}` : 'Top Up Wallet'}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">100K+</div>
                <div className="text-sm text-white/70">Words Polished</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">18s</div>
                <div className="text-sm text-white/70">Avg Time to First Draft</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">78%</div>
                <div className="text-sm text-white/70">Repeat Writers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Main Tools Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful AI Writing Tools
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, check, and perfect your content.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MAIN_TOOLS.map((tool, idx) => {
              const colorClasses = getToolColorClasses(tool.color)
              return (
                <Card 
                  key={idx} 
                  className={`group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-100 ${colorClasses.border}`}
                  onClick={handleGetStarted}
                >
                  <CardContent className="p-5">
                    <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <tool.icon className={`w-6 h-6 ${colorClasses.text}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{tool.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tool.description}</p>
                    <div className={`text-sm font-semibold ${colorClasses.text}`}>{tool.price}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <Button 
              onClick={handleGetStarted}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl"
            >
              Try All Tools
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              More Features
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Built for Everyone
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Whether you're a student, professional, or creator, SabiWrite helps you write better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {USE_CASES.map((useCase, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                    <useCase.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <ul className="space-y-2">
                    {useCase.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Simple Pay-Per-Use Pricing
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              No subscriptions. Top up your wallet and pay only for what you use.
            </p>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Wallet-Based Pricing</h3>
                <p className="text-white/80 text-sm">Top up once, use across all tools</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {MAIN_TOOLS.map((tool, idx) => (
                    <div key={idx} className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-900 mb-1">{tool.title}</div>
                      <div className="text-red-500 font-semibold text-sm">{tool.price}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">New users get ₦500 free</span> to try all tools
                      </p>
                    </div>
                    <Button 
                      onClick={handleTopUpClick}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Top Up Wallet
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose a Tool', desc: 'Select Writing Assistant, AI Detection, Humanizer, or Plagiarism Check.' },
              { step: '2', title: 'Enter Your Text', desc: 'Paste your content or type what you need help with.' },
              { step: '3', title: 'Get Results', desc: 'Receive polished, analyzed, or improved content instantly.' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-5 left-10 w-full h-0.5 bg-gray-200">
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Instant Results</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="w-5 h-5 text-red-500" />
              <span className="text-sm">Made for Everyone</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 sm:py-16 bg-gradient-to-br from-red-600 to-pink-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Write Smarter?
          </h2>
          <p className="text-base text-white/80 mb-6 max-w-lg mx-auto">
            Join thousands creating better content with SabiWrite.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-red-600 hover:bg-white hover:text-red-700 text-base px-8 py-5 rounded-xl shadow-lg transition-all group"
            >
              Start Writing Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              onClick={handleTopUpClick}
              size="lg"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/40 text-base px-6 py-5 rounded-xl transition-all"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Top Up Wallet
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}