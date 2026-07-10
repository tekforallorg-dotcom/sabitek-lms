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

function PageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 -left-40 w-80 h-80 bg-rose-100/70 rounded-full blur-[100px]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at top, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 70%)',
        }}
      />
    </div>
  )
}

function SabiBotLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
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
      <div className="relative min-h-screen bg-[#fffcfb]">
        <PageBackdrop />
        <div className="relative bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Programs</span>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
              No institution <span className="font-serif italic text-red-600">found</span>
            </h2>
            <p className="text-gray-600 mb-6">{error || 'You need to be part of an institution to manage programs.'}</p>
            <Link href="/institution/apply">
              <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                Apply for Institution
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#fffcfb]">
      <PageBackdrop />
      <div className="relative bg-white/85 backdrop-blur border-b border-rose-100">
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

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Institution</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                Your learning <span className="font-serif italic text-red-600">programs</span>
              </h1>
              <p className="text-gray-600 mt-1">Manage learning programs for {institution.name}</p>
            </div>
            <Link href="/institution/programs/create">
              <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                <Plus className="w-4 h-4 mr-2" />
                Create Program
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/70 border border-rose-100 focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm cursor-pointer"
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
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-2">
              No programs <span className="font-serif italic text-red-600">yet</span>
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first program to start organizing courses and cohorts.
            </p>
            <Link href="/institution/programs/create">
              <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
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
                  className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 hover:shadow-[0_20px_40px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                      <BookOpen className="w-6 h-6 text-red-500" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className="capitalize">{program.status}</span>
                    </span>
                  </div>

                  <h3 className="font-semibold tracking-tight text-gray-900 mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">
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
