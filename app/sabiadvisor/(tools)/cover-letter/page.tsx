'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { supabase } from '@/lib/supabase'
import { generateCoverLetterPDF, generateCoverLetterDOCX } from '@/lib/advisor/cover-letter-export'
import { 
  FileText,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  File,
  Mail,
  Copy
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface CoverLetterSections {
  header: string
  opening: string
  value: string
  fit: string
  closing: string
  signature: string
}

interface CoverLetterInsights {
  matchedKeywords?: string[]
  missingKeywords?: string[]
  strongestEvidence?: string[]
  warnings?: string[]
  specificityScore?: number
  toneMatch?: string
}

interface CoverLetterDocument {
  id: string
  target_role: string
  company_name?: string
  tone: string
  length: string
  letter_text: string
  sections: CoverLetterSections
  insights?: CoverLetterInsights
  status: string
  action: string
  created_at: string
}

interface CostEstimate {
  costKobo: number
  costFormatted: string
  displayName: string
}

interface ProfileData {
  full_name: string
  email: string
  phone: string
  location: string
}

// ============================================
// COMPONENT
// ============================================

export default function CoverLetterBuilderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { balance, refreshBalance } = useWallet()
  const cvFileInputRef = useRef<HTMLInputElement>(null)
  const jdFileInputRef = useRef<HTMLInputElement>(null)
  const clFileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [action, setAction] = useState<'build' | 'tailor'>('build')
  const [targetRole, setTargetRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [tone, setTone] = useState<'professional' | 'warm' | 'confident' | 'direct'>('professional')
  const [length, setLength] = useState<'short' | 'standard' | 'detailed'>('standard')

  // JD Upload state (for both modes)
  const [uploadedJD, setUploadedJD] = useState<File | null>(null)
  const [uploadedJDText, setUploadedJDText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [uploadingJD, setUploadingJD] = useState(false)

  // CV Upload state (optional for both modes)
  const [uploadedCV, setUploadedCV] = useState<File | null>(null)
  const [uploadedCVText, setUploadedCVText] = useState('')
  const [uploadingCV, setUploadingCV] = useState(false)

  // Old Cover Letter Upload state (for Tailor mode)
  const [uploadedCL, setUploadedCL] = useState<File | null>(null)
  const [uploadedCLText, setUploadedCLText] = useState('')
  const [coverLetterDraft, setCoverLetterDraft] = useState('')
  const [uploadingCL, setUploadingCL] = useState(false)

  // Extra info
  const [extraInfo, setExtraInfo] = useState('')
  const [whatChanged, setWhatChanged] = useState('')

  // UI state
  const [generating, setGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [profileComplete, setProfileComplete] = useState(false)
const [profileCompleteness, setProfileCompleteness] = useState(0)
const [profileLoading, setProfileLoading] = useState(true)
const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [copied, setCopied] = useState(false)

  // Data state
  const [currentLetter, setCurrentLetter] = useState<CoverLetterDocument | null>(null)
  const [savedLetters, setSavedLetters] = useState<CoverLetterDocument[]>([])
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [missingMetricsQuestions, setMissingMetricsQuestions] = useState<string[]>([])

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [chargedAmount, setChargedAmount] = useState<string | null>(null)

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/sabiadvisor/cover-letter')
    } else if (user) {
      checkProfile()
      fetchSavedLetters()
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (action) {
      fetchCostEstimate()
    }
  }, [action])

  // ============================================
  // API CALLS
  // ============================================

  const checkProfile = async () => {
  try {
    setProfileLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setProfileLoading(false)
      return
    }

      const res = await fetch('/api/advisor/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const profile = data.profile
        setProfileCompleteness(profile?.profile_completeness || 0)
        setProfileComplete(profile?.profile_completeness >= 30)
        setProfileData({
          full_name: profile?.full_name || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          location: profile?.location || ''
        })
      }
   } catch (error) {
    console.error('Profile check error:', error)
  } finally {
    setProfileLoading(false)
  }
}

  const fetchSavedLetters = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/advisor/cover-letter', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setSavedLetters(data.letters || [])
      }
    } catch (error) {
      console.error('Fetch letters error:', error)
    }
  }

  const fetchCostEstimate = async () => {
    try {
      const operationType = action === 'tailor' ? 'cover_personalize' : 'cover_generate'
      const res = await fetch(`/api/advisor/pricing?operation=${operationType}`)
      
      if (res.ok) {
        const data = await res.json()
        setCostEstimate(data)
      }
    } catch (error) {
      console.error('Cost estimate error:', error)
    }
  }

  // ============================================
  // FILE UPLOAD HANDLERS
  // ============================================

  const handleFileUpload = async (
    file: File,
    setFile: (f: File | null) => void,
    setText: (t: string) => void,
    setUploading: (b: boolean) => void
  ) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, DOC, or TXT file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')
    setFile(file)

    try {
      if (file.type === 'text/plain') {
        const text = await file.text()
        setText(text)
      } else {
        const formData = new FormData()
        formData.append('file', file)

        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/advisor/parse-document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setText(data.text || data.rawText || '')
        } else {
          setText('')
          console.warn('File parse failed - user can paste text as fallback')
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
      setText('')
    } finally {
      setUploading(false)
    }
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, setUploadedCV, setUploadedCVText, setUploadingCV)
    }
  }

  const handleJDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, setUploadedJD, setUploadedJDText, setUploadingJD)
    }
  }

  const handleCLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, setUploadedCL, setUploadedCLText, setUploadingCL)
    }
  }

  const removeUploadedCV = () => {
    setUploadedCV(null)
    setUploadedCVText('')
    if (cvFileInputRef.current) cvFileInputRef.current.value = ''
  }

  const removeUploadedJD = () => {
    setUploadedJD(null)
    setUploadedJDText('')
    if (jdFileInputRef.current) jdFileInputRef.current.value = ''
  }

  const removeUploadedCL = () => {
    setUploadedCL(null)
    setUploadedCLText('')
    if (clFileInputRef.current) clFileInputRef.current.value = ''
  }

  // ============================================
  // GENERATION HANDLERS
  // ============================================

  const handleGenerate = () => {
    if (!targetRole.trim()) {
      setError('Please enter a target role')
      return
    }

    if (action === 'tailor') {
      const hasUploadedCL = uploadedCLText.trim().length > 0
      const hasPastedCL = coverLetterDraft.trim().length > 0

      if (!hasUploadedCL && !hasPastedCL) {
        if (uploadedCL) {
          setError("We couldn't read text from the uploaded cover letter. Please paste it below.")
        } else {
          setError('Please upload or paste your existing cover letter.')
        }
        return
      }
    }

    if (!profileComplete) {
      setError('Please complete your profile first (at least 30%)')
      return
    }

    setError('')
    setShowConfirmModal(true)
  }

  const confirmGenerate = async () => {
    setShowConfirmModal(false)
    setGenerating(true)
    setError('')
    setChargedAmount(null)
    setGenerationStatus('Analyzing your profile...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const progressStages = [
        'Analyzing target role requirements...',
        'Extracting your key achievements...',
        'Mapping evidence to job requirements...',
        'Writing opening paragraph...',
        'Crafting value proposition...',
        'Finalizing and polishing...'
      ]
      
      let stageIndex = 0
      const progressInterval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          setGenerationStatus(progressStages[stageIndex])
          stageIndex++
        }
      }, 3000)

      const finalJobDescription = [uploadedJDText.trim(), jobDescription.trim()]
        .filter(Boolean)
        .join('\n\n---\n\n') || undefined

      const finalOldCoverLetter = action === 'tailor'
        ? [uploadedCLText.trim(), coverLetterDraft.trim()].filter(Boolean).join('\n\n---\n\n')
        : undefined

      const res = await fetch('/api/advisor/cover-letter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          targetRole: targetRole.trim(),
          companyName: companyName.trim() || undefined,
          tone,
          length,
          jobDescription: finalJobDescription,
          uploadedCVText: uploadedCVText.trim() || undefined,
          extraInfo: extraInfo.trim() || undefined,
          oldCoverLetter: finalOldCoverLetter,
          whatChanged: whatChanged.trim() || undefined,
        })
      })

      clearInterval(progressInterval)
      setGenerationStatus('')

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate cover letter')
      }

      setCurrentLetter({
        id: data.letter.id,
        target_role: data.letter.targetRole,
        company_name: data.letter.companyName,
        tone: data.letter.tone,
        length: data.letter.length,
        letter_text: data.letter.letterText,
        sections: data.letter.sections,
        insights: data.letter.insights,
        status: 'completed',
        action,
        created_at: new Date().toISOString(),
      })
      
      setMissingMetricsQuestions(data.missingMetricsQuestions || [])
      setChargedAmount(data.cached ? '₦0 (cached)' : data.charged)
      refreshBalance()
      fetchSavedLetters()

    } catch (error: unknown) {
      setGenerationStatus('')
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter'
      setError(errorMessage)
    } finally {
      setGenerating(false)
      setGenerationStatus('')
    }
  }

  // ============================================
  // EXPORT HANDLERS
  // ============================================

  const handleExportPDF = async () => {
    if (!currentLetter || !profileData) return
    
    setExporting('pdf')
    try {
      const blob = await generateCoverLetterPDF({
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        targetRole: currentLetter.target_role,
        companyName: currentLetter.company_name,
        letterText: currentLetter.letter_text,
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profileData.full_name.replace(/\s+/g, '_')}_Cover_Letter.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF export error:', error)
      setError('Failed to export PDF')
    } finally {
      setExporting(null)
    }
  }

  const handleExportDOCX = async () => {
    if (!currentLetter || !profileData) return
    
    setExporting('docx')
    try {
      const blob = await generateCoverLetterDOCX({
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        targetRole: currentLetter.target_role,
        companyName: currentLetter.company_name,
        letterText: currentLetter.letter_text,
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profileData.full_name.replace(/\s+/g, '_')}_Cover_Letter.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('DOCX export error:', error)
      setError('Failed to export DOCX')
    } finally {
      setExporting(null)
    }
  }

  const copyToClipboard = async () => {
    if (!currentLetter) return
    try {
      await navigator.clipboard.writeText(currentLetter.letter_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  // ============================================
  // RENDER
  // ============================================

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-pink-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-gray-200/50 flex flex-col lg:h-screen lg:sticky lg:top-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Cover Letter Builder</h1>
              <p className="text-xs text-gray-500">Create compelling cover letters</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profile Status */}
          {!profileLoading && !profileComplete && (
  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
    <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Profile Incomplete</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {profileCompleteness}% complete. Need at least 30%.
                  </p>
                  <a 
                    href="/sabiadvisor/profile" 
                    className="text-xs text-amber-700 font-medium hover:text-amber-800 mt-1 inline-flex items-center gap-1"
                  >
                    Complete Profile →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to do?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAction('build')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  action === 'build'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">Build Letter</span>
                <p className="text-xs text-gray-500 mt-0.5">From your profile</p>
              </button>
              <button
                onClick={() => setAction('tailor')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  action === 'tailor'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">Tailor Letter</span>
                <p className="text-xs text-gray-500 mt-0.5">Customize existing</p>
              </button>
            </div>
          </div>

          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Role *</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Engineer, Marketing Manager"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Recommended)</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Google, Acme Corp"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            >
              <option value="professional">Professional</option>
              <option value="warm">Warm & Friendly</option>
              <option value="confident">Confident & Assertive</option>
              <option value="direct">Direct & Concise</option>
            </select>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as typeof length)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            >
              <option value="short">Short (180-250 words)</option>
              <option value="standard">Standard (250-350 words)</option>
              <option value="detailed">Detailed (350-500 words)</option>
            </select>
          </div>

          {/* Job Description (Both modes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description {action === 'tailor' ? '*' : '(Recommended)'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {action === 'build' 
                ? 'Adding a JD helps create more targeted content'
                : 'Helps tailor your letter to match requirements'}
            </p>
            
            {uploadedJD ? (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-purple-700 flex-1 truncate">{uploadedJD.name}</span>
                <button onClick={removeUploadedJD} className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => jdFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all mb-2 group"
              >
                {uploadingJD ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500 mx-auto" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-purple-500 mx-auto mb-1 transition-colors" />
                    <p className="text-xs text-gray-600">Upload JD file</p>
                  </>
                )}
              </div>
            )}
            
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleJDUpload}
              className="hidden"
            />

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">or paste below</span>
              </div>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
            />
          </div>

          {/* Tailor Mode: Old Cover Letter */}
          {action === 'tailor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Existing Cover Letter *
              </label>
              
              {uploadedCL ? (
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <File className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-green-700 flex-1 truncate">{uploadedCL.name}</span>
                  <button onClick={removeUploadedCL} className="p-1.5 hover:bg-green-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => clFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all mb-2 group"
                >
                  {uploadingCL ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-500 mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-green-500 mx-auto mb-1 transition-colors" />
                      <p className="text-xs text-gray-600">Upload existing cover letter</p>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={clFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleCLUpload}
                className="hidden"
              />

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">or paste below</span>
                </div>
              </div>

              <textarea
                value={coverLetterDraft}
                onChange={(e) => setCoverLetterDraft(e.target.value)}
                placeholder="Paste your existing cover letter here..."
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
              />
            </div>
          )}

          {/* Tailor Mode: What Changed */}
          {action === 'tailor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What&apos;s Changed? (Optional)
              </label>
              <textarea
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder="e.g., new achievements, relocation, career pivot..."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
              />
            </div>
          )}

          {/* Upload CV (Both modes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Your CV (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Helps extract achievements for your letter
            </p>
            
            {uploadedCV ? (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-700 flex-1 truncate">{uploadedCV.name}</span>
                <button onClick={removeUploadedCV} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => cvFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
              >
                {uploadingCV ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mx-auto mb-1 transition-colors" />
                    <p className="text-xs text-gray-600">Upload CV</p>
                  </>
                )}
              </div>
            )}
            
            <input
              ref={cvFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleCVUpload}
              className="hidden"
            />
          </div>

          {/* Extra Info (Build mode) */}
          {action === 'build' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Information (Optional)
              </label>
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Company info, why you're interested, special circumstances..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Cost Estimate */}
          {costEstimate && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated cost:</span>
                <span className="text-sm font-semibold text-gray-900">{costEstimate.costFormatted}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Same inputs within 24h are free (cached)
              </p>
            </div>
          )}

          {/* Generation Progress */}
          {generating && generationStatus && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-purple-700">{generationStatus}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {chargedAmount && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Cover letter generated! Charged: {chargedAmount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button - Fixed at bottom */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white/80 backdrop-blur-sm">
          <button
            onClick={handleGenerate}
            disabled={generating || !profileComplete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Cover Letter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-slate-100 overflow-auto">
        {currentLetter ? (
          <div className="p-4 lg:p-6">
            {/* Preview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentLetter.target_role} Cover Letter
                </h2>
                <p className="text-sm text-gray-500">
                  {currentLetter.company_name && `${currentLetter.company_name} • `}
                  {currentLetter.tone} • {currentLetter.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={exporting !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm"
                >
                  {exporting === 'pdf' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  PDF
                </button>
                <button 
                  onClick={handleExportDOCX}
                  disabled={exporting !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all shadow-sm"
                >
                  {exporting === 'docx' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  DOCX
                </button>
              </div>
            </div>

            {/* Insights Panel */}
            {currentLetter.insights && (
              <div className="mb-4 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl border border-purple-200/50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  Letter Insights
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
  {currentLetter.insights.specificityScore != null && (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
      <div className="text-xs text-gray-500 mb-1">Specificity</div>
      <div className="text-2xl font-bold text-purple-600">
        {currentLetter.insights.specificityScore}%
      </div>
    </div>
  )}
  
  {currentLetter.insights.matchedKeywords && (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-100">
      <div className="text-xs text-gray-500 mb-1">Keywords Matched</div>
      <div className="text-2xl font-bold text-green-600">
        {currentLetter.insights.matchedKeywords.length}
      </div>
    </div>
  )}
</div>

{currentLetter.insights.toneMatch && (
  <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-100">
    <div className="text-xs font-medium text-pink-700 mb-1.5">📝 Tone Analysis</div>
    <p className="text-xs text-gray-600 leading-relaxed">
      {currentLetter.insights.toneMatch}
    </p>
  </div>
)}

                {currentLetter.insights.warnings && currentLetter.insights.warnings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-100/50">
                    <div className="text-xs font-medium text-amber-700 mb-2">
                      ⚠️ Suggestions:
                    </div>
                    <ul className="space-y-1">
                      {currentLetter.insights.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {missingMetricsQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-100/50">
                    <div className="text-xs font-medium text-purple-700 mb-2">
                      📊 Add metrics to strengthen your letter:
                    </div>
                    <ul className="space-y-1">
                      {missingMetricsQuestions.map((q, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Letter Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 max-w-3xl mx-auto">
              {/* Header */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="font-semibold text-gray-900">{profileData?.full_name || 'Your Name'}</p>
                <p className="text-sm text-gray-600">
                  {[profileData?.email, profileData?.phone, profileData?.location].filter(Boolean).join(' • ')}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {currentLetter.company_name && (
                  <div className="mt-4">
                    <p className="text-gray-900">{currentLetter.company_name}</p>
                    <p className="text-sm text-gray-600">Re: {currentLetter.target_role} Position</p>
                  </div>
                )}
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {currentLetter.letter_text}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cover Letter Yet</h3>
              <p className="text-sm text-gray-500">
                Fill in your target role and click &quot;Generate Cover Letter&quot; to create a compelling letter from your profile.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm bg-white rounded-2xl shadow-2xl z-50 p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Confirm Generation</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              This will cost <strong className="text-purple-600">{costEstimate?.costFormatted || '...'}</strong> from your wallet.
            </p>
            
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 mb-4 border border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your balance:</span>
                <span className="font-medium">{balance?.balanceFormatted || '₦0'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">After charge:</span>
                <span className="font-medium text-green-600">
                  {balance && costEstimate 
                    ? formatNaira(balance.balanceKobo - costEstimate.costKobo)
                    : '...'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenerate}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20"
              >
                Proceed
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}