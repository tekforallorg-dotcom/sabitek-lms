'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Download,
  Filter,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  PartyPopper,
  AlertCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Gift
} from 'lucide-react'
import { WalletTopupModal, TopupSuccessModal } from '@/components/wallet'

type WalletService = 'all' | 'sabiwrite' | 'courses' | 'community' | 'advisor' | 'quiz' | 'general' | 'subscription'

interface LedgerEntry {
  id: string
  transaction_type: 'credit' | 'debit' | 'refund' | 'bonus'
  amount_kobo: number
  balance_before: number
  balance_after: number
  service: string
  service_ref_id?: string
  reference_type?: string
  reference_id?: string
  description?: string
  created_at: string
  metadata?: Record<string, unknown>
}

interface WalletStats {
  balance_kobo: number
  total_credits_kobo: number
  total_debits_kobo: number
  total_operations: number
  operations_by_service: Record<string, number>
}

const SERVICE_LABELS: Record<string, string> = {
  all: 'All Services',
  sabiwrite: 'SabiWrite',
  courses: 'Courses',
  community: 'SabiCommunity',
  advisor: 'SabiAdvisor',
  quiz: 'SabiQuiz',
  general: 'General',
  subscription: 'Subscription'
}

const SERVICE_COLORS: Record<string, string> = {
  sabiwrite: 'bg-purple-100 text-purple-700',
  courses: 'bg-blue-100 text-blue-700',
  community: 'bg-green-100 text-green-700',
  advisor: 'bg-orange-100 text-orange-700',
  quiz: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
  subscription: 'bg-red-100 text-red-700'
}

function WalletPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [serviceFilter, setServiceFilter] = useState<WalletService>('all')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successAmount, setSuccessAmount] = useState('')
  const [successBalance, setSuccessBalance] = useState('')
  
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    amount?: number
  } | null>(null)

  // Check for service filter in URL
  useEffect(() => {
    const service = searchParams.get('service')
    if (service && SERVICE_LABELS[service]) {
      setServiceFilter(service as WalletService)
    }
  }, [searchParams])

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/wallet')
    }
  }, [user, authLoading, router])

  // Payment verification from redirect
  useEffect(() => {
    const verify = searchParams.get('verify')
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    
    if (verify === 'true' && reference && user && !isVerifying && !verificationResult) {
      verifyPayment(reference)
    }
  }, [searchParams, user])

  // Fetch data
  useEffect(() => {
    if (user && !isVerifying) {
      fetchWalletData()
    }
  }, [user, page, serviceFilter, typeFilter, verificationResult])

  const verifyPayment = async (reference: string) => {
    setIsVerifying(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setVerificationResult({
          success: false,
          message: 'Session expired. Please log in again.'
        })
        setIsVerifying(false)
        return
      }

      const response = await fetch(`/api/wallet/verify?reference=${reference}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.verified && data.credited) {
        setVerificationResult({
          success: true,
          message: 'Payment successful! Your wallet has been credited.',
          amount: data.amount_kobo
        })
      } else {
        setVerificationResult({
          success: false,
          message: data.message || 'Payment verification failed. Please contact support if you were charged.'
        })
      }

      router.replace('/account/wallet', { scroll: false })
      
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        success: false,
        message: 'Failed to verify payment. Please contact support.'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const fetchWalletData = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('balance_kobo')
        .eq('user_id', user!.id)
        .single()

      // Fetch ledger entries with filters
      let query = supabase
        .from('wallet_ledger')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1)

      if (serviceFilter !== 'all') {
        query = query.eq('service', serviceFilter)
      }
      if (typeFilter) {
        query = query.eq('transaction_type', typeFilter)
      }

      const { data: ledgerData, count } = await query

      // Fetch stats
      const { data: allEntries } = await supabase
        .from('wallet_ledger')
        .select('transaction_type, amount_kobo, service')
        .eq('user_id', user!.id)

      // Calculate stats
      let totalCredits = 0
      let totalDebits = 0
      const serviceOps: Record<string, number> = {}

      allEntries?.forEach(entry => {
        if (entry.transaction_type === 'credit' || entry.transaction_type === 'bonus' || entry.transaction_type === 'refund') {
          totalCredits += entry.amount_kobo
        } else {
          totalDebits += entry.amount_kobo
        }
        serviceOps[entry.service] = (serviceOps[entry.service] || 0) + 1
      })

      setStats({
        balance_kobo: wallet?.balance_kobo || 0,
        total_credits_kobo: totalCredits,
        total_debits_kobo: totalDebits,
        total_operations: allEntries?.length || 0,
        operations_by_service: serviceOps
      })

      setEntries(ledgerData || [])
      setTotalEntries(count || 0)
      setTotalPages(Math.ceil((count || 0) / 20))

    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    if (!entries.length) return

    const headers = ['Date', 'Type', 'Service', 'Description', 'Amount (NGN)', 'Balance After (NGN)']
    const rows = entries.map(entry => [
      new Date(entry.created_at).toLocaleString(),
      entry.transaction_type,
      SERVICE_LABELS[entry.service] || entry.service,
      entry.description || '-',
      (entry.transaction_type === 'debit' ? '-' : '+') + (entry.amount_kobo / 100).toFixed(2),
      (entry.balance_after / 100).toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sabitek-wallet-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'debit':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-600" />
      default:
        return <ArrowUpRight className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'refund':
      case 'bonus':
        return 'text-green-600'
      case 'debit':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    )
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-sm text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Verification Banner */}
      {verificationResult && (
        <div className={`${verificationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b`}>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {verificationResult.success ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <PartyPopper className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <p className={`font-medium ${verificationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {verificationResult.message}
                </p>
                {verificationResult.amount && (
                  <p className="text-sm text-green-700">
                    {formatNaira(verificationResult.amount)} has been added to your wallet.
                  </p>
                )}
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className={`text-sm ${verificationResult.success ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">My Wallet</h1>
                <p className="text-sm text-gray-500">Manage your SabiTek wallet and transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportCSV}
                disabled={!entries.length}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Top Up
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats ? formatNaira(stats.balance_kobo) : '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Added</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats ? formatNaira(stats.total_credits_kobo) : '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats ? formatNaira(stats.total_debits_kobo) : '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats?.total_operations || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">How Your Wallet Works</h3>
          <p className="text-sm text-gray-600">
            Your SabiTek wallet is used across all services. Top up once and use it for courses, SabiWrite, SabiCommunity sessions, SabiQuiz, and SabiAdvisor packages. No monthly subscriptions – pay only for what you use!
          </p>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-gray-900">Transaction History</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
              <select
                value={serviceFilter}
                onChange={(e) => { setServiceFilter(e.target.value as WalletService); setPage(1) }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="all">All Services</option>
                <option value="sabiwrite">SabiWrite</option>
                <option value="courses">Courses</option>
                <option value="community">SabiCommunity</option>
                <option value="advisor">SabiAdvisor</option>
                <option value="quiz">SabiQuiz</option>
                <option value="general">General</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
                <option value="refund">Refunds</option>
                <option value="bonus">Bonuses</option>
              </select>

              {(serviceFilter !== 'all' || typeFilter) && (
                <button
                  onClick={() => { setServiceFilter('all'); setTypeFilter(''); setPage(1) }}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Wallet className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No transactions yet</p>
                        <button
                          onClick={() => setShowTopupModal(true)}
                          className="mt-3 text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Top up your wallet to get started →
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SERVICE_COLORS[entry.service] || 'bg-gray-100 text-gray-700'}`}>
                          {SERVICE_LABELS[entry.service] || entry.service}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(entry.transaction_type)}
                          <span className="text-sm text-gray-900">
                            {entry.description || entry.transaction_type.charAt(0).toUpperCase() + entry.transaction_type.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${getTransactionColor(entry.transaction_type)}`}>
                          {entry.transaction_type === 'debit' ? '-' : '+'}{formatNaira(entry.amount_kobo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-600">
                          {formatNaira(entry.balance_after)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalEntries)} of {totalEntries} transactions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <WalletTopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        callbackUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account/wallet?verify=true`}
      />

      <TopupSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          fetchWalletData()
        }}
        amount={successAmount}
        newBalance={successBalance}
      />
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}