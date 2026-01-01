'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  Loader2,
  Inbox,
  Send
} from 'lucide-react'
import { SessionRequest, SESSION_REQUEST_STATUSES } from '@/types/community'

type TabType = 'received' | 'sent'

export default function SessionRequestsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      router.push('/auth/login?redirect=/community/session-requests')
    } else if (user) {
      fetchRequests()
    }
  }, [user, authLoading, router, activeTab])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const role = activeTab === 'received' ? 'mentor' : 'learner'
      const res = await fetch(`/api/community/session-requests?role=${role}`, { headers })
      const data = await res.json()

      if (res.ok) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/session-requests/${requestId}/accept`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: 'accepted' as const } : r
          )
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to accept request')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Failed to accept request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) {
      return
    }

    setActionLoading(requestId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/session-requests/${requestId}/decline`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: 'declined' as const } : r
          )
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to decline request')
      }
    } catch (error) {
      console.error('Error declining request:', error)
      alert('Failed to decline request')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = SESSION_REQUEST_STATUSES.find((s) => s.value === status)
    if (!statusConfig) return null

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    )
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/community')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Session Requests</h1>
              <p className="text-xs text-gray-500">
                Manage your mentoring requests
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'received'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Received
              {activeTab === 'received' && pendingCount > 0 && (
                <span className="w-5 h-5 bg-white text-red-500 text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'sent'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Send className="w-4 h-4" />
              Sent
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => {
              const otherUser = activeTab === 'received' ? request.learner : request.mentor
              const isLoading = actionLoading === request.id

              return (
                <Card
                  key={request.id}
                  className={`transition-all ${
                    request.status === 'pending' && activeTab === 'received'
                      ? 'border-red-200 bg-red-50/30'
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => router.push(`/community/mentor/${otherUser?.id}`)}
                      >
                        {otherUser?.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={otherUser.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                            {otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {otherUser?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activeTab === 'received' ? 'wants to learn from you' : 'Mentor'}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {request.message && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {request.message}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeAgo(request.created_at)}
                          </span>
                        </div>

                        {/* Actions for received pending requests */}
                        {activeTab === 'received' && request.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(request.id)}
                              disabled={isLoading}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(request.id)}
                              disabled={isLoading}
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {/* Status info for accepted requests */}
                        {request.status === 'accepted' && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {activeTab === 'received'
                                ? 'You accepted this request. A session has been created.'
                                : 'Your request was accepted! Check your sessions.'}
                            </p>
                          </div>
                        )}

                        {/* Status info for declined requests */}
                        {request.status === 'declined' && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {activeTab === 'received'
                                ? 'You declined this request.'
                                : 'This request was declined.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'received' ? (
                <Inbox className="w-8 h-8 text-gray-400" />
              ) : (
                <Send className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'received' ? 'No requests received' : 'No requests sent'}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
              {activeTab === 'received'
                ? 'When learners send you session requests, they will appear here.'
                : 'When you request sessions from mentors, they will appear here.'}
            </p>
            {activeTab === 'sent' && (
              <Button
                onClick={() => router.push('/community/browse')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Find a Mentor
              </Button>
            )}
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