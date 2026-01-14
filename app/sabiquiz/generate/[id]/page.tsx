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
  Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const hasExistingQuestions = questions.length > 0

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/sabiquiz/materials')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Materials
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Quiz Questions</h1>
            <p className="text-sm text-gray-600">
              SabiBot will analyze your material and create quiz questions
            </p>
          </div>
          {/* Wallet & Cost Badge */}
          <div className="flex items-center gap-2">
            {costEstimate && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                {costEstimate.costFormatted}/gen
              </div>
            )}
            <button
              onClick={() => router.push('/account/wallet')}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
            >
              <Wallet className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {balance?.balanceFormatted || '₦0'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Material Details */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Material Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Filename:</span>
            <span className="font-medium truncate max-w-[60%]">{material.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{material.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Level:</span>
            <span className="font-medium">{material.level}</span>
          </div>
          {hasExistingQuestions && (
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Questions available:</span>
              <span className="font-medium text-green-600">{questions.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                {error.includes('wallet') && (
                  <button
                    onClick={() => router.push('/account/wallet')}
                    className="mt-1 text-xs text-red-600 underline"
                  >
                    Top up wallet →
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SabiBot Progress Display */}
      {generating && (
        <Card className="mb-6 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            {/* SabiBot Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SabiBot is working...</h3>
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
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive ? 'bg-red-100 border border-red-200' :
                      isComplete ? 'bg-green-50' :
                      'bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-red-600 text-white' :
                      isComplete ? 'bg-green-500 text-white' :
                      'bg-gray-300 text-gray-500'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-red-900' :
                      isComplete ? 'text-green-800' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((currentStep + 1) * 25, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Results */}
      {generationComplete && (
        <Card className="mb-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardContent className="p-6">
            {/* Success Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Questions Ready!</h3>
                <p className="text-sm text-gray-600">
                  SabiBot added {newQuestionsCount} new questions
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">+{newQuestionsCount}</div>
                <div className="text-xs text-gray-600">New</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {stats ? `${(stats.averageQualityScore * 100).toFixed(0)}%` : '—'}
                </div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">{chargedAmount}</div>
                <div className="text-xs text-gray-600">Charged</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!generating && (
        <div className="space-y-3">
          {/* Start Quiz - if questions exist */}
          {hasExistingQuestions && (
            <Button
              onClick={() => router.push(`/sabiquiz/quiz/start/${materialId}`)}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              Start Quiz ({questions.length} questions)
            </Button>
          )}
          
          {/* Generate Button */}
          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={!material.extracted_text}
            variant={hasExistingQuestions ? 'outline' : 'default'}
            className={!hasExistingQuestions ? 'w-full bg-red-600 hover:bg-red-700 text-white' : 'w-full'}
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {hasExistingQuestions ? 'Generate 10 More Questions' : 'Generate 10 Questions'}
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm bg-white rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Quiz Questions</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will generate 10 AI-powered questions from your material.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">{costEstimate?.costFormatted || '₦50'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Your balance:</span>
                <span className="font-medium">{balance?.balanceFormatted || '₦0'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">After charge:</span>
                <span className="font-medium">
                  {balance && costEstimate 
                    ? formatNaira(balance.balanceKobo - costEstimate.costKobo)
                    : '...'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!balance || balance.balanceKobo < (costEstimate?.costKobo || 0)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>

            {balance && costEstimate && balance.balanceKobo < costEstimate.costKobo && (
              <button
                onClick={() => router.push('/account/wallet')}
                className="w-full mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Top up wallet →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}