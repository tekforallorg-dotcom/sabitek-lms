'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import SabiLoader from '@/components/ui/SabiLoader'
import { Input } from '@/components/ui/input'
import { BellRing,
  Users,
  ChevronRight,
  Calendar,
  Edit,
  UserPlus,
  Mail,
  MoreVertical,
  Trash2,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Settings,
  Key,
  Copy,
  Lock,
  Globe,
  ClipboardCheck,
  Loader2,
  Search,
  Target,
  Hash,
  XCircle,
  ShieldCheck,
  Link2,
  QrCode,
  Download,
  Info,
  Zap,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react'

/* ── Types ── */

interface Cohort {
  id: string
  name: string
  status: string
  enrollment_mode: string
  access_code: string | null
  start_date: string | null
  end_date: string | null
  seat_limit: number | null
  created_at: string
  program: {
    id: string
    name: string
    slug: string
    institution_id: string
  }
  member_count: number
}

interface CohortMember {
  id: string
  user_id: string
  status: string
  sponsorship: string
  progress_pct: number
  last_activity_at?: string | null
  joined_at: string | null
  invited_at: string | null
  applied_at: string | null
  user: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

interface CohortInvite {
  id: string
  token: string
  type: string
  status: 'ACTIVE' | 'REVOKED' | 'EXHAUSTED'
  expires_at: string | null
  max_uses: number | null
  use_count: number
  created_at: string
  created_by: string
  revoked_at: string | null
  revoked_by: string | null
  revoke_reason: string | null
  metadata: Record<string, unknown> | null
  join_url: string
  is_usable: boolean
  creator?: { id: string; full_name: string; email: string } | null
}

interface BulkResult {
  email: string
  status: 'invited' | 'already_member' | 'not_found' | 'seat_limit' | 'error'
  message: string
}

interface BulkSummary {
  total: number
  invited: number
  already_member: number
  not_found: number
  seat_limit: number
  errors: number
}

/* ── Status configs ── */

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  draft: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  active: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  closed: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  archived: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
}

const memberStatusColors: Record<string, { dot: string; bg: string; text: string }> = {
  active: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  invited: { dot: 'bg-rose-400', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700' },
  pending_approval: { dot: 'bg-rose-400', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700' },
  removed: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  withdrawn: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  completed: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
}

const enrollmentModeLabels: Record<string, { icon: React.ReactNode; label: string }> = {
  invite_only: { icon: <Lock className="w-4 h-4" />, label: 'Invite Only' },
  access_code: { icon: <Key className="w-4 h-4" />, label: 'Access Code' },
  approval_required: { icon: <ClipboardCheck className="w-4 h-4" />, label: 'Approval Required' },
  public: { icon: <Globe className="w-4 h-4" />, label: 'Public' },
}

const enrollmentModeExplainer: Record<string, string> = {
  invite_only: 'Only people with this invite link can join. Links can be revoked anytime.',
  access_code: 'Anyone with this link joins immediately - no admin approval needed.',
  approval_required: 'People who click the link submit a join request. You approve or reject each one.',
  public: 'This cohort is open - the link gives learners a direct path to join.',
}

const statusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'invited', label: 'Invited' },
  { value: 'completed', label: 'Completed' },
  { value: 'removed', label: 'Removed' },
]

/* ── Shared button styles ── */

const primaryBtn = 'relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5'
const secondaryBtn = 'bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm'

function BtnSheen() {
  return <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
}

/* ── CSV parser helper ── */

function parseEmailsFromCSV(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex) || []
  // Deduplicate and lowercase
  return [...new Set(matches.map((e) => e.toLowerCase().trim()))]
}

/* ── Page ── */

function CohortDetailPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const cohortId = params.id as string
  const initialTab = searchParams.get('tab') || 'overview'

  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [members, setMembers] = useState<CohortMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Invite Learners panel state ──
  const [invites, setInvites] = useState<CohortInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [inviteTab, setInviteTab] = useState<'link' | 'qr' | 'csv'>('link')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [selectedQrInviteId, setSelectedQrInviteId] = useState<string | null>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)

  // ── CSV bulk invite state ──
  const [csvEmails, setCsvEmails] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null)
  const [bulkSummary, setBulkSummary] = useState<BulkSummary | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // ── Confirm dialog state ──
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && cohortId) {
      fetchCohort()
      fetchMembers()
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
      const cohortData = json.data || json
      setCohort(cohortData)
    } catch (error: unknown) {
      console.error('Error fetching cohort:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const session = await getSession()
      if (!session) return

      const urlParams = new URLSearchParams()
      if (memberSearch) urlParams.set('search', memberSearch)

      const res = await fetch(`/api/cohorts/${cohortId}/members?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.ok) {
        const json = await res.json()
        const membersData = json.data?.members || json.members || []
        setMembers(membersData)
      }
    } catch (error: unknown) {
      console.error('Error fetching members:', error)
    }
  }

  useEffect(() => {
    if (user && cohortId) {
      const timer = setTimeout(() => { fetchMembers() }, 300)
      return () => clearTimeout(timer)
    }
  }, [memberSearch])

  useEffect(() => {
    if (user && cohortId && activeTab === 'invite') {
      fetchInvites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cohortId, activeTab])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviting(true)

    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch(`/api/cohorts/${cohortId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: inviteEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to invite member')
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchMembers()
      fetchCohort()
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  const handleMemberAction = async (memberId: string, action: 'approve' | 'reject' | 'remove', reason?: string) => {
    setActionLoading(memberId)
    setOpenMemberMenu(null)

    try {
      const session = await getSession()
      if (!session) return

      const body: Record<string, string> = { action }
      if (reason) body.reason = reason

      const res = await fetch(`/api/cohorts/${cohortId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error(`Failed to ${action} member:`, data.error)
        return
      }

      fetchMembers()
      fetchCohort()
    } catch (error: unknown) {
      console.error(`Error performing ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    showConfirm(
      'Remove Member',
      'Are you sure you want to remove this member from the cohort? They will lose access to all program content.',
      async () => {
        closeConfirm()
        await handleMemberAction(memberId, 'remove', 'Removed by administrator')
      }
    )
  }

  const handleApproveMember = async (memberId: string) => {
    await handleMemberAction(memberId, 'approve')
  }

  const handleRejectMember = (memberId: string) => {
    showConfirm(
      'Reject Application',
      'Are you sure you want to reject this application? The learner will be notified.',
      async () => {
        closeConfirm()
        await handleMemberAction(memberId, 'reject', 'Application rejected')
      }
    )
  }

  /* ── Invite Learners handlers ── */

  const fetchInvites = async () => {
    setInvitesLoading(true)
    try {
      const session = await getSession()
      if (!session) return
      const res = await fetch(`/api/cohorts/${cohortId}/invites?status=ACTIVE&limit=50`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setInvites([]); return }
      const json = await res.json()
      const list: CohortInvite[] = json.data?.invites || json.invites || []
      setInvites(list)
      if (list.length > 0 && !selectedQrInviteId) {
        setSelectedQrInviteId(list[0].id)
      }
    } catch (err) {
      console.error('Error fetching invites:', err)
      setInvites([])
    } finally {
      setInvitesLoading(false)
    }
  }

  const handleGenerateInvite = async () => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const session = await getSession()
      if (!session) return
      const res = await fetch(`/api/cohorts/${cohortId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ type: 'LINK' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate invite link')
      }
      const json = await res.json()
      const newInvite: CohortInvite = json.data || json
      setInvites((prev) => [newInvite, ...prev])
      setSelectedQrInviteId(newInvite.id)
      try {
        await navigator.clipboard.writeText(newInvite.join_url)
        setCopiedInviteId(newInvite.id)
        setTimeout(() => setCopiedInviteId(null), 2000)
      } catch { /* clipboard denied */ }
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyInvite = async (invite: CohortInvite) => {
    try {
      await navigator.clipboard.writeText(invite.join_url)
      setCopiedInviteId(invite.id)
      setTimeout(() => setCopiedInviteId(null), 2000)
    } catch (err) { console.error('Clipboard error:', err) }
  }

  const handleRevokeInvite = (inviteId: string) => {
    showConfirm(
      'Revoke Invite Link',
      "Revoke this invite link? Anyone who hasn't joined yet won't be able to use it.",
      async () => {
        closeConfirm()
        setRevokingId(inviteId)
        try {
          const session = await getSession()
          if (!session) return
          const res = await fetch(`/api/cohorts/${cohortId}/invites/${inviteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            console.error('Revoke failed:', data.error)
            return
          }
          setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
          if (selectedQrInviteId === inviteId) setSelectedQrInviteId(null)
        } catch (err) { console.error('Error revoking invite:', err) }
        finally { setRevokingId(null) }
      }
    )
  }

  const handleDownloadQR = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const selected = invites.find((inv) => inv.id === selectedQrInviteId)
    const tail = selected ? selected.token.slice(0, 8) : 'invite'
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `cohort-invite-${tail}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* ── CSV Bulk Invite handlers ── */

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvError(null)
    setBulkResults(null)
    setBulkSummary(null)

    if (!file.name.match(/\.(csv|txt)$/i)) {
      setCsvError('Please upload a .csv or .txt file')
      return
    }

    if (file.size > 1024 * 1024) {
      setCsvError('File is too large. Maximum 1MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const emails = parseEmailsFromCSV(text)
      if (emails.length === 0) {
        setCsvError('No valid email addresses found in the file')
        return
      }
      if (emails.length > 200) {
        setCsvError(`Found ${emails.length} emails. Maximum 200 per batch.`)
        return
      }
      setCsvEmails(emails)
      setCsvFileName(file.name)
    }
    reader.onerror = () => {
      setCsvError('Failed to read the file')
    }
    reader.readAsText(file)

    // Reset the input so same file can be re-selected
    e.target.value = ''
  }

  const handleCSVClear = () => {
    setCsvEmails([])
    setCsvFileName(null)
    setCsvError(null)
    setBulkResults(null)
    setBulkSummary(null)
  }

  const handleCSVRemoveEmail = (emailToRemove: string) => {
    setCsvEmails((prev) => prev.filter((e) => e !== emailToRemove))
  }

  const handleCSVSubmit = async () => {
    if (csvEmails.length === 0) return
    setCsvUploading(true)
    setCsvError(null)

    try {
      const session = await getSession()
      if (!session) return

      const res = await fetch(`/api/cohorts/${cohortId}/members/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ emails: csvEmails }),
      })

      const json = await res.json().catch(() => ({}))
      const payload = json.data || json

      if (!res.ok) {
        throw new Error(payload.error || 'Bulk invite failed')
      }

      setBulkResults(payload.results || [])
      setBulkSummary(payload.summary || null)
      fetchMembers()
      fetchCohort()
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Bulk invite failed')
    } finally {
      setCsvUploading(false)
    }
  }

/* ── Export Members CSV ── */

  const handleExportCSV = () => {
    const rows = filteredMembers.map((m) => ({
      name: m.user.full_name || 'Unknown',
      email: m.user.email,
      status: m.status,
      progress: m.progress_pct || 0,
      joined: m.joined_at || m.invited_at || m.applied_at || '',
    }))

    const header = 'Name,Email,Status,Progress (%),Date\n'
    const csv = header + rows.map((r) =>
      `"${r.name}","${r.email}","${r.status}",${r.progress},"${r.joined ? new Date(r.joined).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}"`
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cohort?.name || 'cohort'}-members-${statusFilter}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatInviteExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return 'No expiry'
    const expiry = new Date(expiresAt)
    const now = new Date()
    if (expiry < now) return 'Expired'
    const diffMs = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return 'Expires today'
    if (diffDays < 30) return `Expires in ${diffDays} days`
    return `Expires ${expiry.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const copyAccessCode = () => {
    if (cohort?.access_code) navigator.clipboard.writeText(cohort.access_code)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getStatusStyle = (status: string) => statusColors[status] || statusColors.draft
  const getMemberStatusStyle = (status: string) => memberStatusColors[status] || memberStatusColors.active

  const isAtRisk = (m: CohortMember) =>
    m.status === 'active' &&
    (m.progress_pct || 0) < 100 &&
    (!m.last_activity_at || Date.now() - new Date(m.last_activity_at).getTime() > 14 * 24 * 60 * 60 * 1000)

  const [nudging, setNudging] = useState<string | null>(null)
  const handleNudge = async (memberId: string) => {
    try {
      setNudging(memberId)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`/api/cohorts/${cohortId}/members/${memberId}/nudge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) toast.success('Nudge sent')
      else toast.error('Could not send nudge')
    } catch {
      toast.error('Could not send nudge')
    } finally {
      setNudging(null)
    }
  }

  const filteredMembers = statusFilter === 'all'
    ? members
    : members.filter((m) => m.status === statusFilter)

  const pendingCount = members.filter((m) => m.status === 'pending_approval').length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
        <SabiLoader text="Loading cohort..." size="lg" />
      </div>
    )
  }

  if (!cohort) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Cohort</span>
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

  const cohortStatusStyle = getStatusStyle(cohort.status)
  const enrollMode = enrollmentModeLabels[cohort.enrollment_mode] || enrollmentModeLabels.invite_only

  const bulkResultStatusStyle: Record<string, { bg: string; text: string }> = {
    invited: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    already_member: { bg: 'bg-gray-50', text: 'text-gray-600' },
    not_found: { bg: 'bg-amber-50', text: 'text-amber-700' },
    seat_limit: { bg: 'bg-rose-50', text: 'text-rose-700' },
    error: { bg: 'bg-rose-50', text: 'text-rose-700' },
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* ── Sub-header ── */}
      <div className="bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Cohort Details</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/institution/cohorts" className="hover:text-red-600 transition-colors">Cohorts</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium truncate max-w-[120px]">{cohort.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Cohort Details</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_12px_30px_-15px_rgba(225,29,72,0.6)]">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span>The <span className="font-serif italic text-red-600">{cohort.name}</span> cohort</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cohortStatusStyle.bg} ${cohortStatusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cohortStatusStyle.dot}`} />
                  <span className="capitalize">{cohort.status}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  {enrollMode.icon}{enrollMode.label}
                </span>
                <Link href={`/institution/programs/${cohort.program.id}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
                  <BookOpen className="w-4 h-4" />{cohort.program.name}
                </Link>
              </div>
            </div>
            <Link href={`/institution/cohorts/${cohort.id}/edit`}>
              <Button variant="outline" className={secondaryBtn}>
                <Edit className="w-4 h-4 mr-2" />Edit Cohort
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1.5 p-1 bg-rose-50/70 border border-rose-100 rounded-full w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Settings, badge: null as number | null },
            { id: 'members', label: 'Members', icon: Users, badge: members.length > 0 ? members.length : null },
            { id: 'invite', label: 'Invite Learners', icon: UserPlus, badge: invites.length > 0 ? invites.length : null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-red-600 shadow-sm ring-1 ring-rose-100' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id ? 'bg-rose-50 text-red-600' : 'bg-white/70 text-gray-500'
                }`}>{tab.badge}</span>
              )}
              {tab.id === 'members' && pendingCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {pendingCount} pending
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Users, value: cohort.member_count ?? members.length, label: 'Members' },
                  { icon: Hash, value: cohort.seat_limit || '∞', label: 'Seat Limit' },
                  { icon: CheckCircle, value: members.filter(m => m.status === 'completed').length, label: 'Completed' },
                  { icon: Target, value: `${members.length > 0 ? Math.round(members.reduce((acc, m) => acc + (m.progress_pct || 0), 0) / members.length) : 0}%`, label: 'Avg Progress' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
                    <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mb-3">
                      <stat.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />Schedule
                </h3>
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Start Date</div>
                    <div className="font-medium text-gray-900">{formatDate(cohort.start_date)}</div>
                  </div>
                  <div className="w-px h-10 bg-rose-100" />
                  <div>
                    <div className="text-sm text-gray-500 mb-1">End Date</div>
                    <div className="font-medium text-gray-900">{formatDate(cohort.end_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {cohort.enrollment_mode === 'access_code' && cohort.access_code && (
                <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-red-500" />Access Code
                  </h3>
                  <div className="bg-rose-50/60 rounded-xl p-4 flex items-center justify-between border border-rose-100">
                    <code className="text-lg font-mono font-bold text-gray-900">{cohort.access_code}</code>
                    <Button variant="ghost" size="sm" onClick={copyAccessCode} className="rounded-full hover:bg-rose-50"><Copy className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Share this code with learners to let them join</p>
                </div>
              )}
              <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-red-500" />Quick Invite
                </h3>
                <form onSubmit={handleInvite} className="space-y-3">
                  {inviteError && (
                    <div className="text-sm text-red-600 flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-2 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="text-sm text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />{inviteSuccess}
                    </div>
                  )}
                  <Input type="email" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                  <Button type="submit" disabled={inviting || !inviteEmail} className={`w-full ${primaryBtn}`}>
                    <BtnSheen />
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" />Send Invite</>}
                  </Button>
                </form>
              </div>
              {pendingCount > 0 && (
                <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-red-500" />
                    Pending Approvals
                    <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-semibold">{pendingCount}</span>
                  </h3>
                  <div className="space-y-3">
                    {members.filter((m) => m.status === 'pending_approval').slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-red-600 text-xs font-semibold">{member.user.full_name?.charAt(0) || 'U'}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{member.user.full_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 truncate">{member.user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button onClick={() => handleApproveMember(member.id)} disabled={actionLoading === member.id} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50" title="Approve">
                            {actionLoading === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleRejectMember(member.id)} disabled={actionLoading === member.id} className="p-1.5 rounded-lg text-red-600 hover:bg-rose-50 transition-colors disabled:opacity-50" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingCount > 5 && (
                      <button onClick={() => { setActiveTab('members'); setStatusFilter('pending_approval') }} className="text-sm text-red-600 hover:text-red-700 font-medium">
                        View all {pendingCount} pending
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search members..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {statusFilterOptions.map((opt) => {
                    const count = opt.value === 'all' ? members.length : members.filter((m) => m.status === opt.value).length
                    if (count === 0 && opt.value !== 'all') return null
                    return (
                      <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === opt.value ? 'bg-white text-red-600 shadow-sm ring-1 ring-rose-100 border border-transparent' : 'bg-rose-50/70 text-gray-500 border border-rose-100 hover:text-gray-800'}`}
                      >
                        {opt.label}<span className="ml-1 opacity-70">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {members.length > 0 && (
                  <Button variant="outline" onClick={handleExportCSV} className={secondaryBtn}>
                    <Download className="w-4 h-4 mr-2" />Export CSV
                  </Button>
                )}
                <Button onClick={() => setActiveTab('invite')} className={primaryBtn}>
                  <BtnSheen />
                  <UserPlus className="w-4 h-4 mr-2" />Invite Members
                </Button>
              </div>
            </div>
            {filteredMembers.length === 0 ? (
              <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-12 text-center">
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-red-500" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ')} members` : 'No members yet'}</h3>
                <p className="text-gray-500 mb-4">{statusFilter !== 'all' ? 'Try a different filter or invite new members' : 'Invite learners to join this cohort'}</p>
                {statusFilter !== 'all' && <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')} className={secondaryBtn}>Show all members</Button>}
              </div>
            ) : (
              <div className="relative bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-rose-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Member</th>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
                        <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="text-right px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => {
                        const mStyle = getMemberStatusStyle(member.status)
                        const isLoading = actionLoading === member.id
                        const displayDate = member.joined_at || member.invited_at || member.applied_at
                        return (
                          <tr key={member.id} className="border-b border-rose-50 hover:bg-rose-50/40">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {member.user.avatar_url ? <img src={member.user.avatar_url} alt={member.user.full_name} className="w-10 h-10 rounded-full object-cover" /> : <span className="text-red-600 font-medium">{member.user.full_name?.charAt(0) || 'U'}</span>}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{member.user.full_name || 'Unknown'}</div>
                                  <div className="text-sm text-gray-500 truncate">{member.user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${mStyle.bg} ${mStyle.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${mStyle.dot}`} />
                                  <span className="capitalize">{member.status.replace('_', ' ')}</span>
                                </span>
                                {isAtRisk(member) && (
                                  <span
                                    title="No learning activity in 14+ days"
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 border border-amber-100 text-amber-700"
                                  >
                                    at risk
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {member.status === 'active' || member.status === 'completed' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-rose-50 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${(member.progress_pct || 0) >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-400'}`} style={{ width: `${member.progress_pct || 0}%` }} />
                                  </div>
                                  <span className="text-sm text-gray-600">{member.progress_pct || 0}%</span>
                                </div>
                              ) : <span className="text-sm text-gray-400">-</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{displayDate ? new Date(displayDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td className="px-6 py-4 text-right">
                              {member.status === 'pending_approval' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button size="sm" variant="outline" onClick={() => handleApproveMember(member.id)} disabled={isLoading} className="h-8 gap-1 text-xs font-semibold rounded-full text-emerald-700 border-emerald-200 bg-white/70 hover:bg-emerald-50 shadow-sm">
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectMember(member.id)} disabled={isLoading} className="h-8 gap-1 text-xs font-semibold rounded-full text-red-700 border-rose-200 bg-white/70 hover:bg-rose-50 shadow-sm">
                                    <XCircle className="w-3.5 h-3.5" />Reject
                                  </Button>
                                </div>
                              ) : ['active', 'invited'].includes(member.status) && (
                                <div className="inline-flex items-center gap-1.5">
                                  {isAtRisk(member) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleNudge(member.id)}
                                      disabled={nudging === member.id}
                                      className="h-8 gap-1 text-xs font-semibold rounded-full text-amber-700 border-amber-200 bg-white/70 hover:bg-amber-50 shadow-sm cursor-pointer"
                                    >
                                      {nudging === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                                      Nudge
                                    </Button>
                                  )}
                                <div className="relative inline-block">
                                  <Button variant="ghost" size="sm" onClick={() => setOpenMemberMenu(openMemberMenu === member.id ? null : member.id)} disabled={isLoading} className="rounded-full hover:bg-rose-50">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                                  </Button>
                                  {openMemberMenu === member.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur rounded-xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] py-1 z-10">
                                      <button onClick={() => handleRemoveMember(member.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-rose-50 w-full text-left">
                                        <Trash2 className="w-4 h-4" />Remove Member
                                      </button>
                                    </div>
                                  )}
                                </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Confirm Dialog ── */}
        <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={closeConfirm} title={confirmDialog.title} message={confirmDialog.message} type="confirm"
          actions={[
            { label: 'Cancel', onClick: closeConfirm, variant: 'secondary' },
            { label: 'Confirm', onClick: confirmDialog.onConfirm, variant: 'danger' },
          ]}
        />

        {/* ── Invite Learners Tab ── */}
        {activeTab === 'invite' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-white/85 backdrop-blur border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_12px_30px_-15px_rgba(225,29,72,0.6)]">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold tracking-tight text-gray-900">Invite <span className="font-serif italic text-red-600">learners</span></h2>
                  <p className="text-sm text-gray-600 mt-0.5 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{enrollmentModeExplainer[cohort.enrollment_mode] || enrollmentModeExplainer.invite_only}</span>
                  </p>
                </div>
              </div>
            </div>

            {cohort.status === 'archived' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">This cohort is archived. You cannot invite new members.</div>
              </div>
            )}

            <div className="relative bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              {/* ── Sub-tab switcher (Link / QR / CSV) ── */}
              <div className="px-5 pt-5 sm:px-6">
                <div className="flex items-center gap-1.5 p-1 bg-rose-50/70 border border-rose-100 rounded-full w-fit">
                  {[
                    { id: 'link' as const, icon: Link2, label: 'Share Link' },
                    { id: 'qr' as const, icon: QrCode, label: 'QR Code' },
                    { id: 'csv' as const, icon: FileSpreadsheet, label: 'CSV Upload' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setInviteTab(tab.id)}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        inviteTab === tab.id
                          ? 'bg-white text-red-600 shadow-sm ring-1 ring-rose-100'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── LINK SUB-TAB ── */}
              {inviteTab === 'link' && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Generate a new invite link</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Links can be revoked anytime. Default: no expiry, unlimited uses.</p>
                    </div>
                    <Button onClick={handleGenerateInvite} disabled={generating || cohort.status === 'archived'} className={`flex-shrink-0 ${primaryBtn}`}>
                      <BtnSheen />
                      {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Zap className="w-4 h-4 mr-2" />Generate Link</>}
                    </Button>
                  </div>
                  {generateError && (
                    <div className="text-sm text-red-700 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{generateError}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Active invite links</h3>
                      {invites.length > 0 && <span className="text-xs text-gray-500">{invites.length} active</span>}
                    </div>
                    {invitesLoading ? (
                      <div className="text-center py-8 text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />Loading invites...</div>
                    ) : invites.length === 0 ? (
                      <div className="bg-rose-50/40 border border-dashed border-rose-200 rounded-xl p-8 text-center">
                        <Link2 className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 font-medium">No active invite links yet</p>
                        <p className="text-xs text-gray-500 mt-1">Click <span className="font-medium">Generate Link</span> above to create your first one.</p>
                      </div>
                    ) : (
                      <div className="border border-rose-100 rounded-xl divide-y divide-rose-50">
                        {invites.map((inv) => {
                          const isCopied = copiedInviteId === inv.id
                          const isRevoking = revokingId === inv.id
                          const usesLabel = inv.max_uses === null ? `${inv.use_count} uses` : `${inv.use_count} / ${inv.max_uses} uses`
                          return (
                            <div key={inv.id} className="p-4 hover:bg-rose-50/40 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <code className="text-xs font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-gray-700">...{inv.token.slice(-8)}</code>
                                    {inv.is_usable ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Exhausted</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span>{formatInviteExpiry(inv.expires_at)}</span><span>&#183;</span><span>{usesLabel}</span><span>&#183;</span>
                                    <span>Created {new Date(inv.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                  <div className="mt-2"><code className="text-xs text-gray-600 break-all">{inv.join_url}</code></div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button size="sm" variant="outline" onClick={() => handleCopyInvite(inv)} className={`h-8 text-xs ${secondaryBtn}`}>
                                    {isCopied ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</>}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRevokeInvite(inv.id)} disabled={isRevoking} className="h-8 text-xs font-semibold rounded-full text-red-700 border-rose-200 bg-white/70 backdrop-blur hover:bg-rose-50 shadow-sm">
                                    {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Revoke</>}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── QR SUB-TAB ── */}
              {inviteTab === 'qr' && (
                <div className="p-5 sm:p-6">
                  {invitesLoading ? (
                    <div className="text-center py-12 text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />Loading invites...</div>
                  ) : invites.length === 0 ? (
                    <div className="bg-rose-50/40 border border-dashed border-rose-200 rounded-xl p-10 text-center">
                      <QrCode className="w-10 h-10 text-rose-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-medium">No invite link to display</p>
                      <p className="text-xs text-gray-500 mt-1 mb-4">Generate a link first, then come back here for the QR code.</p>
                      <Button onClick={() => setInviteTab('link')} variant="outline" size="sm" className={secondaryBtn}><Link2 className="w-4 h-4 mr-2" />Go to Share Link</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-4 order-2 md:order-1">
                        <div>
                          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Invite link</label>
                          <select value={selectedQrInviteId || ''} onChange={(e) => setSelectedQrInviteId(e.target.value)} className="w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400">
                            {invites.map((inv) => <option key={inv.id} value={inv.id}>...{inv.token.slice(-8)} &nbsp;&#183;&nbsp; {formatInviteExpiry(inv.expires_at)}</option>)}
                          </select>
                        </div>
                        {(() => {
                          const selected = invites.find((inv) => inv.id === selectedQrInviteId) || invites[0]
                          if (!selected) return null
                          const usesLabel = selected.max_uses === null ? `${selected.use_count} uses (unlimited)` : `${selected.use_count} of ${selected.max_uses} uses`
                          return (
                            <>
                              <div className="bg-rose-50/60 rounded-xl p-3 text-sm space-y-1.5 border border-rose-100">
                                <div className="flex justify-between"><span className="text-gray-500">Expiry</span><span className="text-gray-900 font-medium">{formatInviteExpiry(selected.expires_at)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Uses</span><span className="text-gray-900 font-medium">{usesLabel}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${selected.is_usable ? 'text-emerald-700' : 'text-gray-600'}`}>{selected.is_usable ? 'Active' : 'Exhausted'}</span></div>
                              </div>
                              <div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Direct URL</label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 text-xs bg-rose-50/60 border border-rose-100 rounded-xl px-3 py-2 text-gray-700 break-all">{selected.join_url}</code>
                                  <Button size="sm" variant="outline" onClick={() => handleCopyInvite(selected)} className={`h-9 flex-shrink-0 ${secondaryBtn}`}>
                                    {copiedInviteId === selected.id ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                              <Button onClick={handleDownloadQR} className={`w-full ${primaryBtn}`}>
                                <BtnSheen />
                                <Download className="w-4 h-4 mr-2" />Download PNG
                              </Button>
                            </>
                          )
                        })()}
                      </div>
                      <div className="order-1 md:order-2 flex flex-col items-center">
                        {(() => {
                          const selected = invites.find((inv) => inv.id === selectedQrInviteId) || invites[0]
                          if (!selected) return null
                          return (
                            <div ref={qrContainerRef} className="bg-white border border-white ring-1 ring-rose-100 rounded-2xl p-4 sm:p-6 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
                              <QRCodeCanvas value={selected.join_url} size={240} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#111827" />
                            </div>
                          )
                        })()}
                        <p className="text-xs text-gray-500 mt-3 text-center">Scan with a phone camera to open the join page.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── CSV UPLOAD SUB-TAB ── */}
              {inviteTab === 'csv' && (
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Upload area */}
                  {csvEmails.length === 0 && !bulkResults && (
                    <div>
                      <div
                        onClick={() => csvInputRef.current?.click()}
                        className="border-2 border-dashed border-rose-200 rounded-2xl p-10 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/40 transition-colors"
                      >
                        <Upload className="w-10 h-10 text-rose-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Upload a CSV file with email addresses</p>
                        <p className="text-xs text-gray-500">One email per row, or a column with emails. Max 200 emails, 1MB file size.</p>
                        <p className="text-xs text-gray-400 mt-2">Accepts .csv and .txt files</p>
                      </div>
                      <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleCSVFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {csvError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{csvError}</p>
                    </div>
                  )}

                  {/* Preview */}
                  {csvEmails.length > 0 && !bulkResults && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-red-500" />
                          <h3 className="text-sm font-medium text-gray-900">{csvFileName}</h3>
                          <span className="text-xs font-semibold text-gray-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">{csvEmails.length} emails</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleCSVClear} className={`h-8 text-xs ${secondaryBtn}`}>
                          <X className="w-3.5 h-3.5 mr-1" />Clear
                        </Button>
                      </div>

                      <div className="border border-rose-100 rounded-xl max-h-60 overflow-y-auto divide-y divide-rose-50">
                        {csvEmails.map((email, i) => (
                          <div key={email} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-rose-50/40">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{email}</span>
                            </div>
                            <button onClick={() => handleCSVRemoveEmail(email)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={handleCSVSubmit}
                          disabled={csvUploading || csvEmails.length === 0}
                          className={primaryBtn}
                        >
                          <BtnSheen />
                          {csvUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Inviting {csvEmails.length} learners...</>
                          ) : (
                            <><UserPlus className="w-4 h-4 mr-2" />Invite All ({csvEmails.length})</>
                          )}
                        </Button>
                        <button onClick={() => csvInputRef.current?.click()} className="text-sm text-gray-500 hover:text-gray-700">
                          Upload a different file
                        </button>
                        <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCSVFileSelect} className="hidden" />
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {bulkResults && bulkSummary && (
                    <div className="space-y-4">
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Invited', value: bulkSummary.invited, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                          { label: 'Already members', value: bulkSummary.already_member, color: 'text-gray-600 bg-gray-50 border-gray-200' },
                          { label: 'Not found', value: bulkSummary.not_found, color: 'text-amber-700 bg-amber-50 border-amber-100' },
                          { label: 'Errors', value: bulkSummary.errors + bulkSummary.seat_limit, color: 'text-rose-700 bg-rose-50 border-rose-100' },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-xl border p-3 text-center ${item.color}`}>
                            <div className="text-xl font-bold">{item.value}</div>
                            <div className="text-xs font-semibold">{item.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Per-row results */}
                      <div className="border border-rose-100 rounded-xl max-h-60 overflow-y-auto divide-y divide-rose-50">
                        {bulkResults.map((result, i) => {
                          const style = bulkResultStatusStyle[result.status] || bulkResultStatusStyle.error
                          return (
                            <div key={i} className={`flex items-center justify-between px-4 py-2 text-sm ${style.bg}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{result.email}</span>
                              </div>
                              <span className={`text-xs font-semibold flex-shrink-0 ${style.text}`}>
                                {result.message}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleCSVClear} className={secondaryBtn}>
                          <Upload className="w-4 h-4 mr-2" />Upload Another CSV
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('members')} className={secondaryBtn}>
                          <Users className="w-4 h-4 mr-2" />View Members
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default function CohortDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
          <SabiLoader text="Loading cohort..." size="lg" />
        </div>
      }
    >
      <CohortDetailPageContent />
    </Suspense>
  )
}
