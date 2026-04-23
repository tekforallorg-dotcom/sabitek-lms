'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Calendar,
  ChevronRight,
  Layers,
  GraduationCap,
  AlertCircle,
} from 'lucide-react'

interface Program {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  visibility: string
  start_date: string | null
  end_date: string | null
  created_at: string
  institution: {
    id: string
    name: string
    slug: string
  }
  cohort_count: number
}

interface Institution {
  id: string
  name: string
  slug: string
}

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  draft: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  active: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  completed: { dot: 'bg-blue-400', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  archived: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
}

function SabiBotLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              className="w-8 h-8"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: 'sabibotPulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <rect x="10" y="14" width="20" height="16" rx="4" fill="currentColor" opacity="0.9"/>
              <rect x="14" y="18" width="4" height="4" rx="1" fill="white"/>
              <rect x="22" y="18" width="4" height="4" rx="1" fill="white"/>
              <rect x="16" y="25" width="8" height="2" rx="1" fill="white"/>
              <line x1="20" y1="14" x2="20" y2="8" stroke="currentColor" strokeWidth="2" opacity="0.9"/>
              <circle cx="20" cy="7" r="2.5" fill="currentColor" opacity="0.9"/>
            </svg>
          ))}
        </div>
        <p className="text-gray-500 text-base font-medium">{message}</p>
        <style jsx>{`
          @keyframes sabibotPulse {
            0%, 100% { color: #f87171; opacity: 0.4; transform: scale(0.95); }
            50% { color: #ef4444; opacity: 1; transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ProgramsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirect=/institution/programs')
    }
  }, [authLoading, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const membershipRes = await fetch('/api/institutions/my-membership', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })

      if (!membershipRes.ok) {
        setError('You are not a member of any institution')
        setLoading(false)
        return
      }

      const membership = await membershipRes.json()
      setInstitution(membership.institution)

      const params = new URLSearchParams({
        institution_id: membership.institution.id,
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const programsRes = await fetch(`/api/programs?${params}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })

      if (programsRes.ok) {
        const data = await programsRes.json()
        setPrograms(data.programs || [])
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
      setError('Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (institution) {
      fetchData()
    }
  }, [search, statusFilter])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusStyle = (status: string) => {
    return statusColors[status] || statusColors.draft
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading programs..." />
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Programs</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Institution Found</h2>
            <p className="text-gray-600 mb-6">{error || 'You need to be part of an institution to manage programs.'}</p>
            <Link href="/institution/apply">
              <Button className="bg-red-600 hover:bg-red-700">Apply for Institution</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Programs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Programs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Programs</h1>
              <p className="text-gray-600 mt-1">Manage learning programs for {institution.name}</p>
            </div>
            <Link href="/institution/programs/create">
              <Button className="bg-red-600 hover:bg-red-700 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first program to start organizing courses and cohorts.
            </p>
            <Link href="/institution/programs/create">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Program
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const style = getStatusStyle(program.status)
              return (
                <Link
                  key={program.id}
                  href={`/institution/programs/${program.id}`}
                  className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <BookOpen className="w-6 h-6 text-red-600" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className="capitalize">{program.status}</span>
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {program.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {program.cohort_count} cohort{program.cohort_count !== 1 ? 's' : ''}
                    </span>
                    {program.start_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(program.start_date)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}