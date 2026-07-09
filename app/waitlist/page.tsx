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
import { GRAIN } from '@/components/marketing/primitives'

const inputClass =
  'h-11 pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400'

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
    <div className="relative min-h-screen bg-[#fffcfb] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute -top-24 right-[-8%] w-[28rem] h-[28rem] bg-rose-100/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-72 h-72 bg-red-50 rounded-full blur-[90px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 40%, black, transparent)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: GRAIN }} />

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 justify-center">
            <span className="text-3xl font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
        </div>

        <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_30px_60px_-25px_rgba(225,29,72,0.35)] overflow-hidden">
          <span
            className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
            aria-hidden="true"
          />

          {submitted ? (
            /* ── Success state ── */
            <div className="px-6 sm:px-8 py-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] flex items-center justify-center mb-5">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-3">
                You are{' '}
                <span className="font-serif italic text-red-600">on the list</span>
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-7">
                We will reach out to <span className="font-semibold text-gray-900">{email}</span>{' '}
                when individual learner accounts open up. In the meantime, if your school
                or organization is interested, they can request access now.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/schools-and-tutors">
                  <Button className="group relative overflow-hidden w-full h-11 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                    Request Institutional Access
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="w-full h-11 text-gray-500 hover:text-red-600 hover:bg-rose-50/60 text-sm font-medium rounded-full transition-all"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Join the{' '}
                  <span className="font-serif italic text-red-600">waitlist</span>
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  Be the first to know when individual learner accounts open.
                </p>
              </div>

              <div className="px-6 sm:px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700">What are you interested in?</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        placeholder="e.g. Digital skills, data analysis, web development..."
                        rows={3}
                        maxLength={1000}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-rose-100 bg-white/70 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 focus:outline-none text-sm resize-none transition-colors"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !email}
                    className="group relative overflow-hidden w-full h-11 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-10px_rgba(225,29,72,0.6)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Join Waitlist
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="relative mt-6 pt-4 text-center space-y-2">
                  <span
                    className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-500">
                    Already have an invite?{' '}
                    <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-medium">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500">
                    Representing an institution?{' '}
                    <Link href="/schools-and-tutors" className="text-red-500 hover:text-red-600 font-medium">
                      Request Access
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          We will only use your email to notify you when accounts open. No spam.
        </p>
      </div>
    </div>
  )
}
