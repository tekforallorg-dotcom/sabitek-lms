'use client'
import { AdminCourseListItem } from '@/types'
import { MoreVertical, Eye, Archive, Trash2, CheckCircle, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface CoursesTableProps {
  courses: AdminCourseListItem[]
  onAction: (courseId: string, action: string, reason?: string) => Promise<void>
  loading?: boolean
}

export default function CoursesTable({ courses, onAction, loading }: CoursesTableProps) {
  const [actioningCourseId, setActioningCourseId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ courseId: string; action: string } | null>(null)
  const [reason, setReason] = useState('')

  const handleActionClick = async (courseId: string, action: string) => {
    // Actions that require reason
    if (['archive', 'delete'].includes(action)) {
      setPendingAction({ courseId, action })
      setShowReasonModal(true)
      setOpenMenuId(null)
      return
    }

    // Actions that don't require reason
    setActioningCourseId(courseId)
    setOpenMenuId(null)
    await onAction(courseId, action)
    setActioningCourseId(null)
  }

  const handleSubmitWithReason = async () => {
    if (!pendingAction) return

    setActioningCourseId(pendingAction.courseId)
    await onAction(pendingAction.courseId, pendingAction.action, reason)
    setActioningCourseId(null)
    setShowReasonModal(false)
    setPendingAction(null)
    setReason('')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-gray-100 text-gray-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'bg-blue-100 text-blue-700',
      intermediate: 'bg-orange-100 text-orange-700',
      advanced: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[difficulty as keyof typeof styles] || styles.beginner}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    )
  }

  const formatPrice = (priceCents: number | null, isFree: boolean) => {
    if (isFree) return 'Free'
    if (!priceCents) return 'Free'
    return `$${(priceCents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading courses...</span>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No courses found</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => {
                const isActioning = actioningCourseId === course.id

                return (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{course.title}</p>
                          <p className="text-xs text-gray-500">{course.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{course.instructor_name}</p>
                      <p className="text-xs text-gray-500">{course.instructor_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getDifficultyBadge(course.difficulty_level)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {course.enrollment_count}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(course.price_cents, course.is_free)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isActioning ? (
                        <div className="flex justify-end">
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {openMenuId === course.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <button
                                  onClick={() => window.open(`/courses/${course.slug}`, '_blank')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Course
                                </button>
                                
                                {course.status === 'draft' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'publish')}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Publish Course
                                  </button>
                                )}
                                
                                {course.status === 'published' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'archive')}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-2"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive Course
                                  </button>
                                )}
                                
                                {course.status === 'archived' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'unarchive')}
                                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Unarchive Course
                                  </button>
                                )}
                                
                                <hr className="my-2" />
                                <button
                                  onClick={() => handleActionClick(course.id, 'delete')}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Course
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
          {courses.map((course) => {
            const isActioning = actioningCourseId === course.id

            return (
              <div key={course.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-20 h-14 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{course.instructor_name}</p>
                  </div>
                  {!isActioning && (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {isActioning && (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {getStatusBadge(course.status)}
                  {getDifficultyBadge(course.difficulty_level)}
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {course.enrollment_count} enrolled
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {formatPrice(course.price_cents, course.is_free)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500">
                  Created {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                </p>
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