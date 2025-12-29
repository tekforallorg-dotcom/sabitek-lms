'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  PartyPopper,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Operation {
  id: string
  session_id: string
  tool_type: string
  action: string
  input_chars: number
  input_tokens: number
  output_tokens: number
  chunk_count: number
  model_provider: string
  model_name: string
  cost_kobo: number
  status: string
  created_at: string
  completed_at: string
  duration_ms: number
}

interface BillingData {
  operations: Operation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  wallet: {
    balanceKobo: number
  }
  stats: {
    totalSpentKobo: number
    totalOperations: number
    successfulOperations: number
  }
}

export default function BillingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [toolTypeFilter, setToolTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    amount?: number
  } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/sabiwrite/billing')
    }
  }, [user, loading, router])

  useEffect(() => {
    const verify = searchParams.get('verify')
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    
    if (verify === 'true' && reference && user && !isVerifying && !verificationResult) {
      verifyPayment(reference)
    }
  }, [searchParams, user])

  useEffect(() => {
    if (user && !isVerifying) {
      fetchBillingData()
    }
  }, [user, page, toolTypeFilter, statusFilter, verificationResult])

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

      const response = await fetch(`/api/sabiwrite/billing/verify?reference=${reference}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.verified) {
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

      router.replace('/sabiwrite/billing', { scroll: false })
      
    } catch (error) {
      console.error('[Billing] Verification error:', error)
      setVerificationResult({
        success: false,
        message: 'Failed to verify payment. Please contact support.'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const fetchBillingData = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      if (toolTypeFilter) params.append('toolType', toolTypeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/sabiwrite/billing?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBillingData(data)
      }
    } catch (error) {
      console.error('Error fetching billing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    if (!billingData?.operations.length) return

    const headers = ['Date', 'Tool', 'Action', 'Input Tokens', 'Output Tokens', 'Chunks', 'Model', 'Cost (NGN)', 'Status', 'Duration (ms)']
    const rows = billingData.operations.map(op => [
      new Date(op.created_at).toLocaleString(),
      op.tool_type,
      op.action || '-',
      op.input_tokens,
      op.output_tokens || 0,
      op.chunk_count,
      op.model_name,
      (op.cost_kobo / 100).toFixed(2),
      op.status,
      op.duration_ms || 0
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sabiwrite-billing-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getToolLabel = (toolType: string) => {
    const labels: Record<string, string> = {
      rewrite: 'Rewrite',
      shorten: 'Shorten',
      expand: 'Expand',
      simplify: 'Simplify',
      clarity: 'Clarity',
      tone_change: 'Tone Change',
      detection: 'AI Detection',
      humanize: 'Humanize',
      plagiarism: 'Plagiarism'
    }
    return labels[toolType] || toolType
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
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

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/sabiwrite"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">SabiWrite Billing</h1>
                <p className="text-sm text-gray-500">View your usage and transactions</p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              disabled={!billingData?.operations.length}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-xl font-semibold text-gray-900">
                  {billingData ? formatNaira(billingData.wallet.balanceKobo) : '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-xl font-semibold text-gray-900">
                  {billingData ? formatNaira(billingData.stats.totalSpentKobo) : '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Operations</p>
                <p className="text-xl font-semibold text-gray-900">
                  {billingData?.stats.totalOperations || 0}
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
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {billingData && billingData.stats.totalOperations > 0
                    ? `${Math.round((billingData.stats.successfulOperations / billingData.stats.totalOperations) * 100)}%`
                    : '---'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
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
                value={toolTypeFilter}
                onChange={(e) => { setToolTypeFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">All Tools</option>
                <option value="rewrite">Rewrite</option>
                <option value="shorten">Shorten</option>
                <option value="expand">Expand</option>
                <option value="simplify">Simplify</option>
                <option value="clarity">Clarity</option>
                <option value="detection">AI Detection</option>
                <option value="humanize">Humanize</option>
                <option value="plagiarism">Plagiarism</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
              </select>

              {(toolTypeFilter || statusFilter) && (
                <button
                  onClick={() => { setToolTypeFilter(''); setStatusFilter(''); setPage(1) }}
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
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
  </tr>
</thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div></td>
  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
  <td className="px-4 py-3"></td>
</tr>
                  ))
                ) : billingData?.operations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  billingData?.operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(op.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(op.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getToolLabel(op.tool_type)}
                        </div>
                        {op.action && (
                          <div className="text-xs text-gray-500">{op.action}</div>
                        )}
                      </td>
                   
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatNaira(op.cost_kobo)}
                        </div>
                        {op.chunk_count > 1 && (
                          <div className="text-xs text-gray-500">{op.chunk_count} chunks</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(op.status)}
                          <span className="text-sm text-gray-700 capitalize">{op.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {op.session_id && (
                          <Link
                            href={`/sabiwrite?session=${op.session_id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View session"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {billingData && billingData.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, billingData.pagination.total)} of {billingData.pagination.total} transactions
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
                  Page {page} of {billingData.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(billingData.pagination.totalPages, p + 1))}
                  disabled={page === billingData.pagination.totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}