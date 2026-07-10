'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  getDefaultTerminology,
  type TerminologyPack,
  type InstitutionVerticalType,
} from '@/lib/vertical-packs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Settings,
  ChevronRight,
  Save,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  School,
  Users,
  Briefcase,
  Heart,
  Building,
  MoreHorizontal,
  Shield,
  Languages,
  RotateCcw,
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  country: string | null
  state: string | null
  lga: string | null
  address: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  logo_url: string | null
  status: string
  terminology_pack: Partial<TerminologyPack> | null
}

const institutionTypeOptions = [
  { value: 'school', label: 'School', icon: School },
  { value: 'training_center', label: 'Training Center', icon: Users },
  { value: 'company', label: 'Company', icon: Briefcase },
  { value: 'ngo', label: 'NGO', icon: Heart },
  { value: 'government', label: 'Government', icon: Building },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const

/**
 * Editable terminology fields shown in the settings UI.
 * We expose the high-impact ones; full pack still works under the hood.
 */
const TERMINOLOGY_FIELDS: Array<{
  key: keyof TerminologyPack
  label: string
  hint: string
}> = [
  { key: 'learner', label: 'Learner (singular)', hint: 'e.g., Student, Beneficiary, Employee' },
  { key: 'learner_plural', label: 'Learners (plural)', hint: 'e.g., Students, Beneficiaries' },
  { key: 'instructor', label: 'Instructor (singular)', hint: 'e.g., Teacher, Facilitator, Trainer' },
  { key: 'instructor_plural', label: 'Instructors (plural)', hint: 'e.g., Teachers, Facilitators' },
  { key: 'program', label: 'Program (singular)', hint: 'e.g., Curriculum, Initiative, Learning Path' },
  { key: 'program_plural', label: 'Programs (plural)', hint: 'e.g., Curricula, Initiatives' },
  { key: 'cohort', label: 'Cohort (singular)', hint: 'e.g., Class, Batch, Group' },
  { key: 'cohort_plural', label: 'Cohorts (plural)', hint: 'e.g., Classes, Batches' },
  { key: 'course', label: 'Course (singular)', hint: 'e.g., Subject, Module, Training' },
  { key: 'course_plural', label: 'Courses (plural)', hint: 'e.g., Subjects, Modules' },
  { key: 'completion', label: 'Completion', hint: 'e.g., Graduation, Certification, Compliance' },
  { key: 'dashboard_title', label: 'Dashboard Title', hint: 'Header text on the institution dashboard' },
  { key: 'invite_cta', label: 'Invite CTA', hint: 'Button label when inviting learners' },
]

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

export default function InstitutionSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('school')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Terminology pack — full TerminologyPack with current values (defaults + overrides)
  const [terminology, setTerminology] = useState<TerminologyPack>(getDefaultTerminology('other'))
// Domain allowlist
  const [domainAllowlist, setDomainAllowlist] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  useEffect(() => {
    if (!authLoading && user) {
      fetchInstitution()
    } else if (!authLoading && !user) {
      router.push('/auth/login?redirect=/institution/settings')
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

      const result = await res.json()
      const membership = result.data || result
      const inst = membership.institution as Institution

      setInstitution(inst)
      setName(inst.name || '')
      setType(inst.type || 'school')
      setDescription(inst.description || '')
      setCountry(inst.country || '')
      setState(inst.state || '')
      setLga(inst.lga || '')
      setAddress(inst.address || '')
      setWebsite(inst.website || '')
      setContactEmail(inst.contact_email || '')
      setContactPhone(inst.contact_phone || '')

      // Load domain allowlist
      setDomainAllowlist((inst as any).email_domain_allowlist || [])
      // Merge defaults with stored overrides for the terminology editor
      const verticalType = (inst.type || 'other') as InstitutionVerticalType
      const defaults = getDefaultTerminology(verticalType)
      setTerminology({ ...defaults, ...(inst.terminology_pack || {}) })
    } catch (err) {
      console.error('Error fetching institution:', err)
      setError('Failed to load institution settings')
    } finally {
      setLoading(false)
    }
  }

  const handleResetTerminology = () => {
    if (!institution) return
    const verticalType = (institution.type || 'other') as InstitutionVerticalType
    setTerminology(getDefaultTerminology(verticalType))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!institution) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const payload: Record<string, unknown> = { name, type }

      if (description.trim()) payload.description = description.trim()
      if (country.trim()) payload.country = country.trim()
      if (state.trim()) payload.state = state.trim()
      if (lga.trim()) payload.lga = lga.trim()
      if (address.trim()) payload.address = address.trim()

      payload.website = website.trim()
      payload.contact_email = contactEmail.trim()
      payload.contact_phone = contactPhone.trim() || undefined

      // Send the full terminology pack — Supabase JSONB stores the object
      payload.terminology_pack = terminology
      payload.email_domain_allowlist = domainAllowlist

      const res = await fetch(`/api/institutions/${institution.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update settings')
      }

      const updated = await res.json()
      setInstitution(updated.data ?? updated)
      setSuccess('Settings updated successfully')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      console.error('Error saving settings:', err)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <SabiBotLoader message="Loading settings..." />
  }

  if (!institution) {
    return (
      <div className="relative min-h-screen bg-[#fffcfb]">
        <PageBackdrop />
        <div className="relative bg-white/85 backdrop-blur border-b border-rose-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Settings</span>
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
            <p className="text-gray-600 mb-6">{error || 'You need to be part of an institution to access settings.'}</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Institution Settings</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/institution/dashboard" className="hover:text-red-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] flex items-center justify-center">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">Institution</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                Institution <span className="font-serif italic text-red-600">settings</span>
              </h1>
              <p className="text-gray-600 mt-0.5">Manage profile and preferences for {institution.name}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="text-emerald-700 text-sm">{success}</span>
          </div>
        )}

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Account Status</span>
                <p className="text-xs text-gray-500">Slug: {institution.slug}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              institution.status === 'approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : institution.status === 'pending'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                institution.status === 'approved' ? 'bg-emerald-400'
                : institution.status === 'pending' ? 'bg-rose-400'
                : 'bg-gray-400'
              }`} />
              <span className="capitalize">{institution.status}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Institution Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Institution name" className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" required />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">Institution Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {institutionTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        type === option.value ? 'border-red-400 bg-rose-50/70 ring-1 ring-rose-200' : 'border-rose-100 hover:border-rose-200 bg-white/70'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mb-1 ${type === option.value ? 'text-red-500' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${type === option.value ? 'text-red-900' : 'text-gray-700'}`}>{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your institution..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 placeholder:text-gray-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">State</label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., Lagos" className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">LGA (optional)</label>
                  <Input value={lga} onChange={(e) => setLga(e.target.value)} placeholder="Local Government Area" className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Address (optional)</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="admin@institution.edu" className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+234 800 000 0000" className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Website (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.institution.edu" className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400" />
                </div>
              </div>
            </div>
          </div>

{/* ── Domain Allowlist ── */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">Email Domain Allowlist</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Restrict who can join your institution by email domain. Leave empty to allow any email.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. school.edu.ng"
                className="max-w-xs rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const domain = newDomain.toLowerCase().replace(/^@/, '').trim()
                    if (domain && !domainAllowlist.includes(domain)) {
                      setDomainAllowlist((prev) => [...prev, domain])
                      setNewDomain('')
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                onClick={() => {
                  const domain = newDomain.toLowerCase().replace(/^@/, '').trim()
                  if (domain && !domainAllowlist.includes(domain)) {
                    setDomainAllowlist((prev) => [...prev, domain])
                    setNewDomain('')
                  }
                }}
              >
                Add Domain
              </Button>
            </div>

            {domainAllowlist.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No domains configured. Any email can join via invite links.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {domainAllowlist.map((domain) => (
                  <span key={domain} className="inline-flex items-center gap-1.5 bg-white/70 border border-rose-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                    @{domain}
                    <button
                      type="button"
                      onClick={() => setDomainAllowlist((prev) => prev.filter((d) => d !== domain))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <span className="sr-only">Remove</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l6 6M10 4l-6 6" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 mt-4">
              <p className="text-xs text-gray-600">
                When domains are configured and domain enforcement is enabled, only learners with matching email addresses can join through invite links. Institution admins can still manually add any learner.
              </p>
            </div>
          </div>

          {/* ── Vertical Customization (Terminology Pack) ── */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <div className="flex items-start justify-between mb-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Languages className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">Vertical Customization</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Customize the labels used throughout your dashboard. Defaults are based on your institution type.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetTerminology}
                className="flex-shrink-0 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                title="Reset all terminology to defaults for your institution type"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 mb-5 text-xs text-gray-600">
              <strong className="text-gray-900">Tip:</strong> A school might say &ldquo;Students&rdquo; and &ldquo;Subjects&rdquo;,
              an NGO &ldquo;Beneficiaries&rdquo; and &ldquo;Training Modules&rdquo;. These labels appear across your dashboard,
              navigation, and reports.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TERMINOLOGY_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <Input
                    value={terminology[field.key] || ''}
                    onChange={(e) =>
                      setTerminology((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.hint}
                    className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/institution/dashboard"><Button type="button" variant="outline" className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">Cancel</Button></Link>
            <Button type="submit" disabled={saving || !name.trim()} className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Settings</>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
