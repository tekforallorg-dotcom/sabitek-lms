'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import RequestSessionModal from '@/components/community/RequestSessionModal'
import {
  ArrowLeft,
  MapPin,
  Globe,
  Clock,
  Star,
  CheckCircle,
  Calendar,
  MessageSquare,
  Briefcase,
  Award,
  Users,
  Zap,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import {
  MentorProfileFull,
  SPOKEN_LANGUAGES,
  SKILL_LEVELS,
  MEETING_METHODS,
  SESSION_LENGTHS,
  DAYS_OF_WEEK
} from '@/types/community'

interface MentorPageProps {
  params: Promise<{ id: string }>
}

export default function MentorProfilePage({ params }: MentorPageProps) {
  const { id: mentorId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [mentor, setMentor] = useState<MentorProfileFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'skills' | 'reviews' | 'availability'>('about')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchMentorProfile()
    }
  }, [mentorId, authLoading])

  const fetchMentorProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/community/mentor/${mentorId}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load mentor profile')
        return
      }

      setMentor(data.mentor)
    } catch (err) {
      console.error('Error fetching mentor:', err)
      setError('Failed to load mentor profile')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSession = async (message: string) => {
    if (!user) {
      router.push(`/auth/login?redirect=/community/mentor/${mentorId}`)
      return
    }

    const headers = await getAuthHeaders()
    const res = await fetch('/api/community/session-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mentor_id: mentorId,
        message
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to send request')
    }

    setRequestSent(true)
  }

  // Loading skeleton
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-64 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mentor Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This mentor profile does not exist or is unavailable.'}</p>
          <Button onClick={() => router.push('/community/browse')} className="bg-red-500 hover:bg-red-600 text-white">
            Browse Mentors
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === mentorId

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-600">Mentor Profile</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-red-500 to-red-600 pt-6 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
              {mentor.avatar_url ? (
                <img
                  src={mentor.avatar_url}
                  alt={mentor.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-300 to-red-500 flex items-center justify-center text-white text-3xl font-bold">
                  {mentor.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {mentor.display_name}
                </h1>
                {mentor.is_verified && (
                  <CheckCircle className="w-5 h-5 text-white" />
                )}
              </div>

              {mentor.headline && (
                <p className="text-red-100 text-sm mb-2">{mentor.headline}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-red-100">
                {mentor.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {mentor.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {mentor.languages?.map(l =>
                    SPOKEN_LANGUAGES.find(sl => sl.value === l)?.label
                  ).slice(0, 2).join(', ')}
                </span>
                {mentor.response_time_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Responds in {mentor.response_time_hours}h
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {mentor.avg_rating > 0 ? mentor.avg_rating.toFixed(1) : '-'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {mentor.reviews_count} review{mentor.reviews_count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {mentor.total_sessions}
                </span>
              </div>
              <p className="text-xs text-gray-500">Sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {mentor.completion_rate}%
                </span>
              </div>
              <p className="text-xs text-gray-500">Completion</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['about', 'skills', 'reviews', 'availability'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {mentor.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {mentor.bio}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Session Preferences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Session Length</p>
                        <p className="text-sm text-gray-900">
                          {mentor.preferred_session_lengths?.map(l =>
                            SESSION_LENGTHS.find(sl => sl.value === l)?.label
                          ).join(', ') || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Meeting Methods</p>
                        <p className="text-sm text-gray-900">
                          {mentor.preferred_meeting_methods?.map(m =>
                            MEETING_METHODS.find(mm => mm.value === m)?.label
                          ).join(', ') || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    {mentor.hourly_rate_ngn && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hourly Rate</p>
                          <p className="text-sm text-gray-900">
                            NGN {mentor.hourly_rate_ngn.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Languages</p>
                        <p className="text-sm text-gray-900">
                          {mentor.languages?.map(l =>
                            SPOKEN_LANGUAGES.find(sl => sl.value === l)?.label
                          ).join(', ') || 'English'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                {mentor.teaching_skills?.length > 0 ? (
                  mentor.teaching_skills.map((ps) => (
                    <div
                      key={ps.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {ps.skill?.name}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              ps.level === 'advanced'
                                ? 'bg-green-100 text-green-700'
                                : ps.level === 'intermediate'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {SKILL_LEVELS.find(l => l.value === ps.level)?.label}
                            </span>
                          </div>
                          {ps.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {ps.description}
                            </p>
                          )}
                          {ps.years_experience && (
                            <p className="text-xs text-gray-500 mt-2">
                              {ps.years_experience} year{ps.years_experience !== 1 ? 's' : ''} experience
                            </p>
                          )}
                        </div>
                        <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No skills listed yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {mentor.reviews?.length > 0 ? (
                  mentor.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {review.reviewer?.avatar_url ? (
                            <img
                              src={review.reviewer.avatar_url}
                              alt={review.reviewer.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-medium">
                              {review.reviewer?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {review.reviewer?.full_name}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(review.created_at).toLocaleDateString('en-NG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-4">
                {mentor.availability?.length > 0 ? (
                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const slots = mentor.availability?.filter(
                        (s) => s.day_of_week === day.value
                      )
                      return (
                        <div
                          key={day.value}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm font-medium text-gray-700 w-24">
                            {day.label}
                          </span>
                          <div className="flex-1 text-right">
                            {slots && slots.length > 0 ? (
                              <div className="flex flex-wrap justify-end gap-2">
                                {slots.map((slot) => (
                                  <span
                                    key={slot.id}
                                    className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg"
                                  >
                                    {slot.start_time} - {slot.end_time}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Not available</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No availability set</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Contact the mentor to discuss scheduling
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky CTA - Mobile */}
      {!isOwnProfile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-50">
          {requestSent ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Request Sent</span>
            </div>
          ) : (
            <Button
              onClick={() => setShowRequestModal(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-6 rounded-xl text-base font-medium"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Request Session
            </Button>
          )}
        </div>
      )}

      {/* Desktop CTA */}
      {!isOwnProfile && (
        <div className="hidden sm:block max-w-4xl mx-auto px-4 mt-6">
          {requestSent ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">Session request sent successfully</span>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Ready to learn from {mentor.display_name}?</p>
                  <p className="text-sm text-gray-500">Send a session request to get started</p>
                </div>
                <Button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Session
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Request Session Modal */}
      <RequestSessionModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleRequestSession}
        mentorName={mentor.display_name}
      />
    </div>
  )
}