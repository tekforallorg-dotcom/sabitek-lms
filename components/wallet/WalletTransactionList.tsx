'use client'

import { useEffect, useState } from 'react'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  RotateCcw,
  Loader2,
  Filter,
  ChevronDown
} from 'lucide-react'
import { useWallet, WalletService, WalletTransaction } from '@/hooks/useWallet'

interface WalletTransactionListProps {
  /** Initial service filter */
  initialService?: WalletService
  /** Number of items per page */
  pageSize?: number
  /** Show service filter dropdown */
  showFilter?: boolean
  /** Custom class name */
  className?: string
}

const SERVICE_LABELS: Record<WalletService, string> = {
  sabiwrite: 'SabiWrite',
  courses: 'Courses',
  community: 'SabiCommunity',
  advisor: 'SabiAdvisor',
  quiz: 'SabiQuiz',
  general: 'General',
  subscription: 'Subscription'
}

const SERVICE_COLORS: Record<WalletService, string> = {
  sabiwrite: 'bg-purple-100 text-purple-700',
  courses: 'bg-blue-100 text-blue-700',
  community: 'bg-green-100 text-green-700',
  advisor: 'bg-orange-100 text-orange-700',
  quiz: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
  subscription: 'bg-red-100 text-red-700'
}

export function WalletTransactionList({ 
  initialService,
  pageSize = 10,
  showFilter = true,
  className = ''
}: WalletTransactionListProps) {
  const { transactions, isLoadingTransactions, loadTransactions } = useWallet()
  
  const [selectedService, setSelectedService] = useState<WalletService | undefined>(initialService)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions({ service: selectedService, page, limit: pageSize })
  }, [selectedService, page, pageSize, loadTransactions])

  const handleServiceChange = (service: WalletService | undefined) => {
    setSelectedService(service)
    setPage(1)
    setIsFilterOpen(false)
  }

  const getTransactionIcon = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'debit':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-blue-600" />
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-600" />
      default:
        return <ArrowUpRight className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: WalletTransaction['type']) => {
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

  const getTransactionSign = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'credit':
      case 'refund':
      case 'bonus':
        return '+'
      case 'debit':
        return '-'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-NG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-NG', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-NG', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Transaction History</h3>
        
        {showFilter && (
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {selectedService ? SERVICE_LABELS[selectedService] : 'All Services'}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => handleServiceChange(undefined)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      !selectedService ? 'text-red-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    All Services
                  </button>
                  {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleServiceChange(key as WalletService)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        selectedService === key ? 'text-red-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-gray-100">
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${SERVICE_COLORS[tx.service]}`}>
                      {SERVICE_LABELS[tx.service]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(tx.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                  {getTransactionSign(tx.type)}{tx.amount_formatted}
                </p>
                <p className="text-xs text-gray-400">
                  Bal: {tx.balance_after_formatted}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {transactions.length >= pageSize && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setPage(page + 1)}
            disabled={isLoadingTransactions}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isLoadingTransactions ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

// Skeleton loader
export function WalletTransactionListSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}