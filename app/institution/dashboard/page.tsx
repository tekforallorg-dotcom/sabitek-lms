'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useTerminology } from '@/hooks/useTerminology'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Clock,
  AlertCircle,
  Layers,
  ChevronRight,
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
    members: { label: 'Team Members', value: memberCount, icon: Users, color: 'bg-blue-100 text-blue-600' },
    programs: { label: t.program_plural, value: 0, icon: Layers, color: 'bg-emerald-100 text-emerald-600' },
    learners: { label: `Active ${t.learner_plural}`, value: 0, icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
    certificates: { label: 'Certificates Issued', value: 0, icon: CheckCircle, color: 'bg-orange-100 text-orange-600' },
    completion: { label: 'Completion Rate', value: '—', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    compliance: { label: 'Compliance Score', value: '—', icon: Shield, color: 'bg-red-100 text-red-600' },
    revenue: { label: 'Revenue / Cohort', value: '—', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
    outcomes: { label: 'Outcomes Achieved', value: 0, icon: Target, color: 'bg-teal-100 text-teal-600' },
    coverage: { label: 'Coverage Rate', value: '—', icon: BarChart3, color: 'bg-indigo-100 text-indigo-600' },
    satisfaction: { label: 'Satisfaction Score', value: '—', icon: Activity, color: 'bg-pink-100 text-pink-600' },
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
    { label: t.program_plural, href: '/institution/programs', icon: Layers, color: 'text-red-600 bg-red-50' },
    { label: t.cohort_plural, href: '/institution/cohorts', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: t.course_plural, href: '/instructor', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Settings', href: '/institution/settings', icon: Settings, color: 'text-gray-600 bg-gray-100' },
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

  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('learner')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      fetchInstitutionData()
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirect=/institution/dashboard')
    }
  }, [authLoading, user])

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
    } catch (err) {
      console.error('Error fetching institution:', err)
      setError('Failed to load institution data')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution) return

    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/institutions/${institution.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to invite member')
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('learner')
      fetchInstitutionData()
      setTimeout(() => {
        setShowInviteModal(false)
        setInviteSuccess('')
      }, 2000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading dashboard..." />
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Institution</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Institution Found</h2>
            <p className="text-gray-600 mb-6">{error || 'You are not a member of any institution yet.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/institution/apply">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Institution
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Approval' },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Rejected' },
    suspended: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Suspended' },
  }[institution.status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: institution.status }

  const StatusIcon = statusBadge.icon
  const stats = getVerticalStats(institution, members.length, t)
  const quickActions = getVerticalActions(t, institution.type)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-header bar */}
      <div className="bg-white border-b">
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

      {/* Gradient Hero */}
      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{institution.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-gray-600 capitalize mb-3">{institution.type.replace('_', ' ')}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {institution.state && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {institution.state}, {institution.country}
                  </span>
                )}
                {institution.contact_email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
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
                <Button variant="outline" className="border-gray-300 bg-white/80 hover:bg-white shadow-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Approval Notice */}
        {institution.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Pending Approval</h3>
                <p className="text-yellow-800 text-sm">
                  Your institution application is being reviewed. You&apos;ll be notified once it&apos;s approved.
                  This usually takes 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Notice */}
        {institution.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Application Rejected</h3>
                <p className="text-red-800 text-sm">
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
                className="bg-white rounded-xl shadow-sm border p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-gray-300 transition-all text-center group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
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
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Get Started</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Complete these steps to set up your workspace</p>
                </div>
                <span className="text-sm font-medium text-gray-500">{completedCount}/{steps.length}</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / steps.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                {steps.map((step) => (
                  <Link
                    key={step.key}
                    href={step.href}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      step.done
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {step.done ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${step.done ? 'text-emerald-700 line-through' : 'text-gray-700'}`}>
                        {step.label}
                      </span>
                    </div>
                    {!step.done && <ArrowRight className="w-4 h-4 text-gray-400" />}
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
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reporting Format Badge — shows what kind of reports this vertical gets */}
        {institution.status === 'approved' && institution.reporting_pack?.format && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
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
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium border border-emerald-200">
                  Evidence Packs Enabled
                </span>
              )}
            </div>
          </div>
        )}

        {/* Team Members — uses vertical terminology for invite CTA */}
        {institution.status === 'approved' && (userRole === 'institution_admin' || userRole === 'program_manager') && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              {userRole === 'institution_admin' && (
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setShowInviteModal(true)
                    setInviteError('')
                    setInviteSuccess('')
                    setInviteEmail('')
                    setInviteRole('viewer')
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Invite Member
                </Button>
              )}
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                        {member.user.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-red-600 font-medium">
                            {member.user.full_name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.user.full_name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium capitalize">
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="facilitator">{t.instructor}</option>
                  <option value="program_manager">Program Manager</option>
                  <option value="institution_admin">Institution Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting || !inviteEmail} className="bg-red-600 hover:bg-red-700">
                  {inviting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" />Send Invite</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}