'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  PenLine, 
  ScanSearch, 
  Sparkles, 
  FileSearch,
  Settings,
  Wallet,
  ChevronRight,
  Menu,
  X,
  Coins,
  Loader2,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import ToolPanel from './ToolPanel'
import ChatPanel from './ChatPanel'
import OutputPanel from './OutputPanel'
import { ToolType, ToneType, SabiwriteMessage } from '@/lib/sabiwrite/types'

interface SabiwriteLayoutProps {
  walletBalance: number
  planTier: string
  isLoadingWallet: boolean
  onWalletUpdate: (balance: number) => void
}

type ActiveTool = 'writing' | 'detection' | 'humanize' | 'plagiarism' | 'settings'

const TOPUP_AMOUNTS = [
  { value: 500, label: '₦500' },
  { value: 1000, label: '₦1,000', popular: true },
  { value: 2000, label: '₦2,000' },
  { value: 5000, label: '₦5,000' },
]

export default function SabiwriteLayout({
  walletBalance,
  planTier,
  isLoadingWallet,
  onWalletUpdate
}: SabiwriteLayoutProps) {
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState<ActiveTool>('writing')
  const [selectedTone, setSelectedTone] = useState<ToneType>('neutral')
  const [messages, setMessages] = useState<SabiwriteMessage[]>([])
  const [currentOutput, setCurrentOutput] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileOutputOpen, setIsMobileOutputOpen] = useState(false)

  // Top Up Modal States
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false)
  const [topUpError, setTopUpError] = useState('')

  const formatNaira = (kobo: number) => {
    const naira = kobo / 100
    return `₦${naira.toLocaleString()}`
  }

  const getPlanBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-purple-100 text-purple-700'
      case 'monthly': return 'bg-blue-100 text-blue-700'
      case 'weekly': return 'bg-green-100 text-green-700'
      case 'daily': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleTopUpClick = () => {
    setShowTopUpModal(true)
    setTopUpError('')
  }

  const handleTopUpSubmit = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount
    
    if (!amount || amount < 100) {
      setTopUpError('Minimum top-up amount is ₦100')
      return
    }

    if (amount > 100000) {
      setTopUpError('Maximum top-up amount is ₦100,000')
      return
    }

    if (!user) {
      setTopUpError('Please log in to continue')
      return
    }

    setIsTopUpProcessing(true)
    setTopUpError('')

    try {
      const res = await fetch('/api/sabiwrite/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to kobo
          userId: user.id,
          email: user.email,
          callback_url: `${window.location.origin}/sabiwrite/billing?verify=true`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err: any) {
      console.error('Top-up error:', err)
      setTopUpError(err.message || 'Failed to process payment. Please try again.')
      setIsTopUpProcessing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Up Modal */}
      {showTopUpModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isTopUpProcessing && setShowTopUpModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Top Up Wallet</h2>
                  <p className="text-sm text-white/80">Add funds to your SabiWrite wallet</p>
                </div>
                <button
                  onClick={() => !isTopUpProcessing && setShowTopUpModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={isTopUpProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 bg-white/20 rounded-xl px-4 py-3">
                <p className="text-sm text-white/80">Current Balance</p>
                <p className="text-2xl font-bold">{formatNaira(walletBalance)}</p>
              </div>
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
                    disabled={isTopUpProcessing}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedAmount === amt.value && !customAmount
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isTopUpProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    disabled={isTopUpProcessing}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Min: ₦100 • Max: ₦100,000</p>
              </div>

              {topUpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {topUpError}
                </div>
              )}

              <button
                onClick={handleTopUpSubmit}
                disabled={isTopUpProcessing || (!selectedAmount && !customAmount)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isTopUpProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Pay ₦{(customAmount ? parseInt(customAmount) || 0 : selectedAmount).toLocaleString()} with Paystack
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Secure payment powered by Paystack
              </p>
            </div>
          </div>
        </>
      )}

      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <PenLine className="w-6 h-6 text-red-500" />
            <h1 className="text-lg font-semibold text-gray-900">SabiWrite</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan Badge */}
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getPlanBadgeColor(planTier)}`}>
            {planTier}
          </span>

          {/* Wallet Balance */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <Wallet className="w-4 h-4 text-gray-500" />
            {isLoadingWallet ? (
              <div className="w-16 h-4 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <span className="text-sm font-medium text-gray-900">{formatNaira(walletBalance)}</span>
            )}
          </div>

{/* Top Up Button */}
          <button 
            onClick={handleTopUpClick}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Top Up
          </button>
          {/* Billing Button */}
          <Link 
            href="/sabiwrite/billing"
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Billing
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tools */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out
          pt-16 lg:pt-0
        `}>
          <ToolPanel
            activeTool={activeTool}
            onToolChange={(tool: 'writing' | 'detection' | 'humanize' | 'plagiarism' | 'settings') => {
              setActiveTool(tool)
              setIsMobileMenuOpen(false)
            }}
            planTier={planTier}
          />
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Center Panel - Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatPanel
            activeTool={activeTool}
            selectedTone={selectedTone}
            onToneChange={setSelectedTone}
            messages={messages}
            setMessages={setMessages}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            walletBalance={walletBalance}
            planTier={planTier}
            onOutputUpdate={setCurrentOutput}
            onWalletUpdate={onWalletUpdate}
          />
        </main>

        {/* Right Panel - Output */}
        <aside className={`
          ${isMobileOutputOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-40
          w-80 bg-white border-l border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out
          pt-16 lg:pt-0
        `}>
          <OutputPanel
            output={currentOutput}
            isProcessing={isProcessing}
            onClose={() => setIsMobileOutputOpen(false)}
          />
        </aside>

        {/* Mobile Output Toggle */}
        {currentOutput && !isMobileOutputOpen && (
          <button
            onClick={() => setIsMobileOutputOpen(true)}
            className="lg:hidden fixed bottom-20 right-4 z-30 p-3 bg-red-500 text-white rounded-full shadow-lg"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}

        {/* Mobile Output Overlay */}
        {isMobileOutputOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileOutputOpen(false)}
          />
        )}
      </div>
    </div>
  )
}