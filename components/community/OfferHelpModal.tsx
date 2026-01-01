'use client'

import { useState } from 'react'
import { X, Send, Loader2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OfferHelpModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { message: string; proposed_rate_ngn?: number }) => Promise<void>
  requestTitle: string
}

export default function OfferHelpModal({
  isOpen,
  onClose,
  onSubmit,
  requestTitle
}: OfferHelpModalProps) {
  const [message, setMessage] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        message,
        proposed_rate_ngn: proposedRate ? parseInt(proposedRate, 10) : undefined
      })
      setMessage('')
      setProposedRate('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Offer Help</h2>
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
            Offer to help with: <span className="font-medium text-gray-900">"{requestTitle}"</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain how you can help..."
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {message.length}/500
              </p>
            </div>

            {/* Proposed Rate (Optional) */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Proposed Rate <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  NGN
                </span>
                <input
                  id="rate"
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="500"
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Leave empty if you want to discuss pricing later
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Offer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}