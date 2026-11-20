'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  signUp: (email: string, password: string, fullName: string, role: string, inviteToken?: string | null) => Promise<{ error: any; needsVerification?: boolean }>
  signOut: () => Promise<void>
}

// Cache to prevent repeated fetches
let profileCache: { [key: string]: UserProfile } = {}

interface RouteInfo {
  route: string
  displayRole: string | null
  institutionName: string | null
}

/**
 * Where an account's home is, asked of the server once and shared by every
 * caller of this hook. Each caller used to ask separately on every page, and
 * /api/auth allows five requests a minute; a refused request made an
 * institution admin look like a learner.
 */
let routeLookup: { userId: string; at: number; promise: Promise<RouteInfo | null> } | null = null
const ROUTE_LOOKUP_TTL_MS = 60_000

function lookupRoute(userId: string, accessToken: string): Promise<RouteInfo | null> {
  if (routeLookup && routeLookup.userId === userId && Date.now() - routeLookup.at < ROUTE_LOOKUP_TTL_MS) {
    return routeLookup.promise
  }

  const promise = (async (): Promise<RouteInfo | null> => {
    try {
      const res = await fetch('/api/auth/resolve-route', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return null
      const json = await res.json()
      const payload = json.data || json
      return {
        route: payload.route || '/dashboard',
        displayRole: payload.display_role || null,
        institutionName: payload.institution_name || null,
      }
    } catch (err) {
      console.error('Error resolving post-login route:', err)
      return null
    }
  })()

  const entry = { userId, at: Date.now(), promise }
  routeLookup = entry
  // Do not remember a failure; the next caller should try again.
  promise.then((info) => {
    if (!info && routeLookup === entry) routeLookup = null
  })
  return promise
}

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
  // Whose home `homeRoute` holds. A caller that outlives a sign-in (the app
  // shell does) must not keep the answer worked out for whoever was here before.
  const resolvedFor = useRef<string | null>(null)
  const router = useRouter()

  /** Store a lookup's answer. A failed lookup falls back to the learner home. */
  const applyRoute = useCallback((info: RouteInfo | null): string => {
    if (info?.displayRole) setDisplayRole(info.displayRole)
    if (info?.institutionName) setInstitutionName(info.institutionName)
    const route = info?.route ?? '/dashboard'
    setHomeRoute(route)
    return route
  }, [])

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
  const resolvePostLoginRoute = useCallback(async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token || !session.user) {
      setHomeRoute('/dashboard')
      return '/dashboard'
    }
    resolvedFor.current = session.user.id
    return applyRoute(await lookupRoute(session.user.id, session.access_token))
  }, [applyRoute])

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
          resolvedFor.current = session.user.id
          const info = await lookupRoute(session.user.id, session.access_token)
          if (mounted) applyRoute(info)
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
        // This event also fires when a tab regains focus. Only a different
        // account needs its home worked out again.
        if (resolvedFor.current !== session.user.id) {
          resolvedFor.current = session.user.id
          setHomeRoute(null)
          setDisplayRole(null)
          setInstitutionName(null)
          const info = await lookupRoute(session.user.id, session.access_token)
          if (mounted && resolvedFor.current === session.user.id) applyRoute(info)
        }
      } else if (event === 'SIGNED_OUT') {
        profileCache = {}
        routeLookup = null
        resolvedFor.current = null
        setHomeRoute('/dashboard')
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
  }, [fetchUserProfile, applyRoute])

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

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
    inviteToken?: string | null
  ) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            // While sign-up is invite-only the database checks this token
            // before it will create the account (see enforce_signup_gate).
            ...(inviteToken ? { invite_token: inviteToken } : {}),
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
      routeLookup = null
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