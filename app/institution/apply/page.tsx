'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRequiredFields, type InstitutionVerticalType } from '@/lib/vertical-packs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRight,
  School,
  Users,
  Briefcase,
  Building,
  Heart,
  MoreHorizontal,
  Info,
} from 'lucide-react'

const institutionTypeOptions = [
  { value: 'school', label: 'School', icon: School, description: 'Primary, secondary, or tertiary institution' },
  { value: 'training_center', label: 'Training Center', icon: Users, description: 'Vocational or professional training' },
  { value: 'company', label: 'Company', icon: Briefcase, description: 'Corporate training department' },
  { value: 'ngo', label: 'NGO', icon: Heart, description: 'Non-profit organization' },
  { value: 'government', label: 'Government', icon: Building, description: 'Government agency or department' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, description: 'Other type of organization' },
] as const

const applySchema = z.object({
  name: z.string().min(2, 'Institution name must be at least 2 characters').max(100),
  type: z.enum(['school', 'ngo', 'government', 'training_center', 'company', 'other']),
  description: z.string().max(500).optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  lga: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contact_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
})

type ApplyInput = z.infer<typeof applySchema>

function PanelBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-24 w-80 h-80 bg-rose-100/70 rounded-full blur-[100px]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 75%)',
        }}
      />
    </div>
  )
}

export default function InstitutionApplyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdInstitution, setCreatedInstitution] = useState<{ name: string; slug: string } | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Vertical-specific extra field values (stored as vertical_metadata)
  const [verticalFields, setVerticalFields] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      type: 'school',
      country: 'Nigeria',
    },
  })

  const selectedType = watch('type')

  // Get the extra fields for the currently selected institution type
  const requiredFieldsPack = useMemo(() => {
    return getDefaultRequiredFields(selectedType as InstitutionVerticalType)
  }, [selectedType])

  // Reset vertical fields when type changes
  const handleTypeChange = (newType: typeof selectedType) => {
    setValue('type', newType)
    setVerticalFields({}) // Clear extra fields when switching types
  }

  const onSubmit = async (data: ApplyInput) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current session for token
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Please log in to apply')
        setIsLoading(false)
        return
      }

      // Build payload with vertical_metadata
      const payload: Record<string, unknown> = { ...data }

      // Only include vertical_metadata if there are values
      const cleanedMetadata: Record<string, string> = {}
      for (const [key, value] of Object.entries(verticalFields)) {
        if (value && value.trim()) {
          cleanedMetadata[key] = value.trim()
        }
      }
      if (Object.keys(cleanedMetadata).length > 0) {
        payload.vertical_metadata = cleanedMetadata
      }

      const response = await fetch('/api/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to submit application')
        setIsLoading(false)
        return
      }

      const inst = result.data || result
      setCreatedInstitution({ name: inst.name, slug: inst.slug })
      setSuccess(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Wait for auth to finish loading before deciding
  if (!user) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
          <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      )
    }
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#fffcfb] px-4">
        <PanelBackdrop />
        <Card className="relative w-full max-w-md bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="font-semibold tracking-tight">Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to apply for an institution account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login?redirect=/institution/apply">
              <Button className="relative overflow-hidden w-full bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                Sign In to Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success screen
  if (success && createdInstitution) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#fffcfb] border-r border-rose-100">
          <PanelBackdrop />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <Link href="/" className="flex items-center gap-2 mb-12">
              <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-1">
                <span className="text-gray-900">Sabitek</span>
                <Sparkles className="w-7 h-7 text-red-500" />
              </h1>
            </Link>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-3">Institution application</p>
            <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-gray-900 mb-4 leading-tight">
              Application<br />
              <span className="font-serif italic text-red-600">submitted</span>
            </h2>

            <p className="text-gray-600 text-lg mb-8">
              Our team will review your application and get back to you soon.
            </p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#fffcfb]">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
              Application <span className="font-serif italic text-red-600">received</span>
            </h2>

            <p className="text-gray-600 mb-6">
              Your application for <strong>{createdInstitution.name}</strong> has been submitted successfully.
            </p>

            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 mb-6 text-left">
              <h3 className="font-semibold tracking-tight text-gray-900 mb-3">What happens next?</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-50 border border-rose-100 text-red-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</span>
                  <span>Our team will review your application within 2-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-50 border border-rose-100 text-red-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</span>
                  <span>You&apos;ll receive an email notification about the status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-50 border border-rose-100 text-red-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</span>
                  <span>Once approved, you can start creating programs and inviting team members</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard">
                <Button className="relative overflow-hidden w-full bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5">
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#fffcfb] border-r border-rose-100">
        <PanelBackdrop />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-1">
              <span className="text-gray-900">Sabitek</span>
              <Sparkles className="w-7 h-7 text-red-500" />
            </h1>
          </Link>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-3">For institutions</p>
          <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-gray-900 mb-4 leading-tight">
            Partner with<br />
            <span className="font-serif italic text-red-600">Sabitek</span>
          </h2>

          <p className="text-gray-600 text-lg mb-8">
            Bring AI-powered learning to your institution. Create programs, manage cohorts, and track learner progress.
          </p>

          <div className="space-y-4">
            {[
              { icon: Users, text: 'Manage unlimited learners' },
              { icon: School, text: 'Create custom programs' },
              { icon: Globe, text: 'Built for African learners' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-red-500" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-4 sm:p-8 bg-[#fffcfb] overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-1">
              <span className="text-gray-900">Sabitek</span>
              <Sparkles className="w-5 h-5 text-red-500" />
            </h1>
          </div>

          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Institution account</p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Apply for an <span className="font-serif italic text-red-600">institution</span> account
            </h2>
            <p className="text-gray-600 mt-1">
              Fill out the form below to register your organization
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Institution Type */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-3">
                Institution Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {institutionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTypeChange(option.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedType === option.value
                        ? 'border-red-400 bg-rose-50/70 ring-1 ring-rose-200'
                        : 'border-rose-100 hover:border-rose-200 bg-white/70'
                    }`}
                  >
                    <option.icon className={`w-5 h-5 mb-1 ${
                      selectedType === option.value ? 'text-red-500' : 'text-gray-400'
                    }`} />
                    <div className={`text-sm font-medium ${
                      selectedType === option.value ? 'text-red-900' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Institution Name */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Institution Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('name')}
                  placeholder={
                    selectedType === 'school' ? 'e.g., Lagos State University' :
                    selectedType === 'training_center' ? 'e.g., Jobberman Soft Skills Training' :
                    selectedType === 'company' ? 'e.g., GTBank Learning Academy' :
                    selectedType === 'ngo' ? 'e.g., Teach For Nigeria' :
                    selectedType === 'government' ? 'e.g., Federal Ministry of Education' :
                    'e.g., African Leadership Academy'
                  }
                  className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="Brief description of your institution..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 placeholder:text-gray-400 focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* ── Vertical-Specific Extra Fields ── */}
            {requiredFieldsPack.fields.length > 0 && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Info className="w-4 h-4 text-red-500" />
                  <span>
                    {selectedType === 'school' && 'School-Specific Details'}
                    {selectedType === 'ngo' && 'NGO-Specific Details'}
                    {selectedType === 'government' && 'Government-Specific Details'}
                    {selectedType === 'company' && 'Company-Specific Details'}
                    {selectedType === 'training_center' && 'Training Center Details'}
                    {selectedType === 'other' && 'Additional Details'}
                  </span>
                </div>

                {requiredFieldsPack.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'select' && field.options ? (
                      <select
                        value={verticalFields[field.key] || ''}
                        onChange={(e) =>
                          setVerticalFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm cursor-pointer"
                        required={field.required}
                      >
                        <option value="">Select {field.label.toLowerCase()}...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'number' ? (
                      <Input
                        type="number"
                        value={verticalFields[field.key] || ''}
                        onChange={(e) =>
                          setVerticalFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={verticalFields[field.key] || ''}
                        onChange={(e) =>
                          setVerticalFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    {...register('country')}
                    placeholder="Nigeria"
                    className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  State *
                </label>
                <Input
                  {...register('state')}
                  placeholder="e.g., Lagos"
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  LGA (optional)
                </label>
                <Input
                  {...register('lga')}
                  placeholder="Local Government Area"
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Address (optional)
                </label>
                <Input
                  {...register('address')}
                  placeholder="Street address"
                  className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    {...register('contact_email')}
                    type="email"
                    placeholder="admin@institution.edu"
                    className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    {...register('contact_phone')}
                    placeholder="+234 800 000 0000"
                    className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Website (optional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  {...register('website')}
                  placeholder="https://www.institution.edu"
                  className="pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                />
              </div>
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="relative overflow-hidden w-full h-12 text-base bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Submit Application
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              By applying, you agree to our{' '}
              <Link href="/terms" className="text-red-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
