'use client'
import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/types'

interface AuthReturn {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  routeResolving: boolean
  displayRole: string | null
  institutionName: string | null
  homeRoute: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any; needsVerification?: boolean }>
  signOut: () => Promise<void>
}

// Cache to prevent repeated fetches
let profileCache: { [key: string]: UserProfile } = {}

export function useAuth(): AuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [routeResolving, setRouteResolving] = useState(false)
  const [displayRole, setDisplayRole] = useState<string | null>(null)
  const [institutionName, setInstitutionName] = useState<string | null>(null)
  // Resolved home route (from /api/auth/resolve-route): institution admins ->
  // /institution/dashboard, instructors -> /instructor, super admins -> /admin.
  const [homeRoute, setHomeRoute] = useState<string | null>(null)
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

  /**
   * Ask the server for the correct post-login route and display role.
   * Server uses service role (bypasses RLS on institution_members).
   */
  const resolvePostLoginRoute = async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setHomeRoute('/dashboard')
        return '/dashboard'
      }

      const res = await fetch('/api/auth/resolve-route', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        setHomeRoute('/dashboard')
        return '/dashboard'
      }

      const json = await res.json()
      const payload = json.data || json

      // Store display role and institution name for the header
      if (payload.display_role) {
        setDisplayRole(payload.display_role)
      }
      if (payload.institution_name) {
        setInstitutionName(payload.institution_name)
      }
      setHomeRoute(payload.route || '/dashboard')

      return payload.route || '/dashboard'
    } catch (err) {
      console.error('Error resolving post-login route:', err)
      setHomeRoute('/dashboard')
      return '/dashboard'
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          // Also resolve role on page refresh / returning session
          const res = await fetch('/api/auth/resolve-route', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const json = await res.json()
            const payload = json.data || json
            if (mounted && payload.display_role) {
              setDisplayRole(payload.display_role)
            }
            if (mounted && payload.institution_name) {
              setInstitutionName(payload.institution_name)
            }
            if (mounted) {
              setHomeRoute(payload.route || '/dashboard')
            }
          } else if (mounted) {
            setHomeRoute('/dashboard')
          }
        } else {
          setUser(null)
          setUserProfile(null)
          setDisplayRole(null)
          setInstitutionName(null)
          setHomeRoute('/dashboard')
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn('Auth session check aborted, retrying...')
          if (mounted) {
            setTimeout(() => { if (mounted) initAuth() }, 500)
            return
          }
        } else {
          console.error('Auth error:', error)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        profileCache = {}
        setUser(null)
        setUserProfile(null)
        setDisplayRole(null)
        setInstitutionName(null)
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
        setRouteResolving(true)
        await fetchUserProfile(data.user.id)
        const route = await resolvePostLoginRoute()
        router.push(route)
        // Keep routeResolving true — the page navigation will unmount this
        // so we don't need to set it false. If push fails, fall through.
      }

      setLoading(false)

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
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        setLoading(false)
        return { error }
      }

      const needsVerification = data.user && !data.session

      if (needsVerification) {
        setLoading(false)
        return { error: null, needsVerification: true }
      }

      if (data.user && data.session) {
        setUser(data.user)
        setRouteResolving(true)
        await fetchUserProfile(data.user.id)
        const route = await resolvePostLoginRoute()
        router.push(route)
      }

      setLoading(false)
      return { error: null, needsVerification: false }
    } catch (error) {
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      profileCache = {}
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
      setDisplayRole(null)
      setInstitutionName(null)
      setRouteResolving(false)
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
    routeResolving,
    displayRole,
    institutionName,
    homeRoute,
    signIn,
    signUp,
    signOut,
  }
}