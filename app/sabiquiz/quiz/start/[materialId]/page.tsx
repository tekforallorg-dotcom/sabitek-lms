'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Sparkles, Loader2, Clock, Target, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createQuizAttempt, getQuizQuestions, getQuestionCounts } from '@/lib/sabiquiz/quiz-utils'
import type { Material, QuestionCounts, DifficultyLevel } from '@/lib/sabiquiz/types'

const DEFAULT_QUESTION_COUNT = 10

export default function QuizStartPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.materialId as string

  const [material, setMaterial] = useState<Material | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCounts, setQuestionCounts] = useState<QuestionCounts>({
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  })
  const [inProgressAttempt, setInProgressAttempt] = useState<{ id: string; created_at: string } | null>(null)

  useEffect(() => {
    fetchMaterialAndQuestions()
  }, [materialId])

  async function checkForInProgressQuiz() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('sabiquiz_attempts')
        .select('id, created_at')
        .eq('material_id', materialId)
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for in-progress quiz:', error)
      }

      return data || null
    } catch (err) {
      console.error('Error:', err)
      return null
    }
  }

  async function fetchMaterialAndQuestions() {
    try {
      setLoading(true)

      const { data: materialData, error: materialError } = await supabase
        .from('sabiquiz_materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (materialError) throw materialError
      setMaterial(materialData)

      const counts = await getQuestionCounts(materialId)
      setQuestionCounts(counts)

      // Check for in-progress quiz
      const inProgress = await checkForInProgressQuiz()
      setInProgressAttempt(inProgress)
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Failed to load quiz data')
    } finally {
      setLoading(false)
    }
  }

  async function handleStartQuiz() {
    if (!material) return

    setStarting(true)
    setError(null)

    try {
      const availableCount = difficulty === 'mixed' 
        ? questionCounts.total 
        : questionCounts[difficulty as DifficultyLevel]

      if (availableCount < 5) {
        throw new Error(`Not enough questions. Need at least 5, but only ${availableCount} found.`)
      }

      const questionCount = Math.min(DEFAULT_QUESTION_COUNT, availableCount)
      const questions = await getQuizQuestions(materialId, difficulty, questionCount)

      if (questions.length === 0) {
        throw new Error('No questions available')
      }

      const questionIds = questions.map(q => q.id)
      const attemptId = await createQuizAttempt(materialId, difficulty, questions.length, questionIds)

      router.push(`/sabiquiz/quiz/${attemptId}`)
    } catch (err: any) {
      console.error('Error starting quiz:', err)
      setError(err.message || 'Failed to start quiz')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error && !material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canStartQuiz = (difficulty === 'mixed' && questionCounts.total >= 5) || 
    (difficulty !== 'mixed' && questionCounts[difficulty as DifficultyLevel] >= 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Materials
          </Button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Start Quiz</h1>
              <p className="text-gray-600 mt-1">{material?.filename}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Choose your difficulty level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Difficulty Level</Label>
                <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as DifficultyLevel | 'mixed')} className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy" className="cursor-pointer font-medium">Easy</Label>
                    </div>
                    <span className="text-sm text-gray-500">{questionCounts.easy} questions</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer font-medium">Medium</Label>
                    </div>
                    <span className="text-sm text-gray-500">{questionCounts.medium} questions</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard" className="cursor-pointer font-medium">Hard</Label>
                    </div>
                    <span className="text-sm text-gray-500">{questionCounts.hard} questions</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed" className="cursor-pointer font-medium">Mixed (All Levels)</Label>
                    </div>
                    <span className="text-sm text-gray-500">{questionCounts.total} questions</span>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {inProgressAttempt ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      You have an incomplete quiz from {new Date(inProgressAttempt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push(`/sabiquiz/quiz/${inProgressAttempt.id}`)} 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Resume Quiz
                  </Button>
                  <Button 
                    onClick={handleStartQuiz} 
                    disabled={!canStartQuiz || starting} 
                    variant="outline"
                    className="w-full" 
                    size="lg"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting New Quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start New Quiz
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleStartQuiz} disabled={!canStartQuiz || starting} className="w-full bg-red-600 hover:bg-red-700" size="lg">
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Quiz
                    </>
                  )}
                </Button>
              )}

              {!canStartQuiz && (
                <p className="text-sm text-gray-500 text-center">Need at least 5 questions to start</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Questions</p>
                    <p className="text-sm text-gray-600">Up to {DEFAULT_QUESTION_COUNT} questions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">No Time Limit</p>
                    <p className="text-sm text-gray-600">Take your time to think</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">All Questions at Once</p>
                    <p className="text-sm text-gray-600">Review and answer at your pace</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Tips for Success</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>• Read each question carefully</li>
                  <li>• Use bookmarks to flag questions for review</li>
                  <li>• Check your answers before submitting</li>
                  <li>• Review explanations after completing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}