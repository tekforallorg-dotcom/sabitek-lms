'use client'
import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'learner' | 'instructor' | 'admin'
}

interface AuthReturn {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

// Cache to prevent repeated fetches
let profileCache: { [key: string]: UserProfile } = {}

export function useAuth(): AuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = useCallback(async (userId: string) => {
    // Check cache first
    if (profileCache[userId]) {
      setUserProfile(profileCache[userId])
      return profileCache[userId]
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        // Cache the profile
        profileCache[userId] = data
        setUserProfile(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
    return null
  }, [])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Get cached session first (faster)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        if (mounted) setLoading(false)
      }
    }

    // Initialize immediately
    initAuth()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        // Clear cache on signout
        profileCache = {}
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        const profile = await fetchUserProfile(data.user.id)
        
        // Use Next.js router instead of window.location
        if (profile?.role === 'instructor') {
          router.push('/instructor')
        } else {
          router.push('/dashboard')
        }
      }

      setLoading(false)
      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        router.push('/dashboard')
      }

      setLoading(false)
      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      // Clear cache
      profileCache = {}
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      router.push('/')
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  }
}