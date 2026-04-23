'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Mail,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [interest, setInterest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName || undefined,
          interest: interest || undefined,
          source: 'waitlist_page',
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Something went wrong. Please try again.')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 justify-center">
            <span className="text-3xl font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">You are on the list!</h1>
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-gray-600">
                We will reach out to <strong>{email}</strong> when individual learner accounts open up. In the meantime, if your school or organization is interested, they can request access now.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/schools-and-tutors">
                  <Button className="w-full h-11 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl">
                    Request Institutional Access
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Join the Waitlist</h1>
              <p className="text-sm text-white/80 mt-1">
                Be the first to know when individual learner accounts open.
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">What are you interested in?</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder="e.g. Digital skills, data analysis, web development..."
                      rows={3}
                      maxLength={1000}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-red-500 focus:outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Joining...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Join Waitlist
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Already have an invite? <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-medium">Sign in</Link>
                </p>
                <p className="text-xs text-gray-500">
                  Representing an institution? <Link href="/schools-and-tutors" className="text-red-500 hover:text-red-600 font-medium">Request Access</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          We will only use your email to notify you when accounts open. No spam.
        </p>
      </div>
    </div>
  )
}