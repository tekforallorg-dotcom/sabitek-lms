'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import {
  Users,
  Plus,
  Search,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  ChevronRight,
  BookOpen,
  UserPlus,
  Lock,
  Globe,
  Key,
  ClipboardCheck,
 AlertCircle,
  Loader2,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'

interface Cohort {
  id: string
  name: string
  slug: string | null
  status: string
  enrollment_mode: string
  access_code: string | null
  start_date: string | null
  end_date: string | null
  seat_limit: number | null
  created_at: string
  program: {
    id: string
    name: string
    slug: string
    institution_id: string
  }
  member_count: number
}

interface Institution {
  id: string
  name: string
  slug: string
}

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  draft: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  active: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  closed: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  archived: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
}

const enrollmentModeIcons: Record<string, React.ReactNode> = {
  invite_only: <Lock className="w-3 h-3" />,
  access_code: <Key className="w-3 h-3" />,
  approval_required: <ClipboardCheck className="w-3 h-3" />,
  public: <Globe className="w-3 h-3" />,
}

const enrollmentModeLabels: Record<string, string> = {
  invite_only: 'Invite Only',
  access_code: 'Access Code',
  approval_required: 'Approval Required',
  public: 'Public',
}

function SabiBotLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
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
              <rect x="10" y="14" width="20" height="16" rx="4" fill="currentColor" opacity="0.9"/>
              <rect x="14" y="18" width="4" height="4" rx="1" fill="white"/>
              <rect x="22" y="18" width="4" height="4" rx="1" fill="white"/>
              <rect x="16" y="25" width="8" height="2" rx="1" fill="white"/>
              <line x1="20" y1="14" x2="20" y2="8" stroke="currentColor" strokeWidth="2" opacity="0.9"/>
              <circle cx="20" cy="7" r="2.5" fill="currentColor" opacity="0.9"/>
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

function ShareCohortModal({ cohort, onClose }: { cohort: Cohort; onClose: () => void }) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const joinUrl = `https://www.sabitek.app/c/${cohort.slug}`

  const copyText = async (
    text: string,
    message: string,
    setCopied: (v: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative overflow-hidden bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>

        <div className="flex items-start justify-between mb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">
              Share this cohort
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 truncate">
              {cohort.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Join link */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Join link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-4 py-2 rounded-full bg-rose-50/60 border border-rose-100 text-sm text-gray-700 truncate">
              {joinUrl}
            </div>
            <button
              type="button"
              onClick={() => copyText(joinUrl, 'Link copied', setCopiedLink)}
              className="relative overflow-hidden inline-flex items-center gap-1.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-xs rounded-full px-4 py-2 shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
              {copiedLink ? (
                <><Check className="w-3.5 h-3.5" />Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" />Copy</>
              )}
            </button>
          </div>
        </div>

        {/* Mode-aware section */}
        {cohort.enrollment_mode === 'access_code' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Access code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-4 py-2 rounded-full bg-rose-50/60 border border-rose-100 text-sm font-bold tracking-widest tabular-nums text-gray-900 truncate">
                {cohort.access_code || '—'}
              </div>
              <button
                type="button"
                onClick={() => copyText(cohort.access_code || '', 'Code copied', setCopiedCode)}
                className="relative overflow-hidden inline-flex items-center gap-1.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-xs rounded-full px-4 py-2 shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                {copiedCode ? (
                  <><Check className="w-3.5 h-3.5" />Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" />Copy</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Share the link AND the code. Learners need both.
            </p>
          </div>
        ) : cohort.enrollment_mode === 'invite_only' ? (
          <div className="mb-4 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This cohort is invite-only - the public page shows a notice instead of a join
              button. Use member invitations from the cohort detail page.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mb-4">
            Anyone with this link can join while enrollment is open.
          </p>
        )}

        {/* Preview link */}
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
        >
          Preview what learners see
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}

export default function CohortsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null)
  const [shareTarget, setShareTarget] = useState<Cohort | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchInstitutionAndCohorts()
    }
  }, [user])

  const fetchInstitutionAndCohorts = async () => {
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const membershipRes = await fetch('/api/institutions/my-membership', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!membershipRes.ok) {
        if (membershipRes.status === 404) {
          router.push('/institution/apply')
          return
        }
        throw new Error('Failed to fetch membership')
      }

      const membershipData = await membershipRes.json()
      // Handle both { data: { institution: {...} } } and { institution: {...} } formats
      const membership = membershipData.data || membershipData

      if (!membership?.institution) {
        console.error('No institution in membership response:', membershipData)
        router.push('/institution/apply')
        return
      }

      setInstitution(membership.institution)

      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const cohortsRes = await fetch(`/api/cohorts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json()
        // Handle both { data: { cohorts: [...] } } and { cohorts: [...] } formats
        const data = cohortsData.data || cohortsData
        setCohorts(data.cohorts || [])
      }
    } catch (err) {
      console.error('Error fetching cohorts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  const openArchiveModal = (cohortId: string, cohortName: string) => {
    setOpenMenu(null)
    setArchiveTarget({ id: cohortId, name: cohortName })
  }

  const closeArchiveModal = () => {
    if (!archiving) setArchiveTarget(null)
  }

  const confirmArchive = async () => {
    if (!archiveTarget) return

    setArchiving(archiveTarget.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/cohorts/${archiveTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to archive cohort')
      }

      setArchiveTarget(null)
      fetchInstitutionAndCohorts()
    } catch (err) {
      console.error('Archive error:', err)
      setError(err instanceof Error ? err.message : 'Failed to archive cohort')
      setArchiveTarget(null)
    } finally {
      setArchiving(null)
    }
  }

  useEffect(() => {
    if (user && institution) {
      // Re-fetch when filters change
      const timeoutId = setTimeout(() => {
        fetchInstitutionAndCohorts()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [search, statusFilter])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading cohorts..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <Button onClick={() => fetchInstitutionAndCohorts()} className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Sub-header */}
      <div className="bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Cohorts</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Cohorts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Learner Groups</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Your <span className="font-serif italic text-red-600">cohorts</span></h1>
              <p className="text-gray-600 mt-1">Manage learner groups across your programs</p>
            </div>
            <Link href="/institution/cohorts/create">
              <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 gap-2">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                <Plus className="w-4 h-4" />
                Create Cohort
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search cohorts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Cohorts Grid */}
        {cohorts.length === 0 ? (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cohorts yet</h3>
            <p className="text-gray-500 mb-6">Create your first cohort to start organizing learners</p>
            <Link href="/institution/cohorts/create">
              <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 gap-2">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                <Plus className="w-4 h-4" />
                Create First Cohort
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohorts.map((cohort) => {
              const status = statusColors[cohort.status] || statusColors.draft
              return (
                <div key={cohort.id} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 transition-all">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/institution/cohorts/${cohort.id}`} className="block group">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                            {cohort.name}
                          </h3>
                        </Link>
                        <Link href={`/institution/programs/${cohort.program?.id}`} className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 mt-1">
                          <BookOpen className="w-3 h-3" />
                          {cohort.program?.name || 'No Program'}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {cohort.slug && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null)
                              setShareTarget(cohort)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full text-xs font-semibold text-gray-700 shadow-sm transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-red-500" />
                            Share
                          </button>
                        )}
                        <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === cohort.id ? null : cohort.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {openMenu === cohort.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white/95 backdrop-blur rounded-xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] py-1 z-10">
                            <Link href={`/institution/cohorts/${cohort.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50/40">
                              <Eye className="w-4 h-4" />View
                            </Link>
                            <Link href={`/institution/cohorts/${cohort.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50/40">
                              <Edit className="w-4 h-4" />Edit
                            </Link>
                            <button
                              onClick={() => openArchiveModal(cohort.id, cohort.name)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-rose-50 w-full text-left cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-100 text-gray-600">
                        {enrollmentModeIcons[cohort.enrollment_mode]}
                        {enrollmentModeLabels[cohort.enrollment_mode]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <UserPlus className="w-4 h-4" />
                        <span>{cohort.member_count || 0} members</span>
                        {cohort.seat_limit && (
                          <span className="text-gray-400">/ {cohort.seat_limit}</span>
                        )}
                      </div>
                      {cohort.start_date && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {formatDate(cohort.start_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Share Cohort Modal */}
      {shareTarget && (
        <ShareCohortModal cohort={shareTarget} onClose={() => setShareTarget(null)} />
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeArchiveModal}
          />
          {/* Modal */}
          <div
            className="relative bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            onKeyDown={(e) => { if (e.key === 'Escape') closeArchiveModal() }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <div className="flex items-center justify-center w-14 h-14 bg-rose-50 border border-rose-100 rounded-xl mx-auto mb-4">
              <Archive className="w-7 h-7 text-red-500" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Archive Cohort
            </h3>

            <p className="text-sm text-gray-600 text-center mb-1">
              Are you sure you want to archive
            </p>
            <p className="text-sm font-semibold text-gray-900 text-center mb-4">
              &ldquo;{archiveTarget.name}&rdquo;?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 text-center">
                This cohort will be hidden from active view. Members will lose access to program content. This action can be reversed by an administrator.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeArchiveModal}
                disabled={!!archiving}
                className="flex-1 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmArchive}
                disabled={!!archiving}
                className="flex-1 relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 gap-2"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                {archiving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    Archive
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
