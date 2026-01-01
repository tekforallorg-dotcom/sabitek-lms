'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Sparkles, CheckCircle, XCircle, Loader2, Bot, FileText, Brain, ClipboardCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { runPipeline, savePipelineResults, type PipelineResult, type PipelineProgress } from '@/lib/sabiquiz/pipeline'
import { getQuestionsForMaterial } from '@/lib/sabiquiz/question-generator'
import type { Material } from '@/lib/sabiquiz/types'
import type { Question } from '@/lib/sabiquiz/validators'

// USD to NGN conversion rate
const USD_TO_NGN = 1600

function formatNaira(usdAmount: number): string {
  const ngnAmount = usdAmount * USD_TO_NGN
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(ngnAmount)
}

// Generation steps for user-friendly display
const GENERATION_STEPS = [
  { id: 'init', label: 'Preparing your material', icon: FileText },
  { id: 'generating', label: 'Creating questions', icon: Brain },
  { id: 'reviewing', label: 'Checking quality', icon: ClipboardCheck },
  { id: 'selecting', label: 'Selecting best questions', icon: Star },
  { id: 'complete', label: 'Done!', icon: CheckCircle },
]

function getStepIndex(stage: string): number {
  const index = GENERATION_STEPS.findIndex(s => s.id === stage)
  return index >= 0 ? index : 0
}

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.id as string

  const [material, setMaterial] = useState<Material | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [questionCount, setQuestionCount] = useState(0)

  useEffect(() => {
    fetchMaterial()
    fetchExistingQuestions()
  }, [materialId])

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
      const existingQuestions = await getQuestionsForMaterial(materialId)
      setQuestions(existingQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleProgressUpdate = useCallback((p: PipelineProgress) => {
    setProgress(p)
    
    // Simulate question count during generation
    if (p.stage === 'generating') {
      const count = Math.floor((p.percent - 40) / 3)
      setQuestionCount(Math.min(10, Math.max(0, count)))
    } else if (p.stage === 'reviewing' || p.stage === 'selecting') {
      setQuestionCount(10)
    }
  }, [])

  async function handleGenerate() {
    if (!material || !material.extracted_text) {
      setError('No material text available')
      return
    }

    setGenerating(true)
    setError(null)
    setResult(null)
    setQuestionCount(0)
    setProgress({ stage: 'init', message: 'Starting...', percent: 0 })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const pipelineResult = await runPipeline(
        material.extracted_text,
        materialId,
        material.category || 'General',
        material.level || 'Foundation (Beginner)',
        {
          questionCount: 10,
          difficultyMix: { easy: 3, medium: 5, hard: 2 },
          useAdvancedPipeline: false,
          useAIReview: false,
        },
        handleProgressUpdate
      )

      if (!pipelineResult.success || pipelineResult.questions.length === 0) {
        throw new Error(pipelineResult.errors.join(', ') || 'No questions were generated. Please try again.')
      }

      await savePipelineResults(
        pipelineResult,
        materialId,
        user.id,
        material.category || 'General',
        material.level || 'Foundation (Beginner)'
      )

      setResult(pipelineResult)
      setQuestionCount(pipelineResult.questions.length)
      setProgress({ stage: 'complete', message: 'Done!', percent: 100 })

      await fetchExistingQuestions()

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate questions')
      setProgress(null)
    } finally {
      setGenerating(false)
    }
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const currentStepIndex = progress ? getStepIndex(progress.stage) : -1

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Quiz Questions</h1>
        <p className="text-sm text-gray-600">
          SabiBot will analyze your material and create quiz questions
        </p>
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
        </CardContent>
      </Card>

     {/* Existing Questions */}
      {questions.length > 0 && !generating && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>{questions.length} questions</strong> already generated for this material
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SabiBot Progress Display */}
      {progress && generating && (
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
                const isActive = index === currentStepIndex
                const isComplete = index < currentStepIndex
                const isPending = index > currentStepIndex

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
                    {isActive && progress.stage === 'generating' && (
                      <span className="ml-auto text-sm font-bold text-red-600">
                        {questionCount}/10
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Results - Simplified */}
      {result && result.success && (
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
                  SabiBot added {result.questions.length} new questions
                </p>
              </div>
            </div>

            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">+{result.questions.length}</div>
                <div className="text-xs text-gray-600">New</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {(result.stats.averageQualityScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {formatNaira(result.stats.costEstimateUSD)}
                </div>
                <div className="text-xs text-gray-600">Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!generating && !result && (
        <Button
          onClick={handleGenerate}
          disabled={generating || !material.extracted_text}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate 10 Questions
        </Button>
      )}

      {/* Start Quiz Button */}
      {(questions.length > 0 || (result && result.success)) && (
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => router.push(`/sabiquiz/quiz/start/${materialId}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            Start Quiz
          </Button>
          {result && (
            <Button
              onClick={() => {
                setResult(null)
                setProgress(null)
              }}
              variant="outline"
              className="w-full"
            >
              Generate More Questions
            </Button>
          )}
        </div>
      )}
    </div>
  )
}