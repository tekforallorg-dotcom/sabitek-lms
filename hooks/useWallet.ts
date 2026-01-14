'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ============================================
// TYPES
// ============================================

export type WalletService = 
  | 'sabiwrite' 
  | 'courses' 
  | 'community' 
  | 'advisor' 
  | 'quiz' 
  | 'general' 
  | 'subscription'

export interface WalletBalance {
  id: string
  balanceKobo: number
  balanceNaira: number
  balanceFormatted: string
  currency: string
}

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit' | 'refund' | 'bonus'
  amount_kobo: number
  amount_formatted: string
  balance_before: number
  balance_after: number
  balance_before_formatted: string
  balance_after_formatted: string
  service: WalletService
  service_ref_id?: string
  reference_type?: string
  description?: string
  created_at: string
  metadata?: Record<string, unknown>
}

export interface TopupPreset {
  kobo: number
  label: string
}

export interface TopupLimits {
  min_kobo: number
  max_kobo: number
  min_formatted: string
  max_formatted: string
}

export interface UseWalletReturn {
  balance: WalletBalance | null
  transactions: WalletTransaction[]
  presets: TopupPreset[]
  limits: TopupLimits | null
  isLoading: boolean
  isLoadingTransactions: boolean
  error: string | null
  refreshBalance: () => Promise<void>
  loadTransactions: (options?: { service?: WalletService; page?: number; limit?: number }) => Promise<void>
  initializeTopup: (amountKobo: number, callbackUrl?: string) => Promise<{ authorizationUrl: string; reference: string } | null>
  verifyPayment: (reference: string) => Promise<{ success: boolean; newBalance?: number; message: string }>
  canAfford: (amountKobo: number) => boolean
}

// ============================================
// HOOK
// ============================================

export function useWallet(): UseWalletReturn {
  // Using the singleton supabase client from lib/supabase.ts
  
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [presets, setPresets] = useState<TopupPreset[]>([])
  const [limits, setLimits] = useState<TopupLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch wallet balance
  const refreshBalance = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get fresh session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('Please log in to view your wallet')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch wallet balance')
      }

      const data = await response.json()
      setBalance(data.wallet)
      setError(null)
    } catch (err) {
      console.error('Wallet fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load wallet')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Fetch top-up presets and limits
  const loadPresets = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet/topup')
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
        setLimits(data.limits || null)
      }
    } catch (err) {
      console.error('Failed to load presets:', err)
    }
  }, [])

  // Fetch transactions
  const loadTransactions = useCallback(async (options?: { 
    service?: WalletService
    page?: number
    limit?: number 
  }) => {
    try {
      setIsLoadingTransactions(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const params = new URLSearchParams()
      if (options?.service) params.set('service', options.service)
      if (options?.page) params.set('page', options.page.toString())
      if (options?.limit) params.set('limit', options.limit.toString())

      const response = await fetch(`/api/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [supabase])

  // Initialize Paystack top-up
  const initializeTopup = useCallback(async (
    amountKobo: number, 
    callbackUrl?: string
  ): Promise<{ authorizationUrl: string; reference: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Not authenticated')
        return null
      }

      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount_kobo: amountKobo,
          callback_url: callbackUrl 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to initialize payment')
        return null
      }

      return {
        authorizationUrl: data.authorization_url,
        reference: data.reference
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment')
      return null
    }
  }, [supabase])

  // Verify payment
  const verifyPayment = useCallback(async (reference: string): Promise<{ 
    success: boolean
    newBalance?: number
    message: string 
  }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { success: false, message: 'Not authenticated' }
      }

      const response = await fetch(`/api/wallet/verify?reference=${reference}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (data.verified && data.credited) {
        await refreshBalance()
        return { 
          success: true, 
          newBalance: data.new_balance_kobo,
          message: data.message 
        }
      }

      return { 
        success: false, 
        message: data.message || 'Payment verification failed' 
      }
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Verification failed' 
      }
    }
  }, [supabase, refreshBalance])

  // Check if user can afford an amount
  const canAfford = useCallback((amountKobo: number): boolean => {
    return (balance?.balanceKobo || 0) >= amountKobo
  }, [balance])

 // Initialize on mount
  useEffect(() => {
    if (isInitialized) return
    setIsInitialized(true)
    
    // Load presets (no auth needed)
    loadPresets()
    
    // Check if user is logged in, then load balance
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        refreshBalance()
      } else {
        setIsLoading(false)
        setError('Please log in to view your wallet')
      }
    }
    
    init()
  }, [isInitialized, loadPresets, refreshBalance])

  return {
    balance,
    transactions,
    presets,
    limits,
    isLoading,
    isLoadingTransactions,
    error,
    refreshBalance,
    loadTransactions,
    initializeTopup,
    verifyPayment,
    canAfford
  }
}