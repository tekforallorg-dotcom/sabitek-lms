'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

interface Cohort {
  id: string
  name: string
  status: string
  enrollment_mode: string
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
  draft: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  active: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  closed: { dot: 'bg-blue-400', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  archived: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <Button onClick={() => fetchInstitutionAndCohorts()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header */}
      <div className="bg-white border-b">
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
      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cohorts</h1>
              <p className="text-gray-600 mt-1">Manage learner groups across your programs</p>
            </div>
            <Link href="/institution/cohorts/create">
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
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
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search cohorts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cohorts yet</h3>
            <p className="text-gray-500 mb-6">Create your first cohort to start organizing learners</p>
            <Link href="/institution/cohorts/create">
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
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
                <div key={cohort.id} className="bg-white rounded-xl border hover:shadow-md transition-shadow">
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
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === cohort.id ? null : cohort.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {openMenu === cohort.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                            <Link href={`/institution/cohorts/${cohort.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="w-4 h-4" />View
                            </Link>
                            <Link href={`/institution/cohorts/${cohort.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4" />Edit
                            </Link>
                            <button
                              onClick={() => openArchiveModal(cohort.id, cohort.name)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {cohort.status.charAt(0).toUpperCase() + cohort.status.slice(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            onKeyDown={(e) => { if (e.key === 'Escape') closeArchiveModal() }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mx-auto mb-4">
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
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmArchive}
                disabled={!!archiving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              >
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