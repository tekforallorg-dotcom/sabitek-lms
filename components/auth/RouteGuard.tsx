'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'

type Requirement = 'auth' | 'learner' | 'instructor' | 'institution'

/**
 * Route-group guard, mounted from a layout so every subroute is covered
 * (previously only index pages redirected, leaving subroutes reachable).
 *
 * Middleware now enforces auth presence server-side (cookie sessions via
 * @supabase/ssr); this layout guard adds the ROLE routing on top, with
 * Supabase RLS as the data boundary underneath.
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
  // 'checking' only used for the institution membership lookup
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
        if (userProfile.role !== 'instructor' && !userProfile.is_super_admin) {
          router.replace('/dashboard')
        }
        break
      case 'learner':
        // Instructors have their own home; mirrors the existing page-level rule.
        if (userProfile.role === 'instructor') {
          router.replace('/instructor')
        } else if (homeRoute === '/institution/dashboard' || homeRoute === '/admin') {
          // Institution admins / program managers / super admins belong in
          // their own workspace, not the learner dashboard.
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
          supabase
            .from('institution_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                setMembershipState('member')
              } else {
                setMembershipState('not_member')
                router.replace('/dashboard')
              }
            })
        }
        break
      }
      case 'auth':
      default:
        break
    }
  }, [loading, user, userProfile, require, pathname, membershipState, homeRoute, router])

  const resolvingRole = require !== 'auth' && !userProfile
  const resolvingMembership =
    require === 'institution' &&
    pathname !== '/institution/apply' &&
    membershipState !== 'member'

  if (loading || !user || resolvingRole || resolvingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading..." size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
