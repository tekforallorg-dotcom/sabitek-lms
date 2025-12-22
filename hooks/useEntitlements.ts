'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface EntitlementState {
  plan: 'free' | 'pro'
  isProUser: boolean
  canAccessSabiQuiz: boolean
  canAccessSabiAdvisor: boolean
  loading: boolean
}

export function useEntitlements(): EntitlementState {
  const { user } = useAuth()
  const [state, setState] = useState<EntitlementState>({
    plan: 'free',
    isProUser: false,
    canAccessSabiQuiz: false,
    canAccessSabiAdvisor: false,
    loading: true
  })

  useEffect(() => {
    if (!user) {
      setState({
        plan: 'free',
        isProUser: false,
        canAccessSabiQuiz: false,
        canAccessSabiAdvisor: false,
        loading: false
      })
      return
    }
    fetchEntitlements()
  }, [user])

  const fetchEntitlements = async () => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          current_period_end,
          plan:plans(code, features)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .maybeSingle()

      const plan = Array.isArray(subscription?.plan) ? subscription.plan[0] : subscription?.plan
      const isProUser = plan?.code === 'pro'
      const features: string[] = plan?.features || []

      const { data: entitlements } = await supabase
        .from('entitlements')
        .select('key, expires_at')
        .eq('user_id', user!.id)

      const activeEntitlements = (entitlements || []).filter((e: { key: string; expires_at: string | null }) => {
        if (!e.expires_at) return true
        return new Date(e.expires_at) > new Date()
      })

      const entitlementKeys = activeEntitlements.map((e: { key: string }) => e.key)

      setState({
        plan: isProUser ? 'pro' : 'free',
        isProUser,
        canAccessSabiQuiz: isProUser || features.includes('sabiquiz') || entitlementKeys.includes('sabiquiz'),
        canAccessSabiAdvisor: isProUser || features.includes('sabiadvisor') || entitlementKeys.includes('sabiadvisor'),
        loading: false
      })
    } catch (error) {
      console.error('Error fetching entitlements:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  return state
}

export function useCoursePurchase(courseId: string): { purchased: boolean; loading: boolean } {
  const { user } = useAuth()
  const [purchased, setPurchased] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false)
      return
    }
    checkPurchase()
  }, [user, courseId])

  const checkPurchase = async () => {
    try {
      const { data } = await supabase
        .from('course_purchases')
        .select('id')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .eq('status', 'successful')
        .maybeSingle()

      setPurchased(!!data)
    } catch (error) {
      console.error('Error checking purchase:', error)
    } finally {
      setLoading(false)
    }
  }

  return { purchased, loading }
}