'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  HandHeart,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  User
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface Offer {
  id: string
  request_id: string
  mentor_id: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  mentor: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  request: {
    id: string
    title: string
    description: string
    skill: { id: string; name: string } | null
    learner: {
      id: string
      full_name: string
      avatar_url: string | null
    }
  }
}

type TabType = 'received' | 'sent'

export default function OffersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/community/offers')
    } else if (user) {
      fetchOffers()
    }
  }, [user, authLoading, router, activeTab])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const type = activeTab === 'received' ? 'received' : 'sent'
      const res = await fetch(`/api/community/offers?type=${type}`, { headers })
      const data = await res.json()

      if (res.ok) {
        setOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (offerId: string) => {
    setActionLoading(offerId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/offers/${offerId}/accept`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        toast.success('Offer accepted! A session has been created.')
        await fetchOffers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept offer')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      toast.error('Failed to accept offer')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (offerId: string) => {
    if (!confirm('Are you sure you want to decline this offer?')) return

    setActionLoading(offerId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/offers/${offerId}/decline`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        await fetchOffers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to decline offer')
      }
    } catch (error) {
      console.error('Error declining offer:', error)
      toast.error('Failed to decline offer')
    } finally {
      setActionLoading(null)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
      case 'accepted':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Accepted</span>
      case 'declined':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Declined</span>
      default:
        return null
    }
  }

  const receivedCount = offers.filter(o => o.status === 'pending').length

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Help Offers</h1>
          <p className="text-sm text-gray-600 mt-1">Manage offers to help with learning requests</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received
            {activeTab === 'received' && receivedCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                {receivedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'sent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Content */}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
    ) : offers.filter(o => activeTab === 'received' ? o.mentor : o.request?.learner).length > 0 ? (
          <div className="space-y-4">
         {offers.map((offer) => {
              const isLoading = actionLoading === offer.id
              const otherUser = activeTab === 'received' 
                ? offer.mentor 
                : offer.request?.learner
              
              if (!otherUser) return null

              return (
                <Card key={offer.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => router.push(`/community/mentor/${otherUser.id}`)}
                      >
                        {otherUser.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={otherUser.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                            {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{otherUser.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {activeTab === 'received' ? 'offered to help' : 'on your request'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(offer.status)}
                            <span className="text-xs text-gray-400">{formatTime(offer.created_at)}</span>
                          </div>
                        </div>

                        {/* Request info */}
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">{offer.request.title}</p>
                          {offer.request.skill && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                              {offer.request.skill.name}
                            </span>
                          )}
                        </div>

                        {/* Offer message */}
                        {offer.message && (
                          <p className="mt-2 text-sm text-gray-600 italic">"{offer.message}"</p>
                        )}

                        {/* Actions */}
                        {offer.status === 'pending' && activeTab === 'received' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(offer.id)}
                              disabled={isLoading}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(offer.id)}
                              disabled={isLoading}
                              className="text-xs rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {offer.status === 'accepted' && (
                          <div className="flex items-center gap-2 mt-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Session created</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push('/community/sessions')}
                              className="ml-auto text-xs rounded-lg"
                            >
                              View Sessions
                            </Button>
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
              <HandHeart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'received' ? 'No offers received' : 'No offers sent'}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
              {activeTab === 'received'
                ? 'When mentors offer to help with your requests, they will appear here.'
                : 'When you offer to help others, your offers will appear here.'}
            </p>
            {activeTab === 'sent' && (
              <Button
                onClick={() => router.push('/community/browse')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Browse Requests
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}