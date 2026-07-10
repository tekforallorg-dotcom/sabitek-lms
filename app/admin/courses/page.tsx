'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminCourseListItem } from '@/types'
import CoursesTable from '@/components/admin/CoursesTable'
import CourseFilters from '@/components/admin/CourseFilters'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'

export default function CoursesManagementPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [courses, setCourses] = useState<AdminCourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [error, setError] = useState<string | null>(null)

  const limit = 20

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchCourses()
    }
  }, [authLoading, userProfile, page, search, status, difficulty])

  const fetchCourses = async () => {
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
      if (status) params.append('status', status)
      if (difficulty) params.append('difficulty', difficulty)

      const response = await fetch(`/api/admin/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      setCourses(data.courses)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (courseId: string, action: string, reason?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Action failed')
      }

      fetchCourses()
      
      const actionMessages = {
        publish: 'Course published successfully',
        archive: 'Course archived successfully',
        unarchive: 'Course unarchived successfully',
        delete: 'Course deleted successfully',
      }
      toast.success(actionMessages[action as keyof typeof actionMessages] || 'Action completed')
    } catch (err: any) {
      console.error('Action error:', err)
      toast.error(err.message || 'Failed to perform action')
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    setDifficulty('')
    setPage(1)
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
          <h1 className="text-3xl font-bold text-gray-900">Courses Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform courses and content</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="w-5 h-5" />
          <span className="font-semibold">{total} courses</span>
        </div>
      </div>

      {/* Filters */}
      <CourseFilters
        search={search}
        status={status}
        difficulty={difficulty}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDifficultyChange={setDifficulty}
        onClearFilters={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Courses Table */}
      <CoursesTable
        courses={courses}
        onAction={handleAction}
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} courses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}