'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/hooks/useWallet'
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Bot, 
  FileText, 
  Brain, 
  ClipboardCheck, 
  Star,
  Wallet,
  Zap,
  Play,
  Plus,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { Material } from '@/lib/sabiquiz/types'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  difficulty: string
  topic: string
}

interface CostEstimate {
  costKobo: number
  costFormatted: string
  displayName: string
}

interface GenerationStats {
  questionsGenerated: number
  averageQualityScore: number
  costEstimateUSD: number
  costEstimateNGN: number
}

// Generation steps for user-friendly display
const GENERATION_STEPS = [
  { id: 'init', label: 'Preparing your material', icon: FileText },
  { id: 'generating', label: 'Creating questions', icon: Brain },
  { id: 'reviewing', label: 'Checking quality', icon: ClipboardCheck },
  { id: 'selecting', label: 'Selecting best questions', icon: Star },
  { id: 'complete', label: 'Done!', icon: CheckCircle },
]

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const { balance, refreshBalance } = useWallet()
  const materialId = params.id as string

  const [material, setMaterial] = useState<Material | null>(null)
  const [generating, setGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [newQuestionsCount, setNewQuestionsCount] = useState(0)
  
  // Pricing state
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [chargedAmount, setChargedAmount] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterial()
    fetchExistingQuestions()
    fetchCostEstimate()
  }, [materialId])

  async function fetchCostEstimate() {
    try {
      const res = await fetch('/api/sabiquiz/generate?operation=quiz_generate')
      if (res.ok) {
        const data = await res.json()
        setCostEstimate(data)
      }
    } catch (error) {
      console.error('Cost estimate error:', error)
    }
  }

  async function fetchMaterial() {
    const { data, error } = await supabase
      .from('sabiquiz_materials')
      .select('*')
      .eq('id', materialId)
      .single()

    if (error) {
      console.error('Error fetching material:', error)
      setError('Material not found')
      return
    }

    setMaterial(data)
  }

  async function fetchExistingQuestions() {
    try {
      const { data } = await supabase
        .from('sabiquiz_questions')
        .select('*')
        .eq('material_id', materialId)

      if (data && data.length > 0) {
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  async function handleGenerate() {
    if (!material || !material.extracted_text) {
      setError('No material text available')
      return
    }

    setShowConfirmModal(false)
    setGenerating(true)
    setError(null)
    setStats(null)
    setGenerationComplete(false)
    setCurrentStep(0)
    setChargedAmount(null)
    setNewQuestionsCount(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, 3))
      }, 2000)

      const response = await fetch('/api/sabiquiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          materialId,
          materialText: material.extracted_text,
          category: material.category || 'General',
          level: material.level || 'Foundation (Beginner)',
          questionCount: 10,
        }),
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient wallet balance. Please top up to continue.')
        }
        throw new Error(data.error || 'Failed to generate questions')
      }

      const newQuestions = data.questions || []
      setNewQuestionsCount(newQuestions.length)
      setStats(data.stats)
      setChargedAmount(data.charged)
      setCurrentStep(4) // Complete
      setGenerationComplete(true)
      
      // Refresh questions list and balance
      await fetchExistingQuestions()
      refreshBalance()

    } catch (err: unknown) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
      setCurrentStep(-1)
    } finally {
      setGenerating(false)
    }
  }

  const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`

  if (!material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-pink-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    )
  }

  const hasExistingQuestions = questions.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Back Button + Wallet Row */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/sabiquiz/materials')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Materials</span>
            </button>

            {/* Wallet Display */}
            <div className="flex items-center gap-2">
              {costEstimate && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm text-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-amber-500/30">
                  <Zap className="w-3 h-3" />
                  {costEstimate.costFormatted}/gen
                </div>
              )}
              <Link
                href="/account/wallet"
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
              >
                <Wallet className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-white">
                  {balance?.balanceFormatted || '₦0'}
                </span>
              </Link>
              <Link
                href="/account/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Title Section */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-2 border border-white/10">
                <Sparkles className="w-3 h-3" />
                AI-Powered Generation
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Generate Quiz Questions</h1>
              <p className="text-gray-400 text-sm">SabiBot will analyze your material and create quiz questions</p>
            </div>
          </div>

          {/* Material Info Card in Hero */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mt-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{material.filename}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-medium">
                    {material.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 text-gray-300 rounded-lg text-xs font-medium">
                    {material.level}
                  </span>
                </div>
              </div>
              {hasExistingQuestions && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">{questions.length}</div>
                  <div className="text-xs text-gray-400">questions</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                {error.includes('wallet') && (
                  <button
                    onClick={() => router.push('/account/wallet')}
                    className="mt-1 text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Top up wallet →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SabiBot Progress Display */}
        {generating && (
          <div className="mb-6 bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-6">
            {/* SabiBot Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">SabiBot is working...</h3>
                <p className="text-sm text-gray-600">Creating your quiz questions</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 mb-6">
              {GENERATION_STEPS.slice(0, -1).map((step, index) => {
                const StepIcon = step.icon
                const isActive = index === currentStep
                const isComplete = index < currentStep

                return (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive ? 'bg-white border-2 border-red-200 shadow-sm' :
                      isComplete ? 'bg-green-50 border border-green-200' :
                      'bg-white/50 border border-gray-100 opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/20' :
                      isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-gray-900' :
                      isComplete ? 'text-green-800' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((currentStep + 1) * 25, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Results */}
        {generationComplete && (
          <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            {/* Success Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Questions Ready!</h3>
                <p className="text-sm text-gray-600">
                  SabiBot added {newQuestionsCount} new questions
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600">+{newQuestionsCount}</div>
                <div className="text-xs text-gray-600 mt-1">New Questions</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600">
                  {stats ? `${(stats.averageQualityScore * 100).toFixed(0)}%` : '—'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Quality Score</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600">{chargedAmount}</div>
                <div className="text-xs text-gray-600 mt-1">Charged</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!generating && (
          <div className="space-y-3">
            {/* Start Quiz - if questions exist */}
            {hasExistingQuestions && (
              <Button
                onClick={() => router.push(`/sabiquiz/quiz/start/${materialId}`)}
                className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-base font-semibold rounded-2xl shadow-lg shadow-red-500/20"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Quiz ({questions.length} questions)
              </Button>
            )}
            
            {/* Generate Button */}
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={!material.extracted_text}
              variant={hasExistingQuestions ? 'outline' : 'default'}
              className={!hasExistingQuestions 
                ? 'w-full h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-base font-semibold rounded-2xl shadow-lg shadow-red-500/20' 
                : 'w-full h-14 rounded-2xl border-2 border-gray-200 hover:border-gray-300 text-base font-semibold'
              }
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {hasExistingQuestions ? 'Generate 10 More Questions' : 'Generate 10 Questions'}
            </Button>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Generate Quiz Questions</h3>
                  <p className="text-sm text-white/80">10 AI-powered questions</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                SabiBot will analyze your material and create 10 high-quality quiz questions.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-semibold text-gray-900">{costEstimate?.costFormatted || '₦50'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your balance:</span>
                  <span className="font-semibold text-gray-900">{balance?.balanceFormatted || '₦0'}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">After charge:</span>
                  <span className="font-semibold text-green-600">
                    {balance && costEstimate 
                      ? formatNaira(balance.balanceKobo - costEstimate.costKobo)
                      : '...'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!balance || balance.balanceKobo < (costEstimate?.costKobo || 0)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
                >
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Generate
                </button>
              </div>

              {balance && costEstimate && balance.balanceKobo < costEstimate.costKobo && (
                <button
                  onClick={() => router.push('/account/wallet')}
                  className="w-full mt-4 text-sm text-red-600 hover:text-red-700 font-medium flex items-center justify-center gap-1"
                >
                  <Wallet className="w-4 h-4" />
                  Top up wallet →
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}