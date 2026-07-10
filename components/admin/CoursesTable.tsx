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
      published: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
      draft: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
      archived: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
      intermediate: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
      advanced: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[difficulty as keyof typeof styles] || styles.beginner}`}>
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

  if (courses.length === 0) {
    return (
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">
          No courses <span className="font-serif italic text-red-600">found</span>
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
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const isActioning = actioningCourseId === course.id

                return (
                  <tr key={course.id} className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-16 h-10 object-cover rounded-lg ring-1 ring-rose-100"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-rose-300" />
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
                          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                            className="p-2 hover:bg-rose-50 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {openMenuId === course.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] py-2 z-20">
                                <button
                                  onClick={() => window.open(`/courses/${course.slug}`, '_blank')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-rose-50/60 transition-colors flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Course
                                </button>

                                {course.status === 'draft' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'publish')}
                                    className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Publish Course
                                  </button>
                                )}

                                {course.status === 'published' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'archive')}
                                    className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive Course
                                  </button>
                                )}

                                {course.status === 'archived' && (
                                  <button
                                    onClick={() => handleActionClick(course.id, 'unarchive')}
                                    className="w-full px-4 py-2 text-left text-sm text-sky-600 hover:bg-sky-50 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Unarchive Course
                                  </button>
                                )}

                                <hr className="my-2 border-rose-100" />
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
        <div className="md:hidden divide-y divide-rose-50">
          {courses.map((course) => {
            const isActioning = actioningCourseId === course.id

            return (
              <div key={course.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-20 h-14 object-cover rounded-lg ring-1 ring-rose-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-rose-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{course.instructor_name}</p>
                  </div>
                  {!isActioning && (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                      className="p-2 hover:bg-rose-50 rounded-full transition-colors flex-shrink-0"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  {isActioning && (
                    <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {getStatusBadge(course.status)}
                  {getDifficultyBadge(course.difficulty_level)}
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 ring-1 ring-gray-200 rounded-full text-xs font-semibold">
                    {course.enrollment_count} enrolled
                  </span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-600 ring-1 ring-rose-100 rounded-full text-xs font-semibold">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">
              Confirm <span className="font-serif italic text-red-600">action</span>
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for this action. This will be logged for audit purposes.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
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
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
