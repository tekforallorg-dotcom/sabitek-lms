'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'

type Requirement = 'auth' | 'learner' | 'instructor' | 'institution'

/**
 * Route-group guard, mounted from a layout so every subroute is covered.
 *
 * Middleware enforces auth presence server-side (cookie sessions via
 * @supabase/ssr); this guard adds ROLE routing on top, with Supabase RLS
 * as the data boundary underneath.
 *
 * Anti-flicker rules:
 * - 'learner' waits for the server-resolved homeRoute before rendering,
 *   so institution admins never see the learner dashboard flash.
 * - 'institution' checks membership via the service-backed
 *   /api/institutions/my-membership endpoint (client RLS reads of
 *   institution_members are not reliable), preventing the
 *   /dashboard <-> /institution/dashboard redirect ping-pong.
 */
export default function RouteGuard({
  require,
  children,
}: {
  require: Requirement
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, loading, homeRoute } = useAuth()
  const [membershipState, setMembershipState] = useState<'idle' | 'checking' | 'member' | 'not_member'>('idle')

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/auth/login')
      return
    }

    // Role checks need the profile row; wait for it.
    if (!userProfile) return

    switch (require) {
      case 'instructor':
        // Access is allowed for anyone with an instructor persona (users.role
        // or server-resolved home); others go to THEIR home, never a
        // hardcoded route another guard might bounce them away from.
        if (userProfile.role === 'instructor' || userProfile.is_super_admin) break
        if (homeRoute === null) return // wait for the authority
        if (homeRoute !== '/instructor') {
          router.replace(homeRoute)
        }
        break
      case 'learner':
        // Wait until the server has resolved the user's home before deciding.
        if (homeRoute === null) return
        // Single authority: whatever resolve-route said is home, go there.
        if (homeRoute !== '/dashboard') {
          router.replace(homeRoute)
        }
        break
      case 'institution': {
        // /institution/apply is open to any signed-in user (it is how you
        // become an institution); everything else needs active membership.
        if (pathname === '/institution/apply' || userProfile.is_super_admin) {
          setMembershipState('member')
          break
        }
        if (membershipState === 'idle') {
          setMembershipState('checking')
          ;(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) {
                router.replace('/auth/login')
                return
              }
              const res = await fetch('/api/institutions/my-membership', {
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
              if (res.ok) {
                setMembershipState('member')
              } else if (res.status === 404 || res.status === 403) {
                // Confirmed non-member: send to their resolved home (never
                // /institution/*, so no loop is possible).
                setMembershipState('not_member')
                router.replace(homeRoute && homeRoute !== '/institution/dashboard' ? homeRoute : '/dashboard')
              } else {
                // Transient failure: do NOT bounce; let the page's own
                // error states handle it instead of redirect-looping.
                setMembershipState('member')
              }
            } catch {
              // Network hiccup: fail open to the page rather than loop.
              setMembershipState('member')
            }
          })()
        }
        break
      }
      case 'auth':
      default:
        break
    }
  }, [loading, user, userProfile, require, pathname, membershipState, homeRoute, router])

  const resolvingRole = require !== 'auth' && !userProfile
  const resolvingHome =
    (require === 'learner' && homeRoute === null) ||
    (require === 'instructor' &&
      homeRoute === null &&
      userProfile?.role !== 'instructor' &&
      !userProfile?.is_super_admin)
  const resolvingMembership =
    require === 'institution' &&
    pathname !== '/institution/apply' &&
    membershipState !== 'member'

  if (loading || !user || resolvingRole || resolvingHome || resolvingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading..." size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
