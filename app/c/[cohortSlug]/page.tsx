'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import SabiLoader from '@/components/ui/SabiLoader'
import { toast } from '@/components/ui/toast'
import {
  Calendar,
  Users,
  BookOpen,
  KeyRound,
  ArrowRight,
  Building2,
  CheckCircle,
  Lock,
} from 'lucide-react'

interface CohortLanding {
  cohort: {
    id: string
    name: string
    slug: string
    description: string | null
    enrollment_mode: string
    start_date: string | null
    end_date: string | null
    seat_limit: number | null
    seats_left: number | null
  }
  program: { name: string; short_description: string | null; course_count: number } | null
  institution: {
    name: string
    logo_url: string | null
    accent_color: string | null
    banner_url: string | null
  } | null
}

/**
 * Branded cohort landing for vanity links: sabitek.app/join/<cohort-slug>.
 * The institution's identity leads; Sabitek is the quiet infrastructure.
 */
export default function CohortLandingPage({
  params,
}: {
  params: Promise<{ cohortSlug: string }>
}) {
  const { cohortSlug } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<CohortLanding | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/cohorts/by-slug/${cohortSlug}`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        setData(await res.json())
      } catch {
        setNotFound(true)
      }
    })()
  }, [cohortSlug])

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/c/${cohortSlug}`)
      return
    }
    if (!data) return
    if (data.cohort.enrollment_mode === 'access_code' && !accessCode.trim()) {
      toast.warning('Enter the access code your organization gave you.')
      return
    }
    try {
      setJoining(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login?redirect=/c/${cohortSlug}`)
        return
      }
      const res = await fetch('/api/cohorts/join-by-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slug: cohortSlug, access_code: accessCode.trim() || undefined }),
      })
      const payload = await res.json()
      if (!res.ok) {
        toast.error(payload.error || 'Could not join. Please try again.')
        return
      }
      setJoined(true)
      toast.success(payload.already_member ? 'You are already in this cohort!' : 'Welcome aboard!')
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      toast.error('Could not join. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-10 text-center max-w-md">
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
          <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-red-300" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-2">
            Cohort not{' '}
            <span className="font-serif italic text-red-600">found</span>
          </h1>
          <p className="text-sm text-gray-500">
            This link may have expired or the cohort may have been closed. Check with your organization.
          </p>
        </div>
      </div>
    )
  }

  if (!data || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SabiLoader text="Loading..." size="lg" />
      </div>
    )
  }

  const { cohort, program, institution } = data
  const accent = institution?.accent_color || '#e11d48'
  const needsCode = cohort.enrollment_mode === 'access_code'
  const inviteOnly = cohort.enrollment_mode === 'invite_only'
  const full = cohort.seats_left !== null && cohort.seats_left <= 0

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">

      <div className="relative max-w-xl mx-auto px-4 py-12 sm:py-16">
        {/* Institution identity leads */}
        <div className="text-center mb-8">
          {institution?.logo_url ? (
            <Image
              src={institution.logo_url}
              alt={institution.name}
              width={64}
              height={64}
              className="w-16 h-16 mx-auto rounded-xl object-cover border border-gray-200 mb-4"
            />
          ) : (
            <div
              className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center shadow-sm mb-4"
              style={{ background: accent }}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
          {institution && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-1">
              {institution.name}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900">
            Join{' '}
            <span className="font-serif italic text-red-600">
              {cohort.name}
            </span>
          </h1>
          {cohort.description && (
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">{cohort.description}</p>
          )}
        </div>

        {/* The card */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />

          {program && (
            <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-200">
              <div className="w-10 h-10 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{program.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {program.short_description || 'A structured learning program'}
                  {program.course_count > 0 && ` · ${program.course_count} course${program.course_count !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {fmt(cohort.start_date) && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-red-400" />
                <span>
                  Starts <strong>{fmt(cohort.start_date)}</strong>
                </span>
              </div>
            )}
            {cohort.seat_limit && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-red-400" />
                <span>
                  <strong className="tabular-nums">{cohort.seats_left}</strong> of{' '}
                  <span className="tabular-nums">{cohort.seat_limit}</span> seats left
                </span>
              </div>
            )}
          </div>

          {joined ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900">You are in!</p>
              <p className="text-xs text-gray-500">Taking you to your dashboard...</p>
            </div>
          ) : inviteOnly ? (
            <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-xl">
              <Lock className="w-6 h-6 text-red-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">This cohort is invite-only</p>
              <p className="text-xs text-gray-500 mt-1">
                Ask {institution?.name || 'your organization'} to send you an invitation.
              </p>
            </div>
          ) : full ? (
            <div className="text-center py-4 bg-amber-50/70 border border-amber-100 rounded-xl">
              <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">This cohort is full</p>
              <p className="text-xs text-gray-500 mt-1">Contact {institution?.name || 'the organization'} about the next intake.</p>
            </div>
          ) : (
            <>
              {needsCode && (
                <div className="relative mb-3">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Access code from your organization"
                    className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                  />
                </div>
              )}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="relative overflow-hidden w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full ring-1 ring-red-600/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {joining ? (
                  <SabiLoader text="" size="sm" />
                ) : (
                  <>
                    {user ? 'Join this cohort' : 'Sign in to join'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              {!user && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  New here? You can create your free account in the next step.
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-medium text-gray-500">Sabitek</span>
        </p>
      </div>
    </div>
  )
}
