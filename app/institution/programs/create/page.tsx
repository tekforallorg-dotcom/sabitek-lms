'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronRight,
  Save,
  Globe,
  Lock,
  Link as LinkIcon,
  Calendar,
  AlertCircle,
  Layers,
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  slug: string
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

export default function CreateProgramPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [issueCertificate, setIssueCertificate] = useState(true)
  const [allowSelfPaced, setAllowSelfPaced] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      fetchInstitution()
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirect=/institution/programs/create')
    }
  }, [authLoading, user])

  const fetchInstitution = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/institutions/my-membership', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        setError('You are not a member of any institution')
        setLoading(false)
        return
      }

      const membership = await res.json()
      setInstitution(membership.institution)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load institution')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution) return

    setSubmitting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          institution_id: institution.id,
          name,
          description: description || undefined,
          short_description: shortDescription || undefined,
          visibility,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          issue_certificate: issueCertificate,
          allow_self_paced: allowSelfPaced,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create program')
      }

      const program = await res.json()
      router.push(`/institution/programs/${program.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create program'
      console.error('Error creating program:', err)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading..." />
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Create Program</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Institution</h2>
            <p className="text-gray-600">{error || 'You need to be part of an institution to create programs.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Create Program</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/institution/programs" className="hover:text-red-600 transition-colors">
                Programs
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Create</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-100 via-pink-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Program</h1>
          <p className="text-gray-600 mt-1">Set up a new learning program for {institution.name}</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Digital Skills Bootcamp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <Input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief summary (max 500 characters)"
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the program..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility</h2>
            <div className="space-y-3">
              {[
                { value: 'private', icon: Lock, label: 'Private', desc: 'Only visible to institution members' },
                { value: 'unlisted', icon: LinkIcon, label: 'Unlisted', desc: 'Accessible via direct link' },
                { value: 'public', icon: Globe, label: 'Public', desc: 'Discoverable by anyone' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    visibility === option.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                  </div>
                </label>
              ))}
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

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={issueCertificate}
                  onChange={(e) => setIssueCertificate(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Issue Certificates</span>
                  <p className="text-sm text-gray-600">Award certificates upon program completion</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allowSelfPaced}
                  onChange={(e) => setAllowSelfPaced(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Allow Self-Paced Learning</span>
                  <p className="text-sm text-gray-600">Learners can progress at their own speed</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/institution/programs">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={submitting || !name.trim()} className="bg-red-600 hover:bg-red-700">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Program
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}