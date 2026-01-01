'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Bell,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  Clock,
  Check,
  ChevronRight
} from 'lucide-react'
import { Notification, NotificationType } from '@/types/community'

// Group notifications by date
function groupNotificationsByDate(notifications: Notification[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; notifications: Notification[] }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Older', notifications: [] }
  ]

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    if (date >= today) {
      groups[0].notifications.push(notification)
    } else if (date >= yesterday) {
      groups[1].notifications.push(notification)
    } else if (date >= weekAgo) {
      groups[2].notifications.push(notification)
    } else {
      groups[3].notifications.push(notification)
    }
  })

  return groups.filter((g) => g.notifications.length > 0)
}

// Get icon for notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'session_request':
      return <Calendar className="w-5 h-5 text-blue-500" />
    case 'session_request_accepted':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'session_request_declined':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'offer':
      return <MessageSquare className="w-5 h-5 text-purple-500" />
    case 'offer_accepted':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'offer_declined':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'session_scheduled':
      return <Calendar className="w-5 h-5 text-blue-500" />
    case 'session_reminder':
      return <Clock className="w-5 h-5 text-yellow-500" />
    case 'message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />
    case 'review_prompt':
      return <Star className="w-5 h-5 text-yellow-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-500" />
  }
}

// Get navigation path for notification
function getNotificationPath(notification: Notification): string | null {
  switch (notification.type) {
    case 'session_request':
    case 'session_request_accepted':
    case 'session_request_declined':
      return '/community/session-requests'
    case 'offer':
    case 'offer_accepted':
    case 'offer_declined':
      return '/community/requests'
    case 'session_scheduled':
    case 'session_reminder':
      return notification.entity_id ? `/community/sessions/${notification.entity_id}` : '/community/sessions'
    case 'message':
      return notification.entity_id ? `/community/chat/${notification.entity_id}` : '/community/inbox'
    case 'review_prompt':
      return notification.entity_id ? `/community/sessions/${notification.entity_id}` : '/community/sessions'
    default:
      return null
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/community/notifications')
    } else if (user) {
      fetchNotifications()
    }
  }, [user, authLoading, router])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/notifications', { headers })
      const data = await res.json()

      if (res.ok) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`/api/community/notifications/${notificationId}/read`, {
        method: 'POST',
        headers
      })

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAllRead(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/notifications/read-all', {
        method: 'POST',
        headers
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate to relevant page
    const path = getNotificationPath(notification)
    if (path) {
      router.push(path)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const groupedNotifications = groupNotificationsByDate(notifications)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/community')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={markingAllRead}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
              >
                {markingAllRead ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.is_read
                          ? 'bg-red-50/50 border-red-100'
                          : 'bg-white'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              !notification.is_read
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm ${
                                  !notification.is_read
                                    ? 'font-semibold text-gray-900'
                                    : 'text-gray-700'
                                }`}
                              >
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            {notification.body && (
                              <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                                {notification.body}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              When you receive session requests, messages, or other updates, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric'
  })
}