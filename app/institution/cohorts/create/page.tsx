'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  ChevronRight,
  Save,
  Loader2,
  Calendar,
  Lock,
  Globe,
  Key,
  ClipboardCheck,
  BookOpen,
  AlertCircle,
  Plus,
} from 'lucide-react'

interface Program {
  id: string
  name: string
  slug: string
  status: string
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

function CreateCohortForm() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProgramId = searchParams.get('program_id')

  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  const [name, setName] = useState('')
  const [programId, setProgramId] = useState(preselectedProgramId || '')
  const [enrollmentMode, setEnrollmentMode] = useState('invite_only')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [seatLimit, setSeatLimit] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchPrograms()
    }
  }, [user])

  const fetchPrograms = async () => {
    setLoading(true)
    setFetchError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Try API first
      const res = await fetch('/api/programs', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const result = await res.json()
        console.log('Programs API response:', result)
        
        // Handle different response formats
        let programsList: Program[] = []
        
        if (result.data?.programs) {
          programsList = result.data.programs
        } else if (result.data && Array.isArray(result.data)) {
          programsList = result.data
        } else if (result.programs) {
          programsList = result.programs
        } else if (Array.isArray(result)) {
          programsList = result
        }

        // Filter to only active/draft programs
        programsList = programsList.filter(p => p.status !== 'archived')
        
        setPrograms(programsList)
        
        if (preselectedProgramId) {
          setProgramId(preselectedProgramId)
        } else if (programsList.length === 1) {
          setProgramId(programsList[0].id)
        }
      } else {
        console.error('API error:', res.status)
        // Fallback: fetch directly from Supabase
        await fetchProgramsDirect(session.user.id)
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
      setFetchError('Failed to load programs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgramsDirect = async (userId: string) => {
    try {
      // Get user's institution memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('institution_members')
        .select('institution_id')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (membershipError) throw membershipError

      if (!memberships || memberships.length === 0) {
        setPrograms([])
        return
      }

      const institutionIds = memberships.map(m => m.institution_id)

      // Get programs for those institutions
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name, slug, status')
        .in('institution_id', institutionIds)
        .neq('status', 'archived')
        .order('name', { ascending: true })

      if (programsError) throw programsError

      setPrograms(programsData || [])
      
      if (preselectedProgramId) {
        setProgramId(preselectedProgramId)
      } else if (programsData?.length === 1) {
        setProgramId(programsData[0].id)
      }
    } catch (err) {
      console.error('Direct fetch error:', err)
      setFetchError('Failed to load programs. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          program_id: programId,
          name,
          enrollment_mode: enrollmentMode,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          seat_limit: seatLimit ? parseInt(seatLimit) : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create cohort')
      }

      const result = await res.json()
      const cohort = result.data || result
      router.push(`/institution/cohorts/${cohort.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cohort')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading..." />
  }

  // Show error state if fetch failed
  if (fetchError) {
    return (
      <>
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-red-500" />
                <span className="font-medium text-gray-900">Create Cohort</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/institution/cohorts" className="hover:text-red-600 transition-colors">Cohorts</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-900 font-medium">Create</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Cohort</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Programs</h3>
            <p className="text-gray-500 mb-6">{fetchError}</p>
            <Button onClick={() => fetchPrograms()} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (programs.length === 0) {
    return (
      <>
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-red-500" />
                <span className="font-medium text-gray-900">Create Cohort</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/institution/cohorts" className="hover:text-red-600 transition-colors">Cohorts</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-900 font-medium">Create</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Cohort</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs available</h3>
            <p className="text-gray-500 mb-6">You need to create a program before you can create cohorts.</p>
            <Link href="/institution/programs/create">
              <Button className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" />Create a Program First</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Create Cohort</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/institution/cohorts" className="hover:text-red-600 transition-colors">Cohorts</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Create</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Cohort</h1>
          <p className="text-gray-600 mt-1">Set up a new learner group for your program</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">{programs.length} program{programs.length !== 1 ? 's' : ''} available</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Name <span className="text-red-500">*</span></label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Cohort 1, January 2025 Batch" required />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Mode <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'invite_only', label: 'Invite Only', icon: Lock, desc: 'Only invited users can join' },
                    { value: 'access_code', label: 'Access Code', icon: Key, desc: 'Users join with a code' },
                    { value: 'approval_required', label: 'Approval Required', icon: ClipboardCheck, desc: 'Users apply, you approve' },
                    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
                  ].map((mode) => (
                    <label
                      key={mode.value}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        enrollmentMode === mode.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input type="radio" name="enrollmentMode" value={mode.value} checked={enrollmentMode === mode.value} onChange={(e) => setEnrollmentMode(e.target.value)} className="sr-only" />
                      <mode.icon className={`w-5 h-5 mt-0.5 ${enrollmentMode === mode.value ? 'text-red-500' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-medium text-sm ${enrollmentMode === mode.value ? 'text-red-700' : 'text-gray-900'}`}>{mode.label}</div>
                        <div className="text-sm text-gray-500">{mode.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Limit (optional)</label>
                <Input type="number" min="1" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} placeholder="Leave empty for unlimited" />
                <p className="text-sm text-gray-500 mt-1">Maximum number of learners who can join this cohort</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule (Optional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link href="/institution/cohorts"><Button type="button" variant="outline">Cancel</Button></Link>
            <Button type="submit" disabled={submitting || !name || !programId} className="bg-red-600 hover:bg-red-700">
              {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : (<><Save className="w-4 h-4 mr-2" />Create Cohort</>)}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

export default function CreateCohortPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<SabiBotLoader message="Loading..." />}>
        <CreateCohortForm />
      </Suspense>
    </div>
  )
}