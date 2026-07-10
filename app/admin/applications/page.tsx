'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  MapPin,
  Users,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Application {
  id: string
  full_name: string
  email: string
  organisation_name: string
  role_title: string | null
  country: string | null
  org_type: string
  learner_count: string | null
  description: string
  status: string
  review_notes: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
  institution_id: string | null
}

const REASON_MAX_LENGTH = 1000

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-rose-50 ring-1 ring-rose-100', text: 'text-rose-700', dot: 'bg-rose-400' },
  approved: { bg: 'bg-emerald-50 ring-1 ring-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  rejected: { bg: 'bg-gray-100 ring-1 ring-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}

const orgTypeLabels: Record<string, string> = {
  school: 'School or College',
  ngo: 'NGO or Non-profit',
  government: 'Government Agency',
  training_center: 'Training Center',
  company: 'Company or Corporate',
  tutor: 'Independent Instructor',
  other: 'Other',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean
    app: Application | null
    reason: string
    submitting: boolean
  }>({ isOpen: false, app: null, reason: '', submitting: false })

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch(`/api/institution-applications?status=${statusFilter}&limit=50`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        console.error('Failed to fetch applications')
        return
      }

      const json = await res.json()
      const payload = json.data || json
      setApplications(payload.applications || [])
      setTotal(payload.total || 0)
    } catch (err) {
      console.error('Error fetching applications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const handleReview = async (appId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(appId)
    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch(`/api/institution-applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          review_notes: action === 'approve' ? 'Approved by platform admin' : undefined,
          rejection_reason: action === 'reject' ? (reason || undefined) : undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error('Review failed:', json.error)
        return
      }

      fetchApplications()
    } catch (err) {
      console.error('Error reviewing application:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const showApproveConfirm = (app: Application) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Application',
      message: `Approve ${app.organisation_name} (${app.email})? This will create their institution workspace.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        await handleReview(app.id, 'approve')
      },
    })
  }

  const showRejectConfirm = (app: Application) => {
    setRejectModal({ isOpen: true, app, reason: '', submitting: false })
  }

  const closeRejectModal = () => {
    if (rejectModal.submitting) return
    setRejectModal({ isOpen: false, app: null, reason: '', submitting: false })
  }

  const submitRejection = async () => {
    if (!rejectModal.app || rejectModal.submitting) return
    const targetApp = rejectModal.app
    const trimmed = rejectModal.reason.trim()
    setRejectModal(prev => ({ ...prev, submitting: true }))
    try {
      await handleReview(targetApp.id, 'reject', trimmed.length > 0 ? trimmed : undefined)
      setRejectModal({ isOpen: false, app: null, reason: '', submitting: false })
    } catch (err) {
      console.error('Error submitting rejection:', err)
      setRejectModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="confirm"
        actions={[
          { label: 'Cancel', onClick: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })), variant: 'secondary' },
          { label: 'Confirm', onClick: confirmDialog.onConfirm, variant: 'danger' },
        ]}
      />

      {/* Reject modal with optional reason */}
      {rejectModal.isOpen && rejectModal.app && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeRejectModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div
            className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-50 ring-1 ring-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h2 id="reject-modal-title" className="text-lg font-semibold tracking-tight text-gray-900">
                  Reject Application
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 break-words">
                  Reject the application from {rejectModal.app.organisation_name}? They will be notified by email.
                </p>
              </div>
            </div>

            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for rejection{' '}
              <span className="text-gray-400 font-normal">(optional, visible to applicant)</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              disabled={rejectModal.submitting}
              maxLength={REASON_MAX_LENGTH}
              rows={4}
              placeholder="Share any context that might help the applicant understand or strengthen a future application."
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {rejectModal.reason.length}/{REASON_MAX_LENGTH}
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button
                variant="outline"
                onClick={closeRejectModal}
                disabled={rejectModal.submitting}
                className="bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRejection}
                disabled={rejectModal.submitting}
                className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
              >
                <span className="absolute inset-x-2 top-0 h-px bg-white/40" aria-hidden="true" />
                {rejectModal.submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">Admin &middot; Approval Queue</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Institution <span className="font-serif italic text-red-600">Applications</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve workspace requests from institutions and training providers.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { value: 'pending', label: 'Pending', icon: Clock },
          { value: 'approved', label: 'Approved', icon: CheckCircle },
          { value: 'rejected', label: 'Rejected', icon: XCircle },
          { value: 'all', label: 'All', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              statusFilter === tab.value
                ? 'bg-rose-50 text-red-700 ring-1 ring-rose-200 shadow-sm'
                : 'bg-white/70 backdrop-blur text-gray-600 border border-rose-100 hover:border-rose-200 hover:bg-white shadow-sm'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-rose-50/60 rounded-lg h-10" />
            ))}
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">
            No {statusFilter === 'all' ? '' : statusFilter} <span className="font-serif italic text-red-600">applications</span>
          </h3>
          <p className="text-sm text-gray-500">
            {statusFilter === 'pending' ? 'No pending applications to review.' : 'No applications match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const style = statusStyles[app.status] || statusStyles.pending
            const isExpanded = expandedId === app.id
            const isLoading = actionLoading === app.id

            return (
              <div
                key={app.id}
                className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden hover:shadow-[0_16px_36px_-18px_rgba(225,29,72,0.45)] transition-shadow"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 truncate">{app.organisation_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                      <span>{orgTypeLabels[app.org_type] || app.org_type}</span>
                      {app.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.country}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {app.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-rose-50 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Contact</p>
                        <p className="text-sm text-gray-900">{app.full_name}</p>
                        {app.role_title && <p className="text-xs text-gray-500">{app.role_title}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Estimated Learners</p>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {app.learner_count || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-700 bg-rose-50/40 border border-rose-50 rounded-xl p-3 whitespace-pre-line">{app.description}</p>
                    </div>

                    {app.review_notes && (
                      <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <p className="text-xs font-medium text-emerald-700 mb-0.5">Review Notes</p>
                        <p className="text-sm text-emerald-900">{app.review_notes}</p>
                      </div>
                    )}

                    {app.rejection_reason && (
                      <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3">
                        <p className="text-xs font-medium text-red-700 mb-0.5">Rejection Reason</p>
                        <p className="text-sm text-red-900">{app.rejection_reason}</p>
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          onClick={() => showApproveConfirm(app)}
                          disabled={isLoading}
                          className="relative overflow-hidden bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(16,185,129,0.6)] ring-1 ring-emerald-500/50 transition-all hover:-translate-y-0.5"
                          size="sm"
                        >
                          <span className="absolute inset-x-2 top-0 h-px bg-white/40" aria-hidden="true" />
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                          Approve
                        </Button>
                        <Button
                          onClick={() => showRejectConfirm(app)}
                          disabled={isLoading}
                          variant="outline"
                          className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {app.status === 'approved' && app.institution_id && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Workspace provisioned
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
