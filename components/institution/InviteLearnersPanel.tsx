'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Link2,
  QrCode,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  Sparkles,
  Clock,
  Users,
  Info,
} from 'lucide-react'

/* ── Types ── */

interface Invite {
  id: string
  token: string
  type: string
  status: string
  expires_at: string | null
  max_uses: number | null
  use_count: number
  join_url: string
  is_usable: boolean
  created_at: string
  creator?: { id: string; full_name: string; email: string } | null
}

interface InviteLearnersPanelProps {
  cohortId: string
  cohortEnrollmentMode: string
  cohortStatus: string
}

/* ── Plain-language enrollment mode copy ── */

const enrollmentExplainers: Record<string, string> = {
  invite_only:
    'Only people with this link can join. Share it privately with people you want to enroll.',
  access_code:
    'People with this link can join by entering the cohort access code.',
  approval_required:
    'People who use this link will apply to join — you’ll review and approve each request.',
  public:
    'Anyone with this link can join instantly. No approval required.',
}

/* ── Component ── */

export default function InviteLearnersPanel({
  cohortId,
  cohortEnrollmentMode,
  cohortStatus,
}: InviteLearnersPanelProps) {
  const [subTab, setSubTab] = useState<'link' | 'qr'>('link')
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null)
  const qrWrapRef = useRef<HTMLDivElement>(null)

  const isArchived = cohortStatus === 'archived'

  useEffect(() => {
    if (!isArchived) fetchInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId])

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  const fetchInvites = async () => {
    setLoading(true)
    setError('')
    try {
      const session = await getSession()
      if (!session) {
        setError('Your session has expired. Please reload the page.')
        return
      }
      const res = await fetch(
        `/api/cohorts/${cohortId}/invites?status=ACTIVE&limit=50`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load invites')
      }
      const json = await res.json()
      const list: Invite[] = json.data?.invites || json.invites || []
      setInvites(list)
      // Auto-select first usable invite for QR tab so it's ready immediately
      const firstUsable = list.find((i) => i.is_usable)
      setSelectedInviteId((prev) => prev ?? firstUsable?.id ?? null)
    } catch (e) {
      console.error('[InviteLearnersPanel] fetchInvites error:', e)
      setError(e instanceof Error ? e.message : 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const session = await getSession()
      if (!session) throw new Error('Session expired — please reload')
      const res = await fetch(`/api/cohorts/${cohortId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        // Defaults: no expiry, unlimited uses. Configuration UI deferred.
        body: JSON.stringify({ type: 'SHARE_LINK' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate invite')
      }
      const json = await res.json()
      const created: Invite = json.data || json
      setInvites((prev) => [created, ...prev])
      setSelectedInviteId(created.id)
      // Auto-copy fresh link for convenience — best-effort
      await navigator.clipboard.writeText(created.join_url).catch(() => {})
      setCopiedId(created.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('[InviteLearnersPanel] handleGenerate error:', e)
      setError(e instanceof Error ? e.message : 'Failed to generate invite')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.join_url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Could not copy to clipboard — your browser may have blocked it.')
    }
  }

  const handleRevoke = async (invite: Invite) => {
    if (
      !confirm(
        'Revoke this invite link? The link will stop working immediately. This cannot be undone.'
      )
    ) {
      return
    }
    setRevoking(invite.id)
    setError('')
    try {
      const session = await getSession()
      if (!session) throw new Error('Session expired — please reload')
      const res = await fetch(
        `/api/cohorts/${cohortId}/invites/${invite.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to revoke invite')
      }
      // Remove from visible ACTIVE list (DELETE is idempotent on the server)
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
      if (selectedInviteId === invite.id) setSelectedInviteId(null)
    } catch (e) {
      console.error('[InviteLearnersPanel] handleRevoke error:', e)
      setError(e instanceof Error ? e.message : 'Failed to revoke invite')
    } finally {
      setRevoking(null)
    }
  }

  const handleDownloadQR = (invite: Invite) => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) {
      setError('QR code is not ready yet — please try again.')
      return
    }
    try {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `cohort-invite-${invite.token.slice(0, 8)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error('[InviteLearnersPanel] handleDownloadQR error:', e)
      setError('Could not download the QR image.')
    }
  }

  /* ── Formatters ── */

  const formatExpiry = (iso: string | null) => {
    if (!iso) return 'No expiry'
    const d = new Date(iso)
    return `Expires ${d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }

  const formatUses = (useCount: number, maxUses: number | null) => {
    if (maxUses === null) return `${useCount} uses · no limit`
    return `${useCount} / ${maxUses} uses`
  }

  const explainer =
    enrollmentExplainers[cohortEnrollmentMode] ||
    enrollmentExplainers.invite_only
  const selectedInvite =
    invites.find((i) => i.id === selectedInviteId) || invites[0] || null

  /* ── Archived guard ── */

  if (isArchived) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Cohort is archived
        </h3>
        <p className="text-sm text-gray-500">
          New invite links can’t be created for archived cohorts.
        </p>
      </div>
    )
  }

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Enrollment mode explainer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">{explainer}</div>
      </div>

      {/* Sub-tab switcher */}
      <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSubTab('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subTab === 'link'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Link
        </button>
        <button
          onClick={() => setSubTab('qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subTab === 'qr'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Link Tab ─── */}
      {subTab === 'link' && (
        <div className="space-y-4">
          {/* Generate action */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  Generate a shareable invite link
                </h3>
                <p className="text-sm text-gray-500">
                  One link, many learners. Share via message, email, or social.
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-red-600 hover:bg-red-700 flex-shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing invites list */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-900">
                Active Invite Links
              </h4>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading invites…
              </div>
            ) : invites.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Link2 className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  No active invite links yet
                </p>
                <p className="text-xs text-gray-500">
                  Generate one to share with learners.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {invites.map((invite) => {
                  const copied = copiedId === invite.id
                  const isRevoking = revoking === invite.id
                  return (
                    <li key={invite.id} className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 truncate max-w-full">
                              {invite.join_url}
                            </code>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatExpiry(invite.expires_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatUses(invite.use_count, invite.max_uses)}
                            </span>
                            {!invite.is_usable && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Not usable
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(invite)}
                            className="h-8"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(invite)}
                            disabled={isRevoking}
                            className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                            title="Revoke invite"
                          >
                            {isRevoking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ─── QR Tab ─── */}
      {subTab === 'qr' && (
        <div className="bg-white rounded-xl shadow-sm border p-5 sm:p-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading…
            </div>
          ) : invites.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                No invite link yet
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Generate an invite link first — you can then download its QR code here.
              </p>
              <Button
                onClick={() => setSubTab('link')}
                variant="outline"
                size="sm"
              >
                Go to Link tab
              </Button>
            </div>
          ) : !selectedInvite ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Select an invite to view its QR code.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR canvas */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  ref={qrWrapRef}
                  className="p-4 bg-white border-2 border-gray-100 rounded-xl"
                >
                  <QRCodeCanvas
                    value={selectedInvite.join_url}
                    size={208}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#111827"
                  />
                </div>
                <Button
                  onClick={() => handleDownloadQR(selectedInvite)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
              </div>

              {/* Meta + selector */}
              <div className="flex-1 space-y-4 min-w-0">
                {invites.length > 1 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Invite
                    </label>
                    <select
                      value={selectedInvite.id}
                      onChange={(e) => setSelectedInviteId(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {invites.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.token.slice(0, 8)}… · {formatUses(inv.use_count, inv.max_uses)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Join URL
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono text-gray-700 truncate">
                      {selectedInvite.join_url}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(selectedInvite)}
                      className="h-9 flex-shrink-0"
                    >
                      {copiedId === selectedInvite.id ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Expiry</div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatExpiry(selectedInvite.expires_at).replace('Expires ', '')}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-0.5">Usage</div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {formatUses(selectedInvite.use_count, selectedInvite.max_uses)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Print and post this QR code, or drop it into slides — learners scan to join.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}