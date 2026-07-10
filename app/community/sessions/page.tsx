'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ScheduleSessionModal from '@/components/community/ScheduleSessionModal'
import ReviewModal from '@/components/community/ReviewModal'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  CalendarDays,
  Star
} from 'lucide-react'
import { CommunitySession, SESSION_STATUSES } from '@/types/community'
import { toast } from '@/components/ui/toast'

type TabType = 'upcoming' | 'proposed' | 'past'

export default function SessionsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [sessions, setSessions] = useState<CommunitySession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CommunitySession | null>(null)

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewSession, setReviewSession] = useState<CommunitySession | null>(null)

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
      router.push('/auth/login?redirect=/community/sessions')
    } else if (user) {
      fetchSessions()
    }
  }, [user, authLoading, router])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/sessions', { headers })
      const data = await res.json()

      if (res.ok) {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = (session: CommunitySession) => {
    setSelectedSession(session)
    setShowScheduleModal(true)
  }

  const handleSubmitSchedule = async (data: {
    scheduled_start: string
    duration_minutes: number
    meeting_provider: string
    meeting_url: string
  }) => {
    if (!selectedSession) return

    const headers = await getAuthHeaders()
    const res = await fetch(`/api/community/sessions/${selectedSession.id}/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.error || 'Failed to schedule session')
    }

    await fetchSessions()
  }

  const handleComplete = async (sessionId: string) => {
    if (!confirm('Mark this session as complete?')) return

    setActionLoading(sessionId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers
      })

      if (res.ok) {
        await fetchSessions()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to complete session')
      }
    } catch (error) {
      console.error('Error completing session:', error)
      toast.error('Failed to complete session')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (sessionId: string) => {
    const reason = prompt('Reason for cancellation (optional):')
    if (reason === null) return

    setActionLoading(sessionId)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      })

      if (res.ok) {
        await fetchSessions()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to cancel session')
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error('Failed to cancel session')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReview = (session: CommunitySession) => {
    setReviewSession(session)
    setShowReviewModal(true)
  }

  const handleSubmitReview = async (data: { rating: number; comment: string }) => {
    if (!reviewSession) return

    const headers = await getAuthHeaders()
    const res = await fetch('/api/community/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: reviewSession.id,
        rating: data.rating,
        comment: data.comment
      })
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.error || 'Failed to submit review')
    }

    toast.success('Review submitted successfully!')
    await fetchSessions()
  }

  const getFilteredSessions = () => {
    const now = new Date()

    switch (activeTab) {
      case 'upcoming':
        return sessions.filter(s =>
          s.status === 'scheduled' &&
          s.scheduled_start &&
          new Date(s.scheduled_start) > now
        ).sort((a, b) =>
          new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()
        )
      case 'proposed':
        return sessions.filter(s => s.status === 'proposed')
      case 'past':
        return sessions.filter(s =>
          s.status === 'completed' ||
          s.status === 'cancelled' ||
          s.status === 'no_show' ||
          (s.status === 'scheduled' && s.scheduled_start && new Date(s.scheduled_start) < now)
        ).sort((a, b) =>
          new Date(b.completed_at || b.scheduled_start || b.created_at).getTime() -
          new Date(a.completed_at || a.scheduled_start || a.created_at).getTime()
        )
      default:
        return sessions
    }
  }

  const filteredSessions = getFilteredSessions()

  const getPartner = (session: CommunitySession) => {
    if (session.learner_id === user?.id) {
      return { ...session.mentor, role: 'Mentor' }
    }
    return { ...session.learner, role: 'Learner' }
  }

  const getStatusConfig = (status: string) => {
    return SESSION_STATUSES.find(s => s.value === status) || {
      value: status,
      label: status,
      color: 'text-gray-600 bg-gray-50'
    }
  }

  const formatSessionTime = (session: CommunitySession) => {
    if (!session.scheduled_start) return null

    const start = new Date(session.scheduled_start)
    const now = new Date()
    const diffMs = start.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let relativeTime = ''
    if (diffMs < 0) {
      relativeTime = 'Past'
    } else if (diffHours < 1) {
      relativeTime = 'Starting soon'
    } else if (diffHours < 24) {
      relativeTime = `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    } else if (diffDays < 7) {
      relativeTime = `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    } else {
      relativeTime = start.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    }

    return {
      date: start.toLocaleDateString('en-NG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: start.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      relative: relativeTime
    }
  }

  const proposedCount = sessions.filter(s => s.status === 'proposed').length
  const upcomingCount = sessions.filter(s =>
    s.status === 'scheduled' &&
    s.scheduled_start &&
    new Date(s.scheduled_start) > new Date()
  ).length

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
              <p className="text-xs text-gray-500">Manage your mentoring sessions</p>
            </div>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                activeTab === 'upcoming'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming
              {upcomingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {upcomingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('proposed')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                activeTab === 'proposed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              To Schedule
              {proposedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded-full">
                  {proposedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'past'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past
            </button>
          </div>
        </div>
      </div>

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
        ) : filteredSessions.length > 0 ? (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const partner = getPartner(session)
              const statusConfig = getStatusConfig(session.status)
              const timeInfo = formatSessionTime(session)
              const isLoading = actionLoading === session.id

              return (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`px-4 py-2 ${
                      session.status === 'scheduled' ? 'bg-blue-50' :
                      session.status === 'proposed' ? 'bg-yellow-50' :
                      session.status === 'completed' ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {timeInfo && session.status === 'scheduled' && (
                          <span className="text-xs font-medium text-blue-600">
                            {timeInfo.relative}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/community/mentor/${partner?.id}`)}
                        >
                          {partner?.avatar_url ? (
                            <img
                              src={partner.avatar_url}
                              alt={partner.full_name || 'Partner'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold">
                              {partner?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {partner?.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">{partner?.role}</p>
                            </div>
                          </div>

                          {session.skill && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                              {session.skill.name}
                            </span>
                          )}

                          {timeInfo && session.status !== 'proposed' && (
                            <div className="flex items-center gap-3 mt-3 text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {timeInfo.date}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                {timeInfo.time}
                              </span>
                              <span className="text-gray-400">
                                ({session.duration_minutes || 60} min)
                              </span>
                            </div>
                          )}

 {session.meeting_url && session.status === 'scheduled' && (
                            <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors">
                              <Video className="w-4 h-4" />
                              Join Meeting
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          <div className="flex flex-wrap gap-2 mt-4">
                            {session.status === 'proposed' && (
                              <>           <Button
                                  size="sm"
                                  onClick={() => handleSchedule(session)}
                                  disabled={isLoading}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg"
                                >
                                  <Calendar className="w-3.5 h-3.5 mr-1" />
                                  Schedule
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancel(session.id)}
                                  disabled={isLoading}
                                  className="text-xs rounded-lg"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}

                            {session.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSchedule(session)}
                                  disabled={isLoading}
                                  variant="outline"
                                  className="text-xs rounded-lg"
                                >
                                  <Calendar className="w-3.5 h-3.5 mr-1" />
                                  Reschedule
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleComplete(session.id)}
                                  disabled={isLoading}
                                  className="bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                      Complete
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancel(session.id)}
                                  disabled={isLoading}
                                  className="text-xs rounded-lg text-red-500 border-red-200 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}

                            {session.status === 'completed' && (
                              <>
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Completed
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(session)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg"
                                >
                                  <Star className="w-3.5 h-3.5 mr-1" />
                                  Leave Review
                                </Button>
                              </>
                            )}

                            {session.status === 'cancelled' && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <XCircle className="w-4 h-4" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
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
              <CalendarDays className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'upcoming' && 'No upcoming sessions'}
              {activeTab === 'proposed' && 'No sessions to schedule'}
              {activeTab === 'past' && 'No past sessions'}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6">
              {activeTab === 'upcoming' && 'When you schedule sessions with mentors or learners, they will appear here.'}
              {activeTab === 'proposed' && 'When you accept session requests or offers, you can schedule them here.'}
              {activeTab === 'past' && 'Your completed and cancelled sessions will appear here.'}
            </p>
            {activeTab !== 'past' && (
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

      {selectedSession && (
        <ScheduleSessionModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false)
            setSelectedSession(null)
          }}
          onSubmit={handleSubmitSchedule}
          partnerName={
            selectedSession.learner_id === user?.id
              ? selectedSession.mentor?.full_name || 'Partner'
              : selectedSession.learner?.full_name || 'Partner'
          }
          existingData={{
            scheduled_start: selectedSession.scheduled_start || undefined,
            duration_minutes: selectedSession.duration_minutes || 60,
            meeting_provider: selectedSession.meeting_provider || undefined,
            meeting_url: selectedSession.meeting_url || undefined
          }}
        />
      )}

      {reviewSession && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setReviewSession(null)
          }}
          onSubmit={handleSubmitReview}
          sessionId={reviewSession.id}
          partnerName={
            reviewSession.learner_id === user?.id
              ? reviewSession.mentor?.full_name || 'Partner'
              : reviewSession.learner?.full_name || 'Partner'
          }
        />
      )}
    </div>
  )
}