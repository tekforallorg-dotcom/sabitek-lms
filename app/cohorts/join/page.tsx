'use client'

'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

/* ── SabiBot Loader ── */

function SabiBotLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              className="w-8 h-8"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: 'sabibotPulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <rect x="10" y="14" width="20" height="16" rx="4" fill="currentColor" opacity="0.9" />
              <rect x="14" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="22" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="16" y="25" width="8" height="2" rx="1" fill="white" />
              <line x1="20" y1="14" x2="20" y2="8" stroke="currentColor" strokeWidth="2" opacity="0.9" />
              <circle cx="20" cy="7" r="2.5" fill="currentColor" opacity="0.9" />
            </svg>
          ))}
        </div>
        <p className="text-gray-500 text-base font-medium">{message}</p>
        <style jsx>{`
          @keyframes sabibotPulse {
            0%, 100% { color: #f87171; opacity: 0.4; transform: scale(0.95); }
            50% { color: #ef4444; opacity: 1; transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  )
}

/* ── Page ── */

function JoinCohortInner() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCode = searchParams.get('code') || ''

  const [code, setCode] = useState(prefillCode)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    cohortName: string
    cohortId: string
    programName: string | null
    message: string
  } | null>(null)

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    const returnUrl = encodeURIComponent(`/cohorts/join${prefillCode ? `?code=${prefillCode}` : ''}`)
    router.push(`/auth/login?redirect=${returnUrl}`)
    return <SabiBotLoader message="Redirecting to login..." />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)

    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter an access code')
      return
    }

    setJoining(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to join a cohort')
        setJoining(false)
        return
      }

      const res = await fetch('/api/cohorts/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ access_code: trimmed }),
      })

      const json = await res.json()
      const data = json.data || json

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join cohort')
      }

      setSuccess({
        cohortName: data.cohort?.name || 'Cohort',
        cohortId: data.cohort?.id || '',
        programName: data.program?.name || null,
        message: data.message || 'Successfully joined!',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading) {
    return <SabiBotLoader message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Join Cohort</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Join Cohort</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Key className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Join a Cohort</h1>
            <p className="text-gray-600 mt-2">Enter your access code to join a learning program</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Success State */}
        {success ? (
          <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re In!</h2>
            <p className="text-gray-600 text-sm mb-1">{success.message}</p>
            <p className="text-gray-900 font-medium mb-1">{success.cohortName}</p>
            {success.programName && (
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {success.programName}
              </p>
            )}

            <div className="mt-6 space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={() => {
                  setSuccess(null)
                  setCode('')
                }}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Join another cohort
              </button>
            </div>
          </div>
        ) : (
          /* Code Entry Form */
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SPRING2026"
                  className="text-center font-mono text-lg tracking-widest h-12"
                  maxLength={32}
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the code provided by your instructor or institution
                </p>
              </div>

              <Button
                type="submit"
                disabled={joining || !code.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-11"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Join Cohort
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t text-center">
              <p className="text-xs text-gray-500">
                Don&apos;t have a code?{' '}
                <Link href="/courses" className="text-red-600 hover:underline font-medium">
                  Browse courses
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JoinCohortPage() {
  return (
    <Suspense fallback={<SabiBotLoader message="Loading..." />}>
      <JoinCohortInner />
    </Suspense>
  )
}