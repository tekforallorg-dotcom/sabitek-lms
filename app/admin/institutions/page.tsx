'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  X,
  School,
  Users,
  Briefcase,
  Heart,
  Building,
  MoreHorizontal,
  Globe,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface Institution {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  country: string | null
  state: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
  contact_email: string | null
  website: string | null
  created_at: string
  verified_at: string | null
  rejection_reason: string | null
  creator?: {
    id: string
    full_name: string
    email: string
  }
  member_count?: number
}

const typeIcons: Record<string, typeof School> = {
  school: School,
  training_center: Users,
  company: Briefcase,
  ngo: Heart,
  government: Building,
  other: MoreHorizontal,
}

const statusConfig = {
  pending: { color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', icon: XCircle, label: 'Rejected' },
  suspended: { color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100', icon: AlertCircle, label: 'Suspended' },
  archived: { color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', icon: X, label: 'Archived' },
}

export default function AdminInstitutionsPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchInstitutions()
    }
  }, [authLoading, userProfile, page, search, statusFilter, typeFilter])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/admin/institutions?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch institutions')
      }

      const data = await response.json()
      setInstitutions(data.institutions || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error fetching institutions:', err)
      setError('Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalSubmit = async () => {
    if (!selectedInstitution) return

    try {
      setActionLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`/api/admin/institutions/${selectedInstitution.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: approvalAction,
          review_notes: reviewNotes || undefined,
          rejection_reason: approvalAction === 'rejected' ? rejectionReason : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      setShowApprovalModal(false)
      setSelectedInstitution(null)
      setReviewNotes('')
      setRejectionReason('')
      fetchInstitutions()
      toast.success(`Institution ${approvalAction} successfully`)
    } catch (err: unknown) {
      console.error('Approval error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to process approval')
    } finally {
      setActionLoading(false)
    }
  }

  const openApprovalModal = (institution: Institution, action: 'approved' | 'rejected') => {
    setSelectedInstitution(institution)
    setApprovalAction(action)
    setShowApprovalModal(true)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setTypeFilter('')
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#fffcfb]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">Admin &middot; Workspaces</p>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            <span className="font-serif italic text-red-600">Institutions</span>
          </h1>
          <p className="text-gray-600 mt-1">Review and manage institution applications</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-rose-100 px-4 py-2 text-gray-600 shadow-sm">
          <Building2 className="w-5 h-5 text-red-500" />
          <span className="font-semibold">{total} institutions</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search institutions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10 rounded-full bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-gray-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-gray-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
          >
            <option value="">All Types</option>
            <option value="school">School</option>
            <option value="training_center">Training Center</option>
            <option value="company">Company</option>
            <option value="ngo">NGO</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>

          {(search || statusFilter || typeFilter) && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2 bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur border border-red-100 ring-1 ring-red-100 rounded-2xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-rose-50/60 rounded-lg h-10" />
            ))}
          </div>
        </div>
      ) : institutions.length === 0 ? (
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-2">
            No institutions <span className="font-serif italic text-red-600">found</span>
          </h3>
          <p className="text-gray-600">
            {search || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'No institution applications yet'}
          </p>
        </div>
      ) : (
        <div className="relative bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-rose-100">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Applied By</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) => {
                  const TypeIcon = typeIcons[institution.type] || Building2
                  const statusInfo = statusConfig[institution.status]
                  const StatusIcon = statusInfo?.icon || Clock

                  return (
                    <tr key={institution.id} className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{institution.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {institution.website && (
                                <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600 hover:underline">
                                  <Globe className="w-3 h-3" />
                                  Website
                                </a>
                              )}
                              {institution.contact_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {institution.contact_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-700">{institution.type.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{[institution.state, institution.country].filter(Boolean).join(', ') || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {institution.creator ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{institution.creator.full_name}</div>
                            <div className="text-sm text-gray-500">{institution.creator.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo?.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(institution.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {institution.status === 'pending' ? (
                            <>
                              <Button size="sm" onClick={() => openApprovalModal(institution, 'approved')} className="relative overflow-hidden bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold rounded-full shadow-[0_10px_24px_-10px_rgba(16,185,129,0.6)] ring-1 ring-emerald-500/50 transition-all hover:-translate-y-0.5">
                                <span className="absolute inset-x-2 top-0 h-px bg-white/40" aria-hidden="true" />
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openApprovalModal(institution, 'rejected')} className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {institution.status === 'approved' && institution.verified_at ? `Approved ${formatDate(institution.verified_at)}` : institution.status === 'rejected' ? 'Rejected' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-rose-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full">
            <div className="p-6 border-b border-rose-100">
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                {approvalAction === 'approved' ? 'Approve' : 'Reject'} Institution
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedInstitution.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal notes about this decision..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                />
              </div>

              {approvalAction === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this application is being rejected..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be shared with the applicant</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-rose-100 bg-rose-50/40 flex justify-end gap-3 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedInstitution(null)
                  setReviewNotes('')
                  setRejectionReason('')
                }}
                disabled={actionLoading}
                className="bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprovalSubmit}
                disabled={actionLoading || (approvalAction === 'rejected' && !rejectionReason)}
                className={approvalAction === 'approved'
                  ? 'relative overflow-hidden bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(16,185,129,0.6)] ring-1 ring-emerald-500/50 transition-all hover:-translate-y-0.5'
                  : 'relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5'}
              >
                <span className="absolute inset-x-2 top-0 h-px bg-white/40" aria-hidden="true" />
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : approvalAction === 'approved' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve Institution
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject Institution
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
