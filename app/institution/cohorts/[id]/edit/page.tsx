'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  AlertCircle,
  CheckCircle,
  Calendar,
  Key,
  Lock,
  Globe,
  ClipboardCheck,
  Hash,
  ArrowLeft,
} from 'lucide-react'

/* ── Types ── */

interface Cohort {
  id: string
  name: string
  description: string | null
  status: string
  enrollment_mode: string
  access_code: string | null
  start_date: string | null
  end_date: string | null
  seat_limit: number | null
  program: {
    id: string
    name: string
    slug: string
  }
}

/* ── SabiBot Loader ── */

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
              <rect x="10" y="14" width="20" height="16" rx="4" fill="currentColor" opacity="0.9" />
              <rect x="14" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="22" y="18" width="4" height="4" rx="1" fill="white" />
              <rect x="16" y="25" width="8" height="2" rx="1" fill="white" />
              <line x1="20" y1="14" x2="20" y2="8" stroke="currentColor" strokeWidth="2" opacity="0.9" />
              <circle cx="20" cy="7" r="2.5" fill="currentColor" opacity="0.9" />
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

/* ── Constants ── */

const statusOptions = [
  { value: 'draft', label: 'Draft', description: 'Not visible to learners' },
  { value: 'active', label: 'Active', description: 'Open for enrollment' },
  { value: 'closed', label: 'Closed', description: 'No new enrollments' },
  { value: 'archived', label: 'Archived', description: 'Hidden from view' },
]

const enrollmentModes = [
  { value: 'invite_only', label: 'Invite Only', icon: Lock, description: 'Only invited users can join' },
  { value: 'access_code', label: 'Access Code', icon: Key, description: 'Users need a code to join' },
  { value: 'approval_required', label: 'Approval Required', icon: ClipboardCheck, description: 'Users request to join, admin approves' },
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can join freely' },
]

/* ── Page ── */

export default function EditCohortPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const cohortId = params.id as string

  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [enrollmentMode, setEnrollmentMode] = useState('invite_only')
  const [accessCode, setAccessCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [seatLimit, setSeatLimit] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && cohortId) {
      fetchCohort()
    }
  }, [user, cohortId])

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  const fetchCohort = async () => {
    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch(`/api/cohorts/${cohortId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        router.push('/institution/cohorts')
        return
      }

      const json = await res.json()
      const data = json.data || json
      setCohort(data)

      // Populate form
      setName(data.name || '')
      setDescription(data.description || '')
      setStatus(data.status || 'draft')
      setEnrollmentMode(data.enrollment_mode || 'invite_only')
      setAccessCode(data.access_code || '')
      setStartDate(data.start_date ? data.start_date.split('T')[0] : '')
      setEndDate(data.end_date ? data.end_date.split('T')[0] : '')
      setSeatLimit(data.seat_limit?.toString() || '')
    } catch (err) {
      console.error('Error fetching cohort:', err)
      setError('Failed to load cohort')
    } finally {
      setLoading(false)
    }
  }

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAccessCode(code)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const session = await getSession()
      if (!session) return

      // Validation
      if (!name.trim()) {
        setError('Cohort name is required')
        setSaving(false)
        return
      }

      if (enrollmentMode === 'access_code' && !accessCode.trim()) {
        setError('Access code is required for this enrollment mode')
        setSaving(false)
        return
      }

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError('End date must be after start date')
        setSaving(false)
        return
      }

      const payload: Record<string, any> = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        enrollment_mode: enrollmentMode,
        access_code: enrollmentMode === 'access_code' ? accessCode.trim() : null,
        start_date: startDate || null,
        end_date: endDate || null,
        seat_limit: seatLimit ? parseInt(seatLimit, 10) : null,
      }

      const res = await fetch(`/api/cohorts/${cohortId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update cohort')
      }

      setSuccess('Cohort updated successfully!')

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/institution/cohorts/${cohortId}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cohort')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──
  if (authLoading || loading) {
    return <SabiBotLoader message="Loading cohort..." />
  }

  // ── Not found ──
  if (!cohort) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Edit Cohort</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">Cohort not found</h2>
            <Link href="/institution/cohorts" className="text-red-600 hover:underline text-sm">Back to Cohorts</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Sub-header */}
      <div className="bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Edit Cohort</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/institution/cohorts" className="hover:text-red-600 transition-colors">Cohorts</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/institution/cohorts/${cohort.id}`} className="hover:text-red-600 transition-colors truncate max-w-[100px]">{cohort.name}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Edit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link href={`/institution/cohorts/${cohort.id}`} className="p-2 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Cohort Settings</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Edit <span className="font-serif italic text-red-600">cohort</span></h1>
              <p className="text-gray-600 mt-1">Update settings for {cohort.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-700 text-sm">{success}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Cohort Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Spring 2026 Batch"
                  required
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this cohort..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 placeholder:text-gray-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Program
                </label>
                <div className="px-3 py-2 bg-rose-50/60 border border-rose-100 rounded-xl text-sm text-gray-600">
                  {cohort.program?.name || 'No program assigned'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Program cannot be changed after creation</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Status</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    status === opt.value
                      ? 'border-red-400 bg-rose-50 ring-1 ring-red-200'
                      : 'border-rose-100 bg-white/70 hover:border-rose-200'
                  }`}
                >
                  <div className={`font-medium text-sm ${status === opt.value ? 'text-red-700' : 'text-gray-900'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enrollment */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Enrollment Settings</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrollmentModes.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setEnrollmentMode(mode.value)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        enrollmentMode === mode.value
                          ? 'border-red-400 bg-rose-50 ring-1 ring-red-200'
                          : 'border-rose-100 bg-white/70 hover:border-rose-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${enrollmentMode === mode.value ? 'text-red-500' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-medium text-sm ${enrollmentMode === mode.value ? 'text-red-700' : 'text-gray-900'}`}>
                          {mode.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{mode.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {enrollmentMode === 'access_code' && (
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Access Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="e.g., SPRING2026"
                      className="font-mono rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateAccessCode} className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                      Generate
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  <Hash className="w-4 h-4 inline mr-1 text-red-500" />
                  Seat Limit
                </label>
                <Input
                  type="number"
                  value={seatLimit}
                  onChange={(e) => setSeatLimit(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of members allowed</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link href={`/institution/cohorts/${cohort.id}`}>
              <Button type="button" variant="outline" className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 gap-2"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
