'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { supabase } from '@/lib/supabase'
import { generateCVPDF, generateCVDOCX } from '@/lib/advisor/cv-export'
import SabiLoader from '@/components/ui/SabiLoader'
import { 
  FileText,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  File
} from 'lucide-react'

interface CVSections {
  summary?: string
  skills?: string[]
  experience?: Array<{
    company: string
    title: string
    duration: string
    bullets: string[]
  }>
  projects?: Array<{
    name: string
    description: string
    technologies?: string[]
  }>
  education?: Array<{
    institution: string
    degree: string
    year: string
  }>
  certifications?: Array<{
    name: string
    issuer: string
    year?: string
  }>
}

interface CVDocument {
  id: string
  target_role: string
  level: string
  format: string
  sections: CVSections
  status: string
  ats_score?: number
  created_at: string
  ats?: {
    keyword_coverage_pct?: number
    missing_keywords?: string[]
    matched_keywords?: string[]
    score?: number
  }
}

interface CVGenerationExtras {
  missingMetricsQuestions?: string[]
  roleDiff?: {
    targetRole: string
    resumeRoleFocus: string
    compatibilityScore: number
    toneShift: 'downshift' | 'same' | 'upshift'
    keywordGaps: string[]
    warnings: string[]
  }
  aiProvider?: string
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

export default function CVBuilderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { balance, refreshBalance } = useWallet()
  const cvFileInputRef = useRef<HTMLInputElement>(null)
  const jdFileInputRef = useRef<HTMLInputElement>(null)

  // JD Upload state (for Tailor mode)
  const [uploadedJD, setUploadedJD] = useState<File | null>(null)
  const [uploadedJDText, setUploadedJDText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [uploadingJD, setUploadingJD] = useState(false)
  
  // Form state
  const [targetRole, setTargetRole] = useState('')
  const [level, setLevel] = useState('mid')
  const [format, setFormat] = useState('ATS-2page')
  const [action, setAction] = useState<'build' | 'tailor'>('build')
  
  // CV Upload state
  const [uploadedCV, setUploadedCV] = useState<File | null>(null)
  const [uploadedCVText, setUploadedCVText] = useState('')
  const [uploadingCV, setUploadingCV] = useState(false)

  // Extra instructions (for Build mode)
  const [extraInstructions, setExtraInstructions] = useState('')
  
  // UI state
  const [generating, setGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [profileComplete, setProfileComplete] = useState(false)
const [profileCompleteness, setProfileCompleteness] = useState(0)
const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  
  // Data state
  const [currentCV, setCurrentCV] = useState<CVDocument | null>(null)
  const [cvExtras, setCvExtras] = useState<CVGenerationExtras | null>(null)
  const [savedCVs, setSavedCVs] = useState<CVDocument[]>([])
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [chargedAmount, setChargedAmount] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/sabiadvisor/cv')
    } else if (user) {
      checkProfile()
      fetchSavedCVs()
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (action) {
      fetchCostEstimate()
    }
  }, [action])

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

  const fetchSavedCVs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/advisor/cv', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setSavedCVs(data.cvs || [])
      }
    } catch (error) {
      console.error('Fetch CVs error:', error)
    }
  }

  const fetchCostEstimate = async () => {
    try {
      const operationType = action === 'tailor' ? 'cv_tailor' : 'cv_build'
      const res = await fetch(`/api/advisor/pricing?operation=${operationType}`)
      
      if (res.ok) {
        const data = await res.json()
        setCostEstimate(data)
      }
    } catch (error) {
      console.error('Cost estimate error:', error)
    }
  }

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setUploadingCV(true)
    setError('')
    setUploadedCV(file)

    try {
      if (file.type === 'text/plain') {
        const text = await file.text()
        setUploadedCVText(text)
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
          setUploadedCVText(data.text || '')
        } else {
          setUploadedCVText(`[CV uploaded: ${file.name}]`)
        }
      }
    } catch (error) {
      console.error('CV upload error:', error)
      setError('Failed to process CV file')
    } finally {
      setUploadingCV(false)
    }
  }

  const removeUploadedCV = () => {
    setUploadedCV(null)
    setUploadedCVText('')
    if (cvFileInputRef.current) {
      cvFileInputRef.current.value = ''
    }
  }

  const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    setUploadingJD(true)
    setError('')
    setUploadedJD(file)

    try {
      if (file.type === 'text/plain') {
        const text = await file.text()
        setUploadedJDText(text)
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
          setUploadedJDText(data.text || data.rawText || '')
        } else {
          setUploadedJDText('')
          console.warn('JD file parse failed - user can add text in textbox')
        }
      }
    } catch (error) {
      console.error('JD upload error:', error)
      setUploadedJDText('')
    } finally {
      setUploadingJD(false)
    }
  }

  const removeUploadedJD = () => {
    setUploadedJD(null)
    setUploadedJDText('')
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = ''
    }
  }

  const handleGenerate = () => {
    if (!targetRole.trim()) {
      setError('Please enter a target role')
      return
    }
    
    if (action === 'tailor') {
      if (uploadingJD) {
        setError('Please wait for the job description file to finish processing.')
        return
      }
      
      const hasUploadedJDText = uploadedJDText.trim().length > 0
      const hasPastedJD = jobDescription.trim().length > 0
      const hasFile = uploadedJD !== null
      
      if (!hasUploadedJDText && !hasPastedJD) {
        if (hasFile) {
          setError("We couldn't read text from the uploaded file. Please paste the job description text below, or try a different file format.")
        } else {
          setError('Please upload or paste a job description.')
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

      setGenerationStatus('Preparing CV generation...')
      
      const progressStages = [
        'Analyzing target role requirements...',
        'Crafting professional summary...',
        'Optimizing skills for ATS...',
        'Enhancing work experience...',
        'Formatting education & certifications...',
        'Running quality checks...',
        'Finalizing your CV...'
      ]
      
      let stageIndex = 0
      const progressInterval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          setGenerationStatus(progressStages[stageIndex])
          stageIndex++
        }
      }, 2500)

      const finalJobDescription = action === 'tailor'
        ? [uploadedJDText.trim(), jobDescription.trim()].filter(Boolean).join('\n\n---\n\n')
        : undefined

      const res = await fetch('/api/advisor/cv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          targetRole,
          level,
          format,
          jobDescription: finalJobDescription,
          uploadedCVText: uploadedCVText || undefined,
          extraInstructions: action === 'build' ? extraInstructions : undefined
        })
      })

      clearInterval(progressInterval)
      setGenerationStatus('')

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate CV')
      }

      setCurrentCV(data.cv)
      setCvExtras({
        missingMetricsQuestions: data.missingMetricsQuestions,
        roleDiff: data.roleDiff,
        aiProvider: data.aiProvider,
      })
      setChargedAmount(data.cached ? '₦0 (cached)' : data.charged)
      refreshBalance()
      fetchSavedCVs()

    } catch (error: unknown) {
      setGenerationStatus('')
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate CV'
      setError(errorMessage)
    } finally {
      setGenerating(false)
      setGenerationStatus('')
    }
  }

  const handleExportPDF = async () => {
    if (!currentCV || !profileData) return
    
    setExporting('pdf')
    try {
      const blob = await generateCVPDF({
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        targetRole: currentCV.target_role,
        sections: currentCV.sections
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profileData.full_name.replace(/\s+/g, '_')}_CV.pdf`
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
    if (!currentCV || !profileData) return
    
    setExporting('docx')
    try {
      const blob = await generateCVDOCX({
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        targetRole: currentCV.target_role,
        sections: currentCV.sections
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profileData.full_name.replace(/\s+/g, '_')}_CV.docx`
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

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SabiLoader text="Loading CV Builder..." />
    </div>
  )
}

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-gray-200/50 flex flex-col lg:h-screen lg:sticky lg:top-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">CV Builder</h1>
              <p className="text-xs text-gray-500">Create ATS-optimized CVs</p>
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
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">Build CV</span>
                <p className="text-xs text-gray-500 mt-0.5">From your profile</p>
              </button>
              <button
                onClick={() => setAction('tailor')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  action === 'tailor'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">Tailor CV</span>
                <p className="text-xs text-gray-500 mt-0.5">To a job description</p>
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
              placeholder="e.g., Systems Analyst, Frontend Developer"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CV Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
            >
              <option value="ATS-1page">ATS-Friendly Resume (1 Page)</option>
              <option value="ATS-2page">ATS-Friendly Resume (2 Pages)</option>
              <option value="REMOTE_OPTIMISED_ATS">Remote Optimised Resume (ATS + Remote-Ready)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1.5 px-1">
              {format === 'ATS-1page' && 'Best for strict ATS + quick applications'}
              {format === 'ATS-2page' && 'Best for experienced candidates'}
              {format === 'REMOTE_OPTIMISED_ATS' && 'Best for remote/hybrid jobs'}
            </p>
          </div>

          {/* Upload CV Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Your Existing CV (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Import data from your current CV to enhance with AI
            </p>
            
            {uploadedCV ? (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-green-700 flex-1 truncate">{uploadedCV.name}</span>
                <button
                  onClick={removeUploadedCV}
                  className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => cvFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all group"
              >
                {uploadingCV ? (
                  <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Drop CV or <span className="text-green-600 font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT (max 5MB)</p>
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

          {/* Tailor Mode: Job Description */}
          {action === 'tailor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload or paste the job posting you&apos;re applying to
              </p>
              
              {uploadedJD ? (
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <File className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-700 flex-1 truncate">{uploadedJD.name}</span>
                  <button
                    onClick={removeUploadedJD}
                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => jdFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all mb-2 group"
                >
                  {uploadingJD ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mx-auto mb-1 transition-colors" />
                      <p className="text-xs text-gray-600">
                        Upload JD file or <span className="text-blue-600 font-medium">browse</span>
                      </p>
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
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
              />
            </div>
          )}

          {/* Build Mode: Extra Instructions */}
          {action === 'build' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Instructions (Optional)
              </label>
              <textarea
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g., 'Emphasize leadership experience' or 'Focus on cloud technologies'"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-none"
              />
            </div>
          )}

          {/* Status indicator */}
          {action === 'tailor' && (uploadedJDText.trim() || jobDescription.trim()) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700 font-medium">
                  Job description ready
                  {uploadedJDText.trim() && jobDescription.trim() && ' (file + pasted text)'}
                  {uploadedJDText.trim() && !jobDescription.trim() && ' (from file)'}
                  {!uploadedJDText.trim() && jobDescription.trim() && ' (from pasted text)'}
                </p>
              </div>
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">{generationStatus}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {chargedAmount && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  CV generated! Charged: {chargedAmount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button - Fixed */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white/80 backdrop-blur-sm">
          <button
            onClick={handleGenerate}
            disabled={generating || !profileComplete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-slate-100 overflow-auto">
        {currentCV ? (
          <div className="p-4 lg:p-6">
            {/* Preview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentCV.target_role} CV</h2>
                <p className="text-sm text-gray-500">
                  {currentCV.level} • {currentCV.format}
                  {currentCV.ats_score && (
                    <span className="ml-2 text-green-600 font-medium">
                      ATS Score: {currentCV.ats_score}%
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
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

            {/* ATS Insights Panel */}
            {(currentCV?.ats || cvExtras) && (
              <div className="mb-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  ATS Insights
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(currentCV?.ats?.score != null || currentCV?.ats_score != null) && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100">
                      <div className="text-xs text-gray-500 mb-1">ATS Score</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currentCV?.ats?.score || currentCV?.ats_score}%
                      </div>
                    </div>
                  )}
                  
                  {currentCV?.ats?.keyword_coverage_pct != null && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-100">
                      <div className="text-xs text-gray-500 mb-1">Keyword Coverage</div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentCV.ats.keyword_coverage_pct}%
                      </div>
                    </div>
                  )}
                  
                  {cvExtras?.roleDiff && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
                      <div className="text-xs text-gray-500 mb-1">Role Match</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.min(Math.round(cvExtras.roleDiff.compatibilityScore * 100) + 50, 100)}%
                      </div>
                      {cvExtras.roleDiff.toneShift !== 'same' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Tone: {cvExtras.roleDiff.toneShift === 'downshift' ? '↓ Simplified' : '↑ Enhanced'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {currentCV?.ats?.missing_keywords && currentCV.ats.missing_keywords.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-100/50">
                    <div className="text-xs font-medium text-amber-700 mb-2">
                      💡 Consider adding these keywords:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCV.ats.missing_keywords.slice(0, 8).map((kw, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                      {currentCV.ats.missing_keywords.length > 8 && (
                        <span className="text-xs text-gray-500">
                          +{currentCV.ats.missing_keywords.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {cvExtras?.missingMetricsQuestions && cvExtras.missingMetricsQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-100/50">
                    <div className="text-xs font-medium text-blue-700 mb-2">
                      📊 Add metrics to strengthen your CV:
                    </div>
                    <ul className="space-y-1">
                      {cvExtras.missingMetricsQuestions.map((q, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cvExtras?.aiProvider && (
                  <div className="mt-3 pt-3 border-t border-blue-100/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Generated by 🤖 SabiBot
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CV Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-1">
                  {profileData?.full_name || 'Your Name'}
                </h1>
                <p className="text-sm text-gray-600">
                  {[profileData?.email, profileData?.phone, profileData?.location].filter(Boolean).join(' • ')}
                </p>
              </div>

              {/* Summary */}
              {currentCV.sections.summary && (
                <section className="mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Professional Summary
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentCV.sections.summary}
                  </p>
                </section>
              )}

              {/* Skills */}
              {currentCV.sections.skills && currentCV.sections.skills.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Skills
                  </h3>
                  <p className="text-sm text-gray-700">
                    {currentCV.sections.skills.join(' • ')}
                  </p>
                </section>
              )}

              {/* Experience */}
              {currentCV.sections.experience && currentCV.sections.experience.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3 border-b border-gray-100 pb-1">
                    Work Experience
                  </h3>
                  <div className="space-y-4">
                    {currentCV.sections.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                            <p className="text-sm text-gray-600 italic">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 text-sm text-gray-700 space-y-1 mt-2">
                          {exp.bullets.filter(b => b.trim()).map((bullet, j) => (
                            <li key={j}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {currentCV.sections.education && currentCV.sections.education.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Education
                  </h3>
                  <div className="space-y-2">
                    {currentCV.sections.education.map((edu, i) => (
                      <div key={i} className="flex justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-gray-500">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects */}
              {currentCV.sections.projects && currentCV.sections.projects.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Projects
                  </h3>
                  <div className="space-y-3">
                    {currentCV.sections.projects.map((project, i) => (
                      <div key={i}>
                        <p className="font-semibold text-gray-900">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-gray-700">{project.description}</p>
                        )}
                        {project.technologies && project.technologies.length > 0 && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Technologies: {project.technologies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {currentCV.sections.certifications && currentCV.sections.certifications.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Certifications
                  </h3>
                  <div className="space-y-1">
                    {currentCV.sections.certifications.map((cert, i) => (
                      <p key={i} className="text-sm text-gray-700">
                       {cert.name} - {cert.issuer}{cert.year ? ` (${cert.year})` : ''}
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No CV Generated Yet</h3>
              <p className="text-sm text-gray-500">
                Fill in your target role and click &quot;Generate CV&quot; to create an ATS-optimized CV from your profile.
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Confirm Generation</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              This will cost <strong className="text-blue-600">{costEstimate?.costFormatted || '...'}</strong> from your wallet.
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
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
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