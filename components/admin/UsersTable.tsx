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
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      deactivated: 'bg-gray-100 text-gray-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <Shield className="w-3 h-3" />
          Super Admin
        </span>
      )
    }
    const styles = {
      learner: 'bg-blue-100 text-blue-700',
      instructor: 'bg-orange-100 text-orange-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.learner}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No users found</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isActioning = actioningUserId === user.id

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-red-600">
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
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {openMenuId === user.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <button
                                  onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  View Profile
                                </button>
                                {user.status === 'active' && (
                                  <button
                                    onClick={() => handleActionClick(user.id, 'suspend')}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors"
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
                                <hr className="my-2" />
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
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-red-600">
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
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        View Profile
                      </button>
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleActionClick(user.id, 'suspend')}
                          className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors"
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
                      <hr className="my-2" />
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}