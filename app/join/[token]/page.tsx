'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Building2,
  BookOpen,
  Users,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  GraduationCap,
} from 'lucide-react'

/* ── Types ── */

interface InvitePreview {
  invite: {
    type: 'LINK' | 'QR' | 'EMAIL_CAMPAIGN' | 'BULK_CSV'
    is_usable: boolean
    not_usable_reason: string | null
    expires_at: string | null
    uses_left: number | null
  }
  cohort: {
    id: string
    name: string
    slug: string
    description: string | null
    enrollment_mode: string
    start_date: string | null
    end_date: string | null
    status: string
  }
  program: {
    id: string
    name: string
    short_description: string | null
    thumbnail_url: string | null
  }
  institution: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    accent_color: string | null
    type: string
  }
}

interface AcceptResult {
  already_member: boolean
  cohort_id: string
  program_id: string
  cohort_name: string
  program_name: string
  requires_approval?: boolean
  membership: {
    status: string
  }
}

/* ── Skeleton Loader (mobile-first, no heavy animation) ── */

function InviteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
          </div>
          <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */

export default function JoinByTokenPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const token = typeof params.token === 'string' ? params.token : ''

  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [accepting, setAccepting] = useState(false)
  const [acceptResult, setAcceptResult] = useState<AcceptResult | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  /* Fetch preview — public, works signed out */
  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/join/${encodeURIComponent(token)}/preview`)

      if (!res.ok) {
        if (res.status === 404) {
          setError('This invite link is invalid or has been removed.')
        } else if (res.status === 429) {
          setError('Too many attempts. Please try again in a moment.')
        } else {
          setError('Unable to load invite. Please try again.')
        }
        return
      }

      const json = await res.json()
      const data: InvitePreview = json.data || json
      setPreview(data)
    } catch (err) {
      console.error('Preview fetch error:', err)
      setError('Could not connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) fetchPreview()
  }, [token, fetchPreview])

  /* Accept — requires auth */
  const handleAccept = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/join/${encodeURIComponent(token)}`)
      return
    }

    try {
      setAccepting(true)
      setAcceptError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login?redirect=/join/${encodeURIComponent(token)}`)
        return
      }

      const res = await fetch(`/api/join/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()

      if (!res.ok) {
        setAcceptError(json.error || 'Could not join cohort. Please try again.')
        return
      }

      const result: AcceptResult = json.data || json
      setAcceptResult(result)
    } catch (err) {
      console.error('Accept error:', err)
      setAcceptError('Could not connect. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  /* ── Loading ── */
  if (loading || authLoading) return <InviteLoader />

  /* ── Error State ── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invite Unavailable</h1>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button className="w-full bg-red-600 hover:bg-red-700 rounded-xl">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!preview) return <InviteLoader />

  /* ── Success State (already member or just joined) ── */
  if (acceptResult) {
    const requiresApproval = acceptResult.requires_approval
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                requiresApproval ? 'bg-amber-50' : 'bg-emerald-50'
              }`}
            >
              {requiresApproval ? (
                <Clock className="w-8 h-8 text-amber-500" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {acceptResult.already_member
                ? "You're already in this cohort"
                : requiresApproval
                ? 'Application Submitted'
                : '🎉 Welcome to the cohort!'}
            </h1>

            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-gray-900">{acceptResult.cohort_name}</span>
            </p>
            <p className="text-xs text-gray-500 mb-6">Part of {acceptResult.program_name}</p>

            {requiresApproval && !acceptResult.already_member && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-900">
                  This cohort requires approval before access. {preview.institution.name} will review your
                  application — you&apos;ll be notified once you&apos;re approved.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Go to My Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!requiresApproval && (
              <Button
                onClick={() => router.push('/courses')}
                variant="outline"
                className="w-full rounded-xl"
              >
                Browse Courses
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Preview State (signed in or signed out) ── */

  const accentColor = preview.institution.accent_color || '#dc2626'
  const usable = preview.invite.is_usable
  const reason = preview.invite.not_usable_reason

  const unusableMessage: Record<string, string> = {
    revoked: 'This invite has been revoked by the institution.',
    expired: 'This invite has expired.',
    exhausted: 'This invite has reached its maximum number of uses.',
    cohort_closed: 'This cohort is no longer accepting new members.',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Sabitek top bar */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-4 h-4 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Institution header — uses their accent color */}
          <div
            className="p-5 border-b border-gray-100"
            style={{
              background: `linear-gradient(135deg, ${accentColor}0D 0%, ${accentColor}05 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                {preview.institution.logo_url ? (
                  <img
                    src={preview.institution.logo_url}
                    alt={preview.institution.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-6 h-6" style={{ color: accentColor }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 capitalize">
                  {preview.institution.type.replace('_', ' ')}
                </p>
                <p className="font-semibold text-gray-900 truncate">{preview.institution.name}</p>
              </div>
            </div>
          </div>

          {/* Invitation pitch */}
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              You&apos;re invited to join
            </p>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{preview.cohort.name}</h1>
            <p className="text-sm text-gray-600 mb-4">Part of {preview.program.name}</p>

            {preview.cohort.description && (
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
                {preview.cohort.description}
              </p>
            )}

            {preview.program.short_description && !preview.cohort.description && (
              <p className="text-sm text-gray-700 mb-4">{preview.program.short_description}</p>
            )}

            {/* Info rows */}
            <div className="space-y-3 py-4 border-t border-gray-100">
              <InfoRow
                icon={<BookOpen className="w-4 h-4" />}
                label="Program"
                value={preview.program.name}
              />

              {preview.cohort.start_date && (
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Starts"
                  value={formatDate(preview.cohort.start_date)}
                />
              )}

              {preview.cohort.enrollment_mode === 'approval_required' && (
                <InfoRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Access"
                  value="Approval required"
                  emphasis
                />
              )}

              {preview.cohort.enrollment_mode === 'public' && (
                <InfoRow
                  icon={<Users className="w-4 h-4" />}
                  label="Access"
                  value="Open enrollment"
                />
              )}
            </div>

            {/* Unusable invite warning */}
            {!usable && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  {unusableMessage[reason || ''] ||
                    'This invite is no longer active. Please contact the institution for a new one.'}
                </p>
              </div>
            )}

            {/* Accept error */}
            {acceptError && usable && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{acceptError}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-5 space-y-2">
              {usable && user && (
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full rounded-xl shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  {accepting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {preview.cohort.enrollment_mode === 'approval_required'
                        ? 'Apply to Join'
                        : 'Join Cohort'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              )}

              {usable && !user && (
                <>
                  <Link href={`/auth/login?redirect=/join/${encodeURIComponent(token)}`}>
                    <Button
                      className="w-full rounded-xl shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      Sign In to Join
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=/join/${encodeURIComponent(token)}`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full rounded-xl">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}

              {!usable && (
                <Link href="/">
                  <Button variant="outline" className="w-full rounded-xl">
                    Back to Homepage
                  </Button>
                </Link>
              )}
            </div>

            {/* Low-data-friendly help text */}
            {user && usable && (
              <p className="text-xs text-gray-500 text-center mt-3">
                You&apos;re signed in as <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Powered by Sabitek — Learning for Africa
        </p>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function InfoRow({
  icon,
  label,
  value,
  emphasis,
}: {
  icon: React.ReactNode
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          emphasis ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium truncate ${emphasis ? 'text-amber-900' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}