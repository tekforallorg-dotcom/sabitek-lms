'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Search,
  MessageSquare,
  Calendar,
  Bell,
  User,
  Menu,
  X,
  Home,
  HandHeart,
  FileText
} from 'lucide-react'

interface NavCounts {
  unreadMessages: number
  pendingRequests: number
  unreadNotifications: number
}

export default function CommunityHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  
  const [counts, setCounts] = useState<NavCounts>({
    unreadMessages: 0,
    pendingRequests: 0,
    unreadNotifications: 0
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

      // Fetch unread messages count
      const threadsRes = await fetch('/api/community/threads', { headers })
      if (threadsRes.ok) {
        const threadsData = await threadsRes.json()
        const unreadMessages = (threadsData.threads || []).reduce(
          (acc: number, t: { unread_count: number }) => acc + t.unread_count, 0
        )
        setCounts(prev => ({ ...prev, unreadMessages }))
      }

      // Fetch pending requests count
      const requestsRes = await fetch('/api/community/requests?status=pending', { headers })
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setCounts(prev => ({ ...prev, pendingRequests: requestsData.requests?.length || 0 }))
      }

      // Fetch unread notifications count
      const notifRes = await fetch('/api/community/notifications?unread_only=true', { headers })
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setCounts(prev => ({ ...prev, unreadNotifications: notifData.notifications?.length || 0 }))
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const navItems = [
    { 
      href: '/community', 
      label: 'Home', 
      icon: Home,
      exact: true
    },
    { 
      href: '/community/browse', 
      label: 'Browse', 
      icon: Search 
    },
    { 
      href: '/community/inbox', 
      label: 'Messages', 
      icon: MessageSquare,
      count: counts.unreadMessages
    },
    { 
      href: '/community/sessions', 
      label: 'Sessions', 
      icon: Calendar 
    },
    { 
      href: '/community/requests', 
      label: 'Requests', 
      icon: FileText,
      count: counts.pendingRequests
    },
    { 
      href: '/community/offers', 
      label: 'Offers', 
      icon: HandHeart 
    },
    { 
      href: '/community/profile', 
      label: 'My Profile', 
      icon: User 
    }
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/community')}
            >
              <Users className="w-6 h-6 text-red-500" />
              <span className="font-bold text-gray-900">SabiCommunity</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active 
                        ? 'bg-red-50 text-red-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {item.count > 9 ? '9+' : item.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active 
                        ? 'bg-red-50 text-red-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.count && item.count > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                        {item.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  active ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.count && item.count > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}