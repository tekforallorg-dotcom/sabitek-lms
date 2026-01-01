'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  Clock,
  Users
} from 'lucide-react'

interface ThreadWithDetails {
  id: string
  session_id: string
  context: string
  created_at: string
  updated_at: string
  session: {
    id: string
    status: string
    scheduled_start: string | null
    learner: { id: string; full_name: string; avatar_url: string | null }
    mentor: { id: string; full_name: string; avatar_url: string | null }
    skill: { id: string; name: string } | null
  } | null
  last_message: {
    id: string
    content: string
    content_type: string
    sender_id: string
    created_at: string
  } | null
  unread_count: number
  other_user: { id: string; full_name: string; avatar_url: string | null } | null
  my_role: string
}

export default function InboxPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [threads, setThreads] = useState<ThreadWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/community/inbox')
    } else if (user) {
      fetchThreads()
    }
  }, [user, authLoading, router])

  const fetchThreads = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/threads', { headers })
      const data = await res.json()

      if (res.ok) {
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const totalUnread = threads.reduce((acc, t) => acc + t.unread_count, 0)

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
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                {totalUnread > 0 && (
                  <p className="text-xs text-gray-500">{totalUnread} unread</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : threads.length > 0 ? (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  thread.unread_count > 0 ? 'bg-red-50/50 border-red-100' : 'bg-white'
                }`}
                onClick={() => router.push(`/community/chat/${thread.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        {thread.other_user?.avatar_url ? (
                          <img
                            src={thread.other_user.avatar_url}
                            alt={thread.other_user.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                            {thread.other_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {thread.unread_count > 9 ? '9+' : thread.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold truncate ${
                          thread.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {thread.other_user?.full_name || 'Unknown'}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {thread.last_message
                            ? formatTime(thread.last_message.created_at)
                            : formatTime(thread.updated_at)}
                        </span>
                      </div>

                      {/* Skill badge */}
                      {thread.session?.skill && (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded mb-1">
                          {thread.session.skill.name}
                        </span>
                      )}

                      {/* Last message preview */}
                      <p className={`text-sm truncate ${
                        thread.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                      }`}>
                        {thread.last_message ? (
                          thread.last_message.content_type === 'system' ? (
                            <span className="italic text-gray-400">
                              {truncateMessage(thread.last_message.content)}
                            </span>
                          ) : (
                            <>
                              {thread.last_message.sender_id === user?.id && (
                                <span className="text-gray-400">You: </span>
                              )}
                              {truncateMessage(thread.last_message.content)}
                            </>
                          )
                        ) : (
                          <span className="italic text-gray-400">No messages yet</span>
                        )}
                      </p>

                      {/* Session status */}
                      {thread.session?.scheduled_start && thread.session.status === 'scheduled' && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(thread.session.scheduled_start).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
              When you connect with mentors or learners, your conversations will appear here.
            </p>
            <Button
              onClick={() => router.push('/community/browse')}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Find a Mentor
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}