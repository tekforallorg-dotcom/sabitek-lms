'use client'
import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import SabiBot from '@/components/chat/sabibot'
import AppShell from '@/components/shell/AppShell'
import { Toaster } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { resolvePersona, shellModeFor } from '@/lib/navigation'
import { ReactNode } from 'react'

/**
 * Picks the frame for the current page:
 *
 * - admin and sign-in pages bring their own;
 * - signed-in areas get the app frame (sidebar, top bar, command palette);
 * - everything else, and the focus screens (a lesson, a quiz in progress,
 *   the document builders), keeps the public header and footer.
 */
export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, userProfile, loading, displayRole, institutionName, homeRoute, signOut } = useAuth()

  const handleSignOut = useCallback(() => {
    signOut().catch((error) => console.error('Error logging out:', error))
  }, [signOut])

  const isAdminRoute = pathname?.startsWith('/admin')
  const isAuthRoute = pathname?.startsWith('/auth')

  if (isAdminRoute || isAuthRoute) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  const mode = shellModeFor(pathname)

  // Areas with a public page for visitors show the public frame until we know
  // someone is signed in. AppShell keeps the page mounted through the switch.
  const frame = mode === 'app' || (mode === 'app-if-signed-in' && !!user) ? 'app' : 'site'

  // The server decides where an account's home is (an institution admin looks
  // like a learner until it answers), so the menu waits for that answer. It
  // does not wait for the profile row: if that cannot be read, a learner's
  // menu is better than none.
  const navReady = !loading && homeRoute !== null
  const persona = resolvePersona({
    role: userProfile?.role,
    homeRoute,
    isSuperAdmin: userProfile?.is_super_admin,
  })

  return (
    <AppShell
      frame={frame}
      persona={persona}
      navReady={navReady}
      pathname={pathname}
      onSignOut={handleSignOut}
      user={{
        name: userProfile?.full_name ?? '',
        email: user?.email ?? '',
        avatarUrl: userProfile?.avatar_url,
        roleLabel: institutionName ?? displayRole ?? userProfile?.role ?? null,
      }}
      after={
        <>
          <SabiBot />
          <Toaster />
        </>
      }
    >
      {children}
    </AppShell>
  )
}
