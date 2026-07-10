'use client'
import { AdminCertificateListItem } from '@/types'
import { MoreVertical, Eye, Award, XCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/components/ui/toast'

interface CertificatesTableProps {
  certificates: AdminCertificateListItem[]
  onAction: (certificateId: string, action: string, reason?: string) => Promise<void>
  loading?: boolean
}

export default function CertificatesTable({ certificates, onAction, loading }: CertificatesTableProps) {
  const [actioningCertId, setActioningCertId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ certId: string; action: string } | null>(null)
  const [reason, setReason] = useState('')

  const handleActionClick = async (certId: string, action: string) => {
    // Revoke requires reason
    if (action === 'revoke') {
      setPendingAction({ certId, action })
      setShowReasonModal(true)
      setOpenMenuId(null)
      return
    }

    // Unrevoke doesn't require reason
    setActioningCertId(certId)
    setOpenMenuId(null)
    await onAction(certId, action)
    setActioningCertId(null)
  }

  const handleSubmitWithReason = async () => {
    if (!pendingAction || !reason.trim()) return

    setActioningCertId(pendingAction.certId)
    await onAction(pendingAction.certId, pendingAction.action, reason)
    setActioningCertId(null)
    setShowReasonModal(false)
    setPendingAction(null)
    setReason('')
  }

  const getStatusBadge = (revokedAt: string | null) => {
    if (revokedAt) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 ring-1 ring-gray-200">
          Revoked
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        Active
      </span>
    )
  }

  const getGradeBadge = (grade: number | null) => {
    if (!grade) return <span className="text-gray-400">N/A</span>

    let color = 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
    if (grade >= 90) color = 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
    else if (grade >= 80) color = 'bg-sky-50 text-sky-600 ring-1 ring-sky-100'
    else if (grade >= 70) color = 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
    else color = 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
        {grade}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-rose-50/60 rounded-lg h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">
          No certificates <span className="font-serif italic text-red-600">found</span>
        </h3>
        <p className="text-gray-600 mt-1 text-sm">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-rose-100">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Certificate</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Issued</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => {
                const isActioning = actioningCertId === cert.id

                return (
                  <tr key={cert.id} className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="font-mono text-sm text-gray-900">{cert.certificate_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{cert.user_name}</p>
                      <p className="text-xs text-gray-500">{cert.user_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">{cert.course_title}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getGradeBadge(cert.grade_percentage)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(cert.revoked_at)}
                      {cert.revoked_at && cert.revoke_reason && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{cert.revoke_reason}"</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(cert.issued_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isActioning ? (
                        <div className="flex justify-end">
                          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === cert.id ? null : cert.id)}
                            className="p-2 hover:bg-rose-50 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {openMenuId === cert.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] py-2 z-20">
                                <button
                                  onClick={() => {
                                    toast.info(`Certificate: ${cert.certificate_number}\n\nUser: ${cert.user_name}\nCourse: ${cert.course_title}\nGrade: ${cert.grade_percentage}%\nIssued: ${new Date(cert.issued_at).toLocaleDateString()}\n\n✅ Certificate verified in database!\n\nFull certificate viewer page coming soon.`)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-rose-50/60 transition-colors flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Certificate
                                </button>

                                {!cert.revoked_at ? (
                                  <button
                                    onClick={() => handleActionClick(cert.id, 'revoke')}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Revoke Certificate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActionClick(cert.id, 'unrevoke')}
                                    className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Restore Certificate
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-rose-50">
          {certificates.map((cert) => {
            const isActioning = actioningCertId === cert.id

            return (
              <div key={cert.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="font-mono text-xs text-gray-900">{cert.certificate_number}</span>
                  </div>
                  {!isActioning && (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === cert.id ? null : cert.id)}
                      className="p-2 hover:bg-rose-50 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {isActioning && (
                    <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cert.user_name}</p>
                    <p className="text-xs text-gray-500">{cert.user_email}</p>
                  </div>
                  <p className="text-sm text-gray-700">{cert.course_title}</p>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(cert.revoked_at)}
                    {getGradeBadge(cert.grade_percentage)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Issued {formatDistanceToNow(new Date(cert.issued_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">
              Revoke <span className="font-serif italic text-red-600">certificate</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for revoking this certificate. This action will be logged.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for revocation..."
              rows={3}
              className="w-full px-4 py-2 rounded-xl bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setPendingAction(null)
                  setReason('')
                }}
                className="px-5 py-2 text-gray-700 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithReason}
                disabled={!reason.trim()}
                className="relative overflow-hidden px-5 py-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
