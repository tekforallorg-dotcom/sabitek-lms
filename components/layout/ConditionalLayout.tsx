'use client'
import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
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
 * - signed-in areas get the app shell (sidebar, top bar, command palette);
 * - everything else, and the focus screens (a lesson, a quiz in progress),
 *   keeps the public header and footer.
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

  // These areas have a public page for visitors. Until we know which this is,
  // draw neither frame, so the wrong one never flashes.
  if (mode === 'app-if-signed-in' && loading) {
    return (
      <div className="min-h-screen">
        {children}
        <Toaster />
      </div>
    )
  }

  if (mode === 'app' || (mode === 'app-if-signed-in' && user)) {
    // The server decides where an account's home is (an institution admin
    // looks like a learner until it answers). Hold the menu until then.
    const navReady = !loading && !!userProfile && homeRoute !== null
    const persona = resolvePersona({
      role: userProfile?.role,
      homeRoute,
      isSuperAdmin: userProfile?.is_super_admin,
    })

    return (
      <AppShell
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
      >
        {children}
        <SabiBot />
        <Toaster />
      </AppShell>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <SabiBot />
      <Toaster />
    </div>
  )
}
