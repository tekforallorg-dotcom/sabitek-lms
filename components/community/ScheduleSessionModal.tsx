'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Link, Loader2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MEETING_PROVIDERS } from '@/types/community'

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    scheduled_start: string
    duration_minutes: number
    meeting_provider: string
    meeting_url: string
  }) => Promise<void>
  partnerName: string
  existingData?: {
    scheduled_start?: string
    duration_minutes?: number
    meeting_provider?: string
    meeting_url?: string
  }
}

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  onSubmit,
  partnerName,
  existingData
}: ScheduleSessionModalProps) {
  // Parse existing date if available
  const getDefaultDate = () => {
    if (existingData?.scheduled_start) {
      const date = new Date(existingData.scheduled_start)
      return date.toISOString().slice(0, 16)
    }
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    return tomorrow.toISOString().slice(0, 16)
  }

  const [scheduledStart, setScheduledStart] = useState(getDefaultDate())
  const [duration, setDuration] = useState(existingData?.duration_minutes || 60)
  const [meetingProvider, setMeetingProvider] = useState(existingData?.meeting_provider || 'google_meet')
  const [meetingUrl, setMeetingUrl] = useState(existingData?.meeting_url || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    const startDate = new Date(scheduledStart)
    if (startDate < new Date()) {
      setError('Cannot schedule a session in the past')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        scheduled_start: startDate.toISOString(),
        duration_minutes: duration,
        meeting_provider: meetingProvider,
        meeting_url: meetingUrl
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  // Get minimum datetime (now)
  const getMinDateTime = () => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Session</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Schedule a session with <span className="font-medium text-gray-900">{partnerName}</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Date & Time */}
            <div>
              <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date & Time
              </label>
              <input
                id="datetime"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                min={getMinDateTime()}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
              />
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            {/* Meeting Provider */}
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Video className="w-4 h-4 inline mr-1" />
                Meeting Platform
              </label>
              <select
                id="provider"
                value={meetingProvider}
                onChange={(e) => setMeetingProvider(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
              >
                {MEETING_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting URL */}
            <div>
              <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                <Link className="w-4 h-4 inline mr-1" />
                Meeting Link <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="meetingUrl"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-400">
                You can add this later or share it in the chat
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}