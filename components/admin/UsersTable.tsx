'use client'
import { AdminUserListItem } from '@/types'
import { MoreVertical, Shield, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface UsersTableProps {
  users: AdminUserListItem[]
  currentUserId: string
  onAction: (userId: string, action: string, reason?: string) => Promise<void>
  loading?: boolean
}

export default function UsersTable({ users, currentUserId, onAction, loading }: UsersTableProps) {
  const [actioningUserId, setActioningUserId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ userId: string; action: string } | null>(null)
  const [reason, setReason] = useState('')

  const handleActionClick = async (userId: string, action: string) => {
    // Actions that require reason
    if (['suspend', 'deactivate', 'delete'].includes(action)) {
      setPendingAction({ userId, action })
      setShowReasonModal(true)
      setOpenMenuId(null)
      return
    }

    // Actions that don't require reason
    setActioningUserId(userId)
    setOpenMenuId(null)
    await onAction(userId, action)
    setActioningUserId(null)
  }

  const handleSubmitWithReason = async () => {
    if (!pendingAction) return

    setActioningUserId(pendingAction.userId)
    await onAction(pendingAction.userId, pendingAction.action, reason)
    setActioningUserId(null)
    setShowReasonModal(false)
    setPendingAction(null)
    setReason('')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-50 text-green-700 ring-1 ring-green-100',
      suspended: 'bg-red-50 text-red-700 ring-1 ring-gray-200',
      deactivated: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 ring-1 ring-gray-200 rounded-full text-xs font-medium">
          <Shield className="w-3 h-3" />
          Super Admin
        </span>
      )
    }
    const styles = {
      learner: 'bg-red-50 text-red-600 ring-1 ring-gray-200',
      instructor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.learner}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6">
        <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-lg h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-12 text-center">
        <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-medium tracking-tight text-gray-900 mb-1">
          No users <span className="font-serif italic text-red-600">found</span>
        </h3>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200">
        <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isActioning = actioningUserId === user.id

                return (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role, user.is_super_admin)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_seen_at
                        ? formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isCurrentUser ? (
                        <span className="text-xs text-gray-400">(You)</span>
                      ) : isActioning ? (
                        <div className="flex justify-end">
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {openMenuId === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 py-2 z-20">
                                <button
                                  onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  View Profile
                                </button>
                                {user.status === 'active' && (
                                  <button
                                    onClick={() => handleActionClick(user.id, 'suspend')}
                                    className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                                  >
                                    Suspend User
                                  </button>
                                )}
                                {user.status === 'suspended' && (
                                  <button
                                    onClick={() => handleActionClick(user.id, 'activate')}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
                                  >
                                    Activate User
                                  </button>
                                )}
                                {user.status === 'active' && (
                                  <button
                                    onClick={() => handleActionClick(user.id, 'deactivate')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                  >
                                    Deactivate User
                                  </button>
                                )}
                                <hr className="my-2 border-gray-200" />
                                <button
                                  onClick={() => handleActionClick(user.id, 'delete')}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Delete User
                                </button>
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
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const isActioning = actioningUserId === user.id

            return (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {!isCurrentUser && !isActioning && (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {isActioning && (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {getRoleBadge(user.role, user.is_super_admin)}
                  {getStatusBadge(user.status)}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Last seen: {user.last_seen_at
                    ? formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })
                    : 'Never'}</p>
                  <p>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</p>
                </div>

                {/* Mobile Actions Menu */}
                {openMenuId === user.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-4 mt-2 w-48 bg-white rounded-xl border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Profile
                      </button>
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleActionClick(user.id, 'suspend')}
                          className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          Suspend User
                        </button>
                      )}
                      {user.status === 'suspended' && (
                        <button
                          onClick={() => handleActionClick(user.id, 'activate')}
                          className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Activate User
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleActionClick(user.id, 'deactivate')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Deactivate User
                        </button>
                      )}
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={() => handleActionClick(user.id, 'delete')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete User
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-6">
            <h3 className="text-lg font-medium tracking-tight text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for this action. This will be logged for audit purposes.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="w-full px-4 py-2 rounded-xl bg-white/70 border border-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setPendingAction(null)
                  setReason('')
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithReason}
                disabled={!reason.trim()}
                className="relative overflow-hidden px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-x-2 top-0 h-px bg-white/40" aria-hidden="true" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
