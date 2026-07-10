'use client'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import SabiBot from '@/components/chat/sabibot'
import { Toaster } from '@/components/ui/toast'
import { ReactNode } from 'react'

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')
  const isAuthRoute = pathname?.startsWith('/auth')
  const showPublicLayout = !isAdminRoute && !isAuthRoute

  if (!showPublicLayout) {
    return (
      <>
        {children}
        <Toaster />
      </>
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