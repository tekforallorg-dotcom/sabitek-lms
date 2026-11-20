'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'
import SabiLoader from '@/components/ui/SabiLoader'
import { Building2, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react'

interface Preview {
  institution_name: string
  role: string
  role_label: string
}

const ERROR_COPY: Record<string, string> = {
  invalid: 'This invite link is not valid. Ask the person who sent it for a fresh one.',
  expired: 'This invite has expired. Ask your admin to send a new one.',
  revoked: 'This invite was revoked. Contact your admin for a new invite.',
  exhausted: 'This invite has already been fully used. Ask your admin for a new one.',
}

export default function JoinTeamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/join/team/${encodeURIComponent(token)}/preview`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error || 'invalid')
        } else {
          setPreview(json.data)
        }
      } catch {
        setError('invalid')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login`)
        return
      }
      const res = await fetch(`/api/join/team/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json().catch(() => ({}))
      const payload = json.data || json
      if (!res.ok) {
        toast.error(payload.error || payload.message || 'Could not accept the invite. Please try again.')
        return
      }
      toast.success(`Welcome to ${payload.institution_name}!`)
      router.push(payload.next_route || '/dashboard')
    } catch {
      toast.error('Could not accept the invite. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Checking your invite..." size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="relative max-w-md w-full">
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />

          {error ? (
            <div className="px-6 sm:px-8 py-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center mb-5">
                <XCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-medium tracking-tight text-gray-900 mb-3">
                Invite not{' '}
                <span className="font-serif italic text-red-600">available</span>
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-7">
                {ERROR_COPY[error] || ERROR_COPY.invalid}
              </p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full h-11 bg-white border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 text-sm font-medium rounded-full shadow-sm transition-all"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : preview ? (
            <div className="px-6 sm:px-8 py-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
                Team invitation
              </p>
              <h1 className="text-2xl font-medium tracking-tight text-gray-900 mb-2">
                Join{' '}
                <span className="font-serif italic text-red-600">{preview.institution_name}</span>
              </h1>
              <p className="text-sm text-gray-500 mb-7">
                You&apos;ve been invited to join as{' '}
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-gray-200 text-red-600 rounded-full text-xs font-medium align-middle">
                  <CheckCircle className="w-3 h-3" />
                  {preview.role_label}
                </span>
              </p>

              {user ? (
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="group relative overflow-hidden w-full h-12 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all disabled:opacity-50"
                >
                  {accepting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Accept Invitation
                      <ArrowRight className="w-4 h-4 transition-transform" />
                    </span>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Link href={`/auth/register?invite=${encodeURIComponent(token)}`} className="block">
                    <Button className="group relative overflow-hidden w-full h-12 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all">
                      Create Account &amp; Join
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-11 bg-white border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 text-sm font-medium rounded-full shadow-sm transition-all"
                    >
                      I already have an account
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-400 pt-1">
                    After signing in, come back to this link to accept.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Invited by mistake? You can safely ignore this invitation.
        </p>
      </div>
    </div>
  )
}
