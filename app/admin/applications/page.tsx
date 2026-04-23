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
  AlertCircle,
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

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  approved: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  rejected: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
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
          rejection_reason: reason || (action === 'reject' ? 'Application did not meet requirements' : undefined),
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
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Application',
      message: `Reject the application from ${app.organisation_name} (${app.email})? They will be notified.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        await handleReview(app.id, 'reject')
      },
    })
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

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-red-500" />
          Institution Applications
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No {statusFilter === 'all' ? '' : statusFilter} applications</h3>
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
                className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 truncate">{app.organisation_name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                      <span>{orgTypeLabels[app.org_type] || app.org_type}</span>
                      {app.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.country}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(app.created_at)}</span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
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
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{app.description}</p>
                    </div>

                    {app.review_notes && (
                      <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-0.5">Review Notes</p>
                        <p className="text-sm text-blue-900">{app.review_notes}</p>
                      </div>
                    )}

                    {app.rejection_reason && (
                      <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-red-700 mb-0.5">Rejection Reason</p>
                        <p className="text-sm text-red-900">{app.rejection_reason}</p>
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          onClick={() => showApproveConfirm(app)}
                          disabled={isLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                          size="sm"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                          Approve
                        </Button>
                        <Button
                          onClick={() => showRejectConfirm(app)}
                          disabled={isLoading}
                          variant="outline"
                          className="text-red-700 border-red-200 hover:bg-red-50 rounded-xl"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {app.status === 'approved' && app.institution_id && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
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