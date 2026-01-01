'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Search, 
  MessageSquare, 
  User,
  BookOpen,
  Calendar,
  HandHeart,
  FileText,
  Home
} from 'lucide-react'

interface CommunityLayoutProps {
  children: React.ReactNode
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/community')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCounts()
    }
  }, [user, pathname])

  const fetchCounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }

      // Fetch unread messages
      const threadsRes = await fetch('/api/community/threads', { headers })
      if (threadsRes.ok) {
        const data = await threadsRes.json()
        const count = (data.threads || []).reduce(
          (acc: number, t: { unread_count: number }) => acc + t.unread_count, 0
        )
        setUnreadMessages(count)
      }

      // Fetch pending requests (requests made TO current user)
      const requestsRes = await fetch('/api/community/requests?type=received&status=pending', { headers })
      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setPendingRequests(data.requests?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const navItems = [
    { href: '/community', label: 'Home', icon: Home, exact: true },
    { href: '/community/browse', label: 'Browse', icon: Search },
    { href: '/community/inbox', label: 'Messages', icon: MessageSquare, count: unreadMessages },
    { href: '/community/sessions', label: 'Sessions', icon: Calendar },
    { href: '/community/requests', label: 'Requests', icon: FileText, count: pendingRequests },
    { href: '/community/offers', label: 'Offers', icon: HandHeart },
    { href: '/community/profile', label: 'Profile', icon: User },
  ]

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
      {/* Community Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link 
              href="/community" 
              className="flex items-center gap-2 text-gray-900 hover:text-red-600 transition-colors"
            >
              <Users className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-sm sm:text-base">SabiCommunity</span>
            </Link>

            {/* Nav Items */}
            <nav className="flex items-center gap-0.5 sm:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      active 
                        ? 'bg-red-50 text-red-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {item.count > 9 ? '9+' : item.count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="pb-6">
        {children}
      </main>

      {/* Back to Courses Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/courses"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Courses</span>
        </Link>
      </div>
    </div>
  )
}