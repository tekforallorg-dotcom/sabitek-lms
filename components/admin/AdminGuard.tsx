'use client'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import SabiLoader from '@/components/ui/SabiLoader'

/**
 * Layout-level admin guard: every /admin route is protected here once,
 * instead of each page opting into useAdminAuth individually (previously
 * applications, billing, and the sabiquiz pages had no guard at all).
 * useAdminAuth redirects non-admins; we render nothing until it settles.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth()

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading admin..." size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
