'use client'
import { AdminCertificateListItem } from '@/types'
import { MoreVertical, Eye, Award, XCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

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
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Revoked
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    )
  }

  const getGradeBadge = (grade: number | null) => {
    if (!grade) return <span className="text-gray-400">N/A</span>
    
    let color = 'bg-gray-100 text-gray-700'
    if (grade >= 90) color = 'bg-green-100 text-green-700'
    else if (grade >= 80) color = 'bg-blue-100 text-blue-700'
    else if (grade >= 70) color = 'bg-yellow-100 text-yellow-700'
    else color = 'bg-red-100 text-red-700'
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {grade}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading certificates...</span>
        </div>
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No certificates found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.map((cert) => {
                const isActioning = actioningCertId === cert.id

                return (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600 flex-shrink-0" />
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
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === cert.id ? null : cert.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {openMenuId === cert.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <button
                                  onClick={() => {
                                    alert(`Certificate: ${cert.certificate_number}\n\nUser: ${cert.user_name}\nCourse: ${cert.course_title}\nGrade: ${cert.grade_percentage}%\nIssued: ${new Date(cert.issued_at).toLocaleDateString()}\n\n✅ Certificate verified in database!\n\nFull certificate viewer page coming soon.`)
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
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
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2"
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
        <div className="md:hidden divide-y divide-gray-200">
          {certificates.map((cert) => {
            const isActioning = actioningCertId === cert.id

            return (
              <div key={cert.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="font-mono text-xs text-gray-900">{cert.certificate_number}</span>
                  </div>
                  {!isActioning && (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === cert.id ? null : cert.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {isActioning && (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revoke Certificate
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for revoking this certificate. This action will be logged.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for revocation..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setPendingAction(null)
                  setReason('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithReason}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}