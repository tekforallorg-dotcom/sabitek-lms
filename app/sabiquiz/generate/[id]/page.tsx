'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateAndSaveQuestions, getQuestionsForMaterial } from '@/lib/sabiquiz/question-generator'
import type { Material } from '@/lib/sabiquiz/types'
import type { Question } from '@/lib/sabiquiz/validators'

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.id as string

  const [material, setMaterial] = useState<Material | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

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

  async function handleGenerate() {
    if (!material || !material.extracted_text) {
      setError('No material text available')
      return
    }

    setGenerating(true)
    setError(null)
    setResult(null)
    setProgress('🤖 SabiBot is generating questions...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const generationResult = await generateAndSaveQuestions(
        material.extracted_text,
        materialId,
        user.id,
        material.category || 'General',
        material.level || 'Unknown'
      )

      setResult(generationResult)
      setProgress('✅ Questions generated successfully!')
      
      await fetchExistingQuestions()

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate questions')
      setProgress('')
    } finally {
      setGenerating(false)
    }
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

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
          AI will create 10 multiple-choice questions from this material
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Material Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Filename:</span>
            <span className="font-medium">{material.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium">{material.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Level:</span>
            <span className="font-medium">{material.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Text Length:</span>
            <span className="font-medium">
              {material.extracted_text?.length || 0} characters
            </span>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
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

      {result && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-800">Questions Generated:</span>
              <span className="font-medium">{result.totalGenerated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Passed Validation:</span>
              <span className="font-medium">{result.passedValidation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Quality Score:</span>
              <span className="font-medium">
                {(result.overallQualityScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Cost:</span>
              <span className="font-medium">${result.costEstimate.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {progress && generating && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              <p className="text-sm text-gray-700">{progress}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {progress && !generating && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">{progress}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleGenerate}
        disabled={generating || !material.extracted_text}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
        size="lg"
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Generating Questions...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate 10 Questions
          </>
        )}
      </Button>

      {questions.length > 0 && (
        <div className="mt-6">
          <Button
            onClick={() => router.push(`/sabiquiz/quiz/start/${materialId}`)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Start Quiz
          </Button>
        </div>
      )}
    </div>
  )
}