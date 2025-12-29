'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SabiwriteLayout from '@/components/sabiwrite/SabiwriteLayout'

export default function SabiwritePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [planTier, setPlanTier] = useState<string>('free')
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/sabiwrite')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchWalletAndPlan()
    }
  }, [user])

  const fetchWalletAndPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Call wallet API which triggers getOrCreateWallet with free trial
      const walletResponse = await fetch('/api/sabiwrite/wallet', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setWalletBalance(walletData.wallet.balanceKobo)
      }

      // Get user plan tier
      const { data: profile } = await supabase
        .from('users')
        .select('plan_tier')
        .eq('id', user?.id)
        .single()

      if (profile?.plan_tier) {
        setPlanTier(profile.plan_tier)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading SabiWrite...</p>
        </div>
      </div>
    )
  }

  return (
    <SabiwriteLayout
      walletBalance={walletBalance}
      planTier={planTier}
      isLoadingWallet={isLoadingWallet}
      onWalletUpdate={setWalletBalance}
    />
  )
}