'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  Search, 
  MessageSquare, 
  User, 
  Sparkles,
  BookOpen
} from 'lucide-react'

interface CommunityLayoutProps {
  children: React.ReactNode
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/community')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs text-gray-700 font-medium">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Sub-Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo/Title */}
            <Link 
              href="/community" 
              className="flex items-center gap-2 text-gray-900 hover:text-red-600 transition-colors"
            >
              <Users className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-sm sm:text-base">SabiCommunity</span>
            
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
             <Link
  href="/community/browse"
  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
>
  <Search className="w-4 h-4" />
  <span className="hidden sm:inline">Browse</span>
</Link>
              <Link
                href="/community/requests"
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Requests</span>
              </Link>
              <Link
                href="/community/profile"
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">My Profile</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Footer CTA - Back to Courses */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/courses"
          className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Courses</span>
        </Link>
      </div>
    </div>
  )
}