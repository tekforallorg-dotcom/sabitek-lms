'use client'

import { Wallet, Plus, Loader2, AlertCircle } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface WalletBalanceProps {
  /** Show compact version (icon + amount only) */
  compact?: boolean
  /** Show top-up button */
  showTopup?: boolean
  /** Callback when top-up is clicked */
  onTopupClick?: () => void
  /** Custom class name */
  className?: string
}

export function WalletBalance({ 
  compact = false, 
  showTopup = true,
  onTopupClick,
  className = ''
}: WalletBalanceProps) {
  const { balance, isLoading, error } = useWallet()

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        {!compact && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        {!compact && <span className="text-sm">Error loading wallet</span>}
      </div>
    )
  }

  // Compact version - just icon and amount
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${className}`}
        onClick={onTopupClick}
        title="Wallet Balance - Click to top up"
      >
        <Wallet className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {balance?.balanceFormatted || '₦0'}
        </span>
      </div>
    )
  }

  // Full version
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <p className="text-xl font-bold text-gray-900">
              {balance?.balanceFormatted || '₦0'}
            </p>
          </div>
        </div>
        
        {showTopup && (
          <button
            onClick={onTopupClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </button>
        )}
      </div>
    </div>
  )
}

// Skeleton loader for SSR
export function WalletBalanceSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-12 h-4 bg-gray-300 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div>
            <div className="w-20 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-24 h-6 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-20 h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}