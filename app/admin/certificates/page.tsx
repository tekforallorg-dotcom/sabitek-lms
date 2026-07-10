'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminCertificateListItem } from '@/types'
import CertificatesTable from '@/components/admin/CertificatesTable'
import CertificateFilters from '@/components/admin/CertificateFilters'
import { Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'

export default function CertificatesManagementPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [certificates, setCertificates] = useState<AdminCertificateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  const limit = 20

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchCertificates()
    }
  }, [authLoading, userProfile, page, search, status])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        setError('Session expired. Please refresh the page.')
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append('search', search)
      if (status) params.append('status', status)

      const response = await fetch(`/api/admin/certificates?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.status === 401) {
        // Try to refresh session
        const { data: { session: newSession } } = await supabase.auth.refreshSession()
        if (newSession) {
          // Retry with new token
          const retryResponse = await fetch(`/api/admin/certificates?${params}`, {
            headers: {
              'Authorization': `Bearer ${newSession.access_token}`,
            },
          })
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setCertificates(data.certificates)
            setTotal(data.total)
            setTotalPages(data.totalPages)
            return
          }
        }
        throw new Error('Authentication failed. Please refresh the page.')
      }

      if (!response.ok) {
        throw new Error('Failed to fetch certificates')
      }

      const data = await response.json()
      setCertificates(data.certificates)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error fetching certificates:', err)
      setError('Failed to load certificates. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (certificateId: string, action: string, reason?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`/api/admin/certificates/${certificateId}`, {
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

      fetchCertificates()

      const actionMessages = {
        revoke: 'Certificate revoked successfully',
        unrevoke: 'Certificate restored successfully',
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
    setPage(1)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Admin Console</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Certificates <span className="font-serif italic text-red-600">management</span>
          </h1>
          <p className="text-gray-600 mt-1">Manage all issued certificates</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] text-gray-600">
          <Award className="w-5 h-5 text-red-600" />
          <span className="font-semibold">{total} certificates</span>
        </div>
      </div>

      {/* Filters */}
      <CertificateFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onClearFilters={handleClearFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Certificates Table */}
      <CertificatesTable
        certificates={certificates}
        onAction={handleAction}
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] px-6 py-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} certificates
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-full hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
