'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useTerminology } from '@/hooks/useTerminology'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import {
  Building2,
  Users,
  BookOpen,
  Settings,
  Plus,
  Mail,
  Globe,
  MapPin,
  CheckCircle,
  Check,
  Clock,
  AlertCircle,
  Layers,
  GraduationCap,
  X,
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  DollarSign,
  Shield,
  Activity,
  FileText,
  ArrowRight,
  Copy,
  Trash2,
  Link2,
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  country: string | null
  state: string | null
  status: string
  contact_email: string | null
  website: string | null
  logo_url: string | null
  created_at: string
  verified_at: string | null
  terminology_pack: Record<string, string> | null
  kpi_pack: { primary_metrics?: string[]; secondary_metrics?: string[]; chart_types?: string[] } | null
  reporting_pack: { format?: string; evidence_pack_enabled?: boolean } | null
}

interface InstitutionMember {
  id: string
  role: string
  status: string
  user: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

interface TeamInvite {
  id: string
  role: string
  email: string | null
  status: string
  use_count: number
  max_uses: number | null
  expires_at: string | null
  created_at: string
  invite_url: string
}

const ROLE_OPTIONS = [
  { value: 'institution_admin', label: 'Institution Admin', hint: 'Full access to settings, team, and reports' },
  { value: 'program_manager', label: 'Program Manager', hint: 'Manages programs, cohorts, and learners' },
  { value: 'facilitator', label: 'Facilitator', hint: 'Runs cohorts and supports learners day-to-day' },
  { value: 'instructor', label: 'Instructor', hint: 'Can create and manage courses' },
  { value: 'viewer', label: 'Viewer', hint: 'Read-only access to dashboards and reports' },
]

function roleLabel(role: string) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label || role.replace(/_/g, ' ')
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

/**
 * Returns vertical-specific KPI card definitions.
 * Each vertical sees different primary stats.
 */
function getVerticalStats(
  institution: Institution,
  memberCount: number,
  t: ReturnType<typeof useTerminology>
) {
  const type = institution.type

  // Base stats available for all types
  const baseStats = {
    members: { label: 'Team Members', value: memberCount as string | number, icon: Users },
    programs: { label: t.program_plural, value: 0 as string | number, icon: Layers },
    learners: { label: `Active ${t.learner_plural}`, value: 0 as string | number, icon: GraduationCap },
    certificates: { label: 'Certificates Issued', value: 0 as string | number, icon: CheckCircle },
    completion: { label: 'Completion Rate', value: '—' as string | number, icon: TrendingUp },
    compliance: { label: 'Compliance Score', value: '—' as string | number, icon: Shield },
    revenue: { label: 'Revenue / Cohort', value: '—' as string | number, icon: DollarSign },
    outcomes: { label: 'Outcomes Achieved', value: 0 as string | number, icon: Target },
    coverage: { label: 'Coverage Rate', value: '—' as string | number, icon: BarChart3 },
    satisfaction: { label: 'Satisfaction Score', value: '—' as string | number, icon: Activity },
  }

  // Return 4 stats per vertical type
  switch (type) {
    case 'school':
      return [baseStats.learners, baseStats.programs, baseStats.completion, baseStats.certificates]
    case 'ngo':
      return [baseStats.learners, baseStats.outcomes, baseStats.completion, baseStats.certificates]
    case 'government':
      return [baseStats.learners, baseStats.coverage, baseStats.compliance, baseStats.certificates]
    case 'company':
      return [baseStats.learners, baseStats.compliance, baseStats.completion, baseStats.certificates]
    case 'training_center':
      return [baseStats.learners, baseStats.programs, baseStats.completion, baseStats.satisfaction]
    default:
      return [baseStats.members, baseStats.programs, baseStats.learners, baseStats.certificates]
  }
}

/**
 * Returns vertical-specific quick action cards.
 */
function getVerticalActions(t: ReturnType<typeof useTerminology>, institutionType: string) {
  const actions = [
    { label: t.program_plural, href: '/institution/programs', icon: Layers },
    { label: t.cohort_plural, href: '/institution/cohorts', icon: Users },
    { label: t.course_plural, href: '/instructor', icon: BookOpen },
    { label: 'Course Library', href: '/institution/courses', icon: BookOpen },
    { label: 'Reports', href: '/institution/reports', icon: BarChart3 },
    { label: 'Settings', href: '/institution/settings', icon: Settings },
  ]

  return actions
}

export default function InstitutionDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [members, setMembers] = useState<InstitutionMember[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Terminology hook — labels adapt based on institution type
  const t = useTerminology(institution)

  // Onboarding checklist state
  const [checklistData, setChecklistData] = useState<{
    hasProgram: boolean
    hasCohort: boolean
    hasCourse: boolean
    hasLearner: boolean
    hasSettings: boolean
  } | null>(null)

  // Invite state (token invite API)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('instructor')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState<{ url: string; emailSent: boolean; email: string } | null>(null)
  const [invites, setInvites] = useState<TeamInvite[]>([])

  useEffect(() => {
    if (!authLoading && user) {
      fetchInstitutionData()
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirect=/institution/dashboard')
    }
  }, [authLoading, user])

  const fetchInvites = async (institutionId: string, token: string) => {
    try {
      const res = await fetch(`/api/institutions/${institutionId}/invites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        const payload = json.data || json
        setInvites(payload.invites || [])
      }
    } catch {
      // Non-critical: pending invites list is optional
    }
  }

  const fetchInstitutionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/institutions/my-membership', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        setError('You are not a member of any institution')
        setLoading(false)
        return
      }

      const result = await response.json()
      const membership = result.data || result

      // Viewers are read-only stakeholders (board, funders): send them
      // straight to Reports, they never see the management dashboard.
      if (membership.role === 'viewer') {
        router.replace('/institution/reports')
        return
      }

      setInstitution(membership.institution as Institution)
      setUserRole(membership.role)

      // Fetch onboarding checklist data
      try {
        const instId = membership.institution_id
        const token = session.access_token

        const [programsRes, cohortsRes] = await Promise.all([
          fetch(`/api/programs?institution_id=${instId}&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/cohorts?institution_id=${instId}&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const programsJson = programsRes.ok ? await programsRes.json() : {}
        const cohortsJson = cohortsRes.ok ? await cohortsRes.json() : {}

        const programsList = programsJson.data?.programs || programsJson.programs || []
        const cohortsList = cohortsJson.data?.cohorts || cohortsJson.cohorts || []

        const inst = membership.institution as Institution
        setChecklistData({
          hasProgram: programsList.length > 0,
          hasCohort: cohortsList.length > 0,
          hasCourse: false, // Will be true once courses are linked to institution
          hasLearner: false, // Updated below if members are fetched
          hasSettings: !!(inst.terminology_pack || inst.contact_email),
        })
      } catch {
        // Non-critical: checklist is optional
      }

      if (membership.role === 'institution_admin' || membership.role === 'program_manager') {
        const membersResponse = await fetch(`/api/institutions/${membership.institution_id}/members`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (membersResponse.ok) {
          const data = await membersResponse.json()
          const membersData = data.data?.members || data.members || []
          setMembers(membersData)
          setChecklistData((prev) => prev ? { ...prev, hasLearner: membersData.length > 1 } : prev)
        }
      }

      if (membership.role === 'institution_admin') {
        await fetchInvites(membership.institution_id, session.access_token)
      }
    } catch (err) {
      console.error('Error fetching institution:', err)
      setError('Failed to load institution data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution) return

    setInviting(true)
    setInviteError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const email = inviteEmail.trim()
      const body: Record<string, unknown> = { role: inviteRole }
      if (email) body.email = email

      const res = await fetch(`/api/institutions/${institution.id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create invite')
      }

      const payload = json.data || json
      const invite: TeamInvite | undefined = payload.invite
      const emailSent = !!payload.email_sent

      setInviteResult({ url: invite?.invite_url || '', emailSent, email })
      if (invite) {
        setInvites((prev) => [invite, ...prev.filter((i) => i.id !== invite.id)])
      }
      if (emailSent && email) {
        toast.success(`Invite emailed to ${email}`)
      } else {
        toast.success('Invite link created')
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setInviting(false)
    }
  }

  const copyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!institution) return
    const previous = invites
    setInvites((cur) => cur.filter((i) => i.id !== inviteId))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      const res = await fetch(`/api/institutions/${institution.id}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to revoke invite')
      toast.success('Invite revoked')
    } catch {
      setInvites(previous)
      toast.error('Failed to revoke invite')
    }
  }

  const openInviteModal = () => {
    setShowInviteModal(true)
    setInviteError('')
    setInviteResult(null)
    setInviteEmail('')
    setInviteRole('instructor')
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading dashboard..." />
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Institution</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
              No institution <span className="font-serif italic text-red-600">found</span>
            </h2>
            <p className="text-gray-600 mb-6">{error || 'You are not a member of any institution yet.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/institution/apply">
                <Button className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Institution
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = {
    pending: { color: 'bg-rose-50 text-rose-600 border border-rose-100', icon: Clock, label: 'Pending Approval' },
    approved: { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-rose-50 text-rose-600 border border-rose-100', icon: AlertCircle, label: 'Rejected' },
    suspended: { color: 'bg-gray-50 text-gray-500 border border-gray-100', icon: AlertCircle, label: 'Suspended' },
  }[institution.status] || { color: 'bg-gray-50 text-gray-500 border border-gray-100', icon: Clock, label: institution.status }

  const StatusIcon = statusBadge.icon
  const stats = getVerticalStats(institution, members.length, t)
  const quickActions = getVerticalActions(t, institution.type)
  const activeInvites = invites.filter((i) => i.status === 'active')

  const nameWords = institution.name.trim().split(/\s+/)
  const nameHead = nameWords.slice(0, -1).join(' ')
  const nameTail = nameWords[nameWords.length - 1]

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Sub-header bar */}
      <div className="bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">{t.dashboard_title}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-gray-900 font-medium">{institution.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header / hero */}
      <div className="relative overflow-hidden border-b border-rose-100">
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true"/>
        <div className="absolute -bottom-32 right-0 w-96 h-96 bg-rose-100/60 rounded-full blur-3xl pointer-events-none" aria-hidden="true"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-20 h-20 bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Building2 className="w-10 h-10 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
                {t.dashboard_title}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                  {nameHead && <>{nameHead}{' '}</>}
                  <span className="font-serif italic text-red-600">{nameTail}</span>
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-gray-600 capitalize mb-3">{institution.type.replace('_', ' ')}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {institution.state && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {institution.state}, {institution.country}
                  </span>
                )}
                {institution.contact_email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-red-500" />
                    {institution.contact_email}
                  </span>
                )}
                {institution.website && (
                  <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-red-600 hover:underline">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
            {userRole === 'institution_admin' && (
              <Link href="/institution/settings">
                <Button variant="outline" className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Persona onboarding checklist */}
        <div className="mb-8 empty:mb-0">
          <OnboardingChecklist persona="institution" />
        </div>

        {/* Pending Approval Notice */}
        {institution.status === 'pending' && (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 mb-8">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pending Approval</h3>
                <p className="text-gray-600 text-sm">
                  Your institution application is being reviewed. You&apos;ll be notified once it&apos;s approved.
                  This usually takes 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Notice */}
        {institution.status === 'rejected' && (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 mb-8">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Application Rejected</h3>
                <p className="text-gray-600 text-sm">
                  Unfortunately, your institution application was not approved.
                  Please contact support for more information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions — uses vertical terminology */}
        {institution.status === 'approved' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4 flex flex-col items-center gap-3 hover:-translate-y-0.5 hover:ring-rose-200 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className="w-6 h-6 text-red-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Onboarding Checklist ── */}
        {institution.status === 'approved' && checklistData && (() => {
          const steps = [
            { key: 'hasProgram', label: `Create your first ${t.program.toLowerCase()}`, href: '/institution/programs', done: checklistData.hasProgram },
            { key: 'hasCohort', label: `Set up a ${t.cohort.toLowerCase()}`, href: '/institution/cohorts', done: checklistData.hasCohort },
            { key: 'hasLearner', label: `Invite your first ${t.learner.toLowerCase()}`, href: '/institution/cohorts', done: checklistData.hasLearner },
            { key: 'hasSettings', label: 'Customize your workspace settings', href: '/institution/settings', done: checklistData.hasSettings },
          ]
          const completedCount = steps.filter((s) => s.done).length
          const allDone = completedCount === steps.length

          if (allDone) return null

          return (
            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 mb-8">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">Onboarding</p>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                    Get <span className="font-serif italic text-red-600">started</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Complete these steps to set up your workspace</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                  {completedCount}/{steps.length} done
                </span>
              </div>

              <div className="w-full bg-rose-50 rounded-full h-2 mb-5">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / steps.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => (
                  <Link
                    key={step.key}
                    href={step.href}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      step.done
                        ? 'bg-emerald-50/60 border-emerald-100'
                        : 'bg-white/70 border-rose-100 hover:border-rose-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {step.done ? (
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 font-serif italic text-sm text-red-600">
                          {index + 1}
                        </span>
                      )}
                      <span className={`text-sm font-medium ${step.done ? 'text-emerald-700 line-through' : 'text-gray-700'}`}>
                        {step.label}
                      </span>
                    </div>
                    {!step.done && <ArrowRight className="w-4 h-4 text-rose-300" />}
                  </Link>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Vertical-Aware Stats Grid */}
        {institution.status === 'approved' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reporting Format Badge — shows what kind of reports this vertical gets */}
        {institution.status === 'approved' && institution.reporting_pack?.format && (
          <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Reporting Format</span>
                  <p className="text-xs text-gray-500">
                    {institution.reporting_pack.format === 'DONOR' && 'Donor-ready reports with evidence packs'}
                    {institution.reporting_pack.format === 'ACADEMIC' && 'Academic reporting with grade distributions'}
                    {institution.reporting_pack.format === 'WORKFORCE' && 'Workforce compliance and readiness reports'}
                    {institution.reporting_pack.format === 'GOV_COMPLIANCE' && 'Government compliance and coverage reports'}
                    {institution.reporting_pack.format === 'GENERAL' && 'Standard completion and progress reports'}
                  </p>
                </div>
              </div>
              {institution.reporting_pack.evidence_pack_enabled && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Evidence Packs Enabled
                </span>
              )}
            </div>
          </div>
        )}

        {/* Team Members + Pending Invites */}
        {institution.status === 'approved' && (userRole === 'institution_admin' || userRole === 'program_manager') && (
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                Team <span className="font-serif italic text-red-600">members</span>
              </h2>
              {userRole === 'institution_admin' && (
                <Button
                  size="sm"
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  onClick={openInviteModal}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                  <Plus className="w-4 h-4 mr-1" />
                  Invite Member
                </Button>
              )}
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <p>No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/70 border border-rose-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-b from-red-500 to-rose-500 rounded-full flex items-center justify-center overflow-hidden">
                        {member.user.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold">
                            {member.user.full_name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.user.full_name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 capitalize">
                      {member.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending invites */}
            {userRole === 'institution_admin' && activeInvites.length > 0 && (
              <div className="mt-8 pt-6 border-t border-rose-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Pending invites</h3>
                <p className="text-xs text-gray-500 mb-4">Anyone with an active link can join your team in the selected role.</p>
                <div className="space-y-3">
                  {activeInvites.map((invite) => (
                    <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/70 border border-rose-100 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {invite.email ? (
                            <Mail className="w-5 h-5 text-red-500" />
                          ) : (
                            <Link2 className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {invite.email || 'Link invite'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                              {roleLabel(invite.role)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Uses: {invite.use_count}/{invite.max_uses ?? '∞'}
                            {invite.expires_at && (
                              <> · Expires {new Date(invite.expires_at).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => copyInviteLink(invite.invite_url)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white/70 backdrop-blur border border-rose-100 hover:border-red-200 hover:bg-red-50 rounded-full shadow-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invite team member modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                Invite team <span className="font-serif italic text-red-600">member</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {inviteResult.emailSent && inviteResult.email
                    ? `Invite emailed to ${inviteResult.email}`
                    : 'Invite link created'}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shareable invite link</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      readOnly
                      value={inviteResult.url}
                      onFocus={(e) => e.target.select()}
                      className="rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => copyInviteLink(inviteResult.url)}
                      className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 flex-shrink-0"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Anyone with this link can join as {roleLabel(inviteRole)}.
                  </p>
                </div>

                <div className="flex justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                    onClick={() => {
                      setInviteResult(null)
                      setInviteEmail('')
                      setInviteError('')
                    }}
                  >
                    Invite another
                  </Button>
                  <Button
                    type="button"
                    className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                    onClick={() => setShowInviteModal(false)}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                {inviteError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none text-sm cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {ROLE_OPTIONS.find((o) => o.value === inviteRole)?.hint}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      className="pl-10 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    We&apos;ll email them an invite link. Leave blank to just copy a shareable link.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                    {inviting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" />Create Invite</>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
