'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { supabase } from '@/lib/supabase'

interface AdminAuthReturn {
  isAdmin: boolean
  loading: boolean
  userProfile: any
}

export function useAdminAuth(): AdminAuthReturn {
  const { user, loading: authLoading } = useAuthContext()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminAccess() {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      // No user - redirect to login
      if (!user) {
        router.replace('/auth/login')
        return
      }

      try {
        // Fetch user profile with admin status
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          console.error('Error fetching admin profile:', error)
          router.replace('/dashboard')
          return
        }

        setUserProfile(data)

        // Check if user is super admin
        if (!data.is_super_admin) {
          console.warn('Access denied: User is not a super admin')
          router.replace('/dashboard')
          return
        }

        // Check if user status is active
        if (data.status !== 'active') {
          console.warn('Access denied: User account is not active')
          router.replace('/dashboard')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Admin auth error:', error)
        router.replace('/dashboard')
      }
    }

    checkAdminAccess()
  }, [user, authLoading, router])

  return {
    isAdmin: !!userProfile?.is_super_admin,
    loading: loading || authLoading,
    userProfile,
  }
}