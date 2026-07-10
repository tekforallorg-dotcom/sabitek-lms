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
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  suspended: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Suspended' },
  archived: { color: 'bg-gray-100 text-gray-800', icon: X, label: 'Archived' },
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
          <p className="text-gray-600 mt-1">Review and manage institution applications</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-5 h-5" />
          <span className="font-semibold">{total} institutions</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
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
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading institutions...</p>
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No institutions found</h3>
          <p className="text-gray-600">
            {search || statusFilter || typeFilter
              ? 'Try adjusting your filters'
              : 'No institution applications yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {institutions.map((institution) => {
                  const TypeIcon = typeIcons[institution.type] || Building2
                  const statusInfo = statusConfig[institution.status]
                  const StatusIcon = statusInfo?.icon || Clock

                  return (
                    <tr key={institution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{institution.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {institution.website && (
                                <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo?.color}`}>
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
                              <Button size="sm" onClick={() => openApprovalModal(institution, 'approved')} className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openApprovalModal(institution, 'rejected')} className="border-red-300 text-red-600 hover:bg-red-50">
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
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be shared with the applicant</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedInstitution(null)
                  setReviewNotes('')
                  setRejectionReason('')
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprovalSubmit}
                disabled={actionLoading || (approvalAction === 'rejected' && !rejectionReason)}
                className={approvalAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
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