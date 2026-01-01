'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Sparkles, Loader2, Clock, Target, BookOpen, AlertCircle, Zap, Trophy, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getQuizQuestions, getQuestionCounts } from '@/lib/sabiquiz/quiz-utils'
import type { Material, QuestionCounts, DifficultyLevel } from '@/lib/sabiquiz/types'

// Question count options
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

// Challenge modes
type QuizMode = 'normal' | 'time_attack' | 'perfect_run' | 'boss_quiz'

const QUIZ_MODES = [
  {
    id: 'normal' as QuizMode,
    name: 'Normal',
    description: 'Standard quiz with no time limit.',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'time_attack' as QuizMode,
    name: 'Time Attack',
    description: 'Race against the countdown clock!',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'perfect_run' as QuizMode,
    name: 'Perfect Run',
    description: 'One wrong answer and it\'s over!',
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'boss_quiz' as QuizMode,
    name: 'Boss Quiz',
    description: 'Hard questions only. Are you ready?',
    icon: Skull,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
]

export default function QuizStartPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.materialId as string

  const [material, setMaterial] = useState<Material | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed')
  const [requestedCount, setRequestedCount] = useState<number>(10)
  const [mode, setMode] = useState<QuizMode>('normal')
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

  // Calculate available questions based on difficulty and mode
  const availableQuestions = useMemo(() => {
    if (mode === 'boss_quiz') {
      return questionCounts.hard
    }
    if (difficulty === 'mixed') {
      return questionCounts.total
    }
    return questionCounts[difficulty as DifficultyLevel] || 0
  }, [difficulty, mode, questionCounts])

  // Calculate final question count
  const finalCount = useMemo(() => {
    return Math.min(requestedCount, availableQuestions)
  }, [requestedCount, availableQuestions])

  // Time limit for time attack based on difficulty
  const timeLimitSeconds = useMemo(() => {
    if (mode === 'time_attack') {
      const timePerQuestion = 
        difficulty === 'hard' ? 30 :
        difficulty === 'medium' ? 20 :
        difficulty === 'easy' ? 12 :
        18 // mixed
      return finalCount * timePerQuestion
    }
    return null
  }, [mode, finalCount, difficulty])

  // Auto-select hard difficulty for boss quiz
  useEffect(() => {
    if (mode === 'boss_quiz') {
      setDifficulty('hard')
    }
  }, [mode])

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

      // Set default requested count based on available questions
      const defaultCount = Math.min(10, counts.total)
      setRequestedCount(defaultCount > 0 ? defaultCount : 10)

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (availableQuestions < 1) {
        throw new Error('No questions available for this selection.')
      }

      // For boss quiz, always use hard difficulty
      const actualDifficulty = mode === 'boss_quiz' ? 'hard' : difficulty

      const questionCount = finalCount
      const questions = await getQuizQuestions(materialId, actualDifficulty, questionCount)

      if (questions.length === 0) {
        throw new Error('No questions available')
      }

      const questionIds = questions.map(q => q.id)
      
      // Create attempt with mode and time limit
      const { data: attemptData, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .insert({
          user_id: user.id,
          material_id: materialId,
          title: `${getModeTitle(mode)} - ${new Date().toLocaleDateString()}`,
          category: material.category || '',
          difficulty: actualDifficulty === 'mixed' ? null : actualDifficulty,
          total_questions: questions.length,
          question_ids: questionIds,
          correct_answers: 0,
          score: 0,
          mode: mode,
          time_limit_seconds: timeLimitSeconds,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      router.push(`/sabiquiz/quiz/${attemptData.id}`)
    } catch (err: any) {
      console.error('Error starting quiz:', err)
      setError(err.message || 'Failed to start quiz')
      setStarting(false)
    }
  }

  function getModeTitle(m: QuizMode): string {
    switch (m) {
      case 'time_attack': return 'Time Attack'
      case 'perfect_run': return 'Perfect Run'
      case 'boss_quiz': return 'Boss Quiz'
      default: return 'Quiz'
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const canStartQuiz = finalCount >= 1

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
          <div className="space-y-6">
            {/* Challenge Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Mode</CardTitle>
                <CardDescription>Choose how you want to test yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {QUIZ_MODES.map((m) => {
                    const Icon = m.icon
                    const isSelected = mode === m.id
                    const isDisabled = m.id === 'boss_quiz' && questionCounts.hard === 0
                    
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isDisabled && setMode(m.id)}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                            : isSelected
                              ? `${m.borderColor} ${m.bgColor}`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? m.color : 'text-gray-400'}`} />
                        <p className={`font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                        {m.id === 'boss_quiz' && questionCounts.hard === 0 && (
                          <p className="text-xs text-red-500 mt-1">No hard questions</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>Configure your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Difficulty Selection - Hidden for Boss Quiz */}
                {mode !== 'boss_quiz' && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Difficulty Level</Label>
                    <RadioGroup 
                      value={difficulty} 
                      onValueChange={(value) => setDifficulty(value as DifficultyLevel | 'mixed')} 
                      className="space-y-3"
                    >
                      <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        questionCounts.easy === 0 ? 'opacity-50' : 'hover:border-red-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="easy" id="easy" disabled={questionCounts.easy === 0} />
                          <Label htmlFor="easy" className="cursor-pointer font-medium">Easy</Label>
                        </div>
                        <span className="text-sm text-gray-500">{questionCounts.easy} available</span>
                      </div>

                      <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        questionCounts.medium === 0 ? 'opacity-50' : 'hover:border-red-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="medium" id="medium" disabled={questionCounts.medium === 0} />
                          <Label htmlFor="medium" className="cursor-pointer font-medium">Medium</Label>
                        </div>
                        <span className="text-sm text-gray-500">{questionCounts.medium} available</span>
                      </div>

                      <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        questionCounts.hard === 0 ? 'opacity-50' : 'hover:border-red-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="hard" id="hard" disabled={questionCounts.hard === 0} />
                          <Label htmlFor="hard" className="cursor-pointer font-medium">Hard</Label>
                        </div>
                        <span className="text-sm text-gray-500">{questionCounts.hard} available</span>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg hover:border-red-300 transition-colors">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="mixed" id="mixed" />
                          <Label htmlFor="mixed" className="cursor-pointer font-medium">Mixed (All Levels)</Label>
                        </div>
                        <span className="text-sm text-gray-500">{questionCounts.total} available</span>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Boss Quiz Notice */}
                {mode === 'boss_quiz' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                      <Skull className="w-4 h-4" />
                      Boss Quiz uses hard questions only
                    </p>
                    <p className="text-xs text-red-600 mt-1">{questionCounts.hard} hard questions available</p>
                  </div>
                )}

                {/* Number of Questions Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Number of Questions</Label>
                  <select
                    value={requestedCount}
                    onChange={(e) => setRequestedCount(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count} questions
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    If fewer questions are available, we'll use all available questions.
                  </p>
                </div>

                {/* Availability Notice */}
                {availableQuestions < requestedCount && availableQuestions > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Only {availableQuestions} questions available. You'll answer {finalCount} questions.
                    </p>
                  </div>
                )}

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
                          Starting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Start New {getModeTitle(mode)} ({finalCount} questions)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleStartQuiz} 
                    disabled={!canStartQuiz || starting} 
                    className="w-full bg-red-600 hover:bg-red-700" 
                    size="lg"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start {getModeTitle(mode)} ({finalCount} questions)
                      </>
                    )}
                  </Button>
                )}

                {!canStartQuiz && (
                  <p className="text-sm text-gray-500 text-center">
                    No questions available for this selection
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quiz Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Questions</p>
                    <p className="text-sm text-gray-600">
                      {finalCount} of {availableQuestions} available
                    </p>
                  </div>
                </div>

               <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {mode === 'time_attack' ? 'Time Limit' : 'No Time Limit'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {mode === 'time_attack' && timeLimitSeconds
                        ? `${formatTime(timeLimitSeconds)} to complete`
                        : 'Take your time to think'
                      }
                    </p>
                    {mode === 'time_attack' && (
                      <p className="text-xs text-gray-400 mt-1">
                        {difficulty === 'hard' ? '30s' : 
                         difficulty === 'medium' ? '20s' : 
                         difficulty === 'easy' ? '12s' : '18s'} per question
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {mode === 'perfect_run' ? 'Zero Mistakes Allowed' : 'All Questions at Once'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {mode === 'perfect_run' 
                        ? 'One wrong answer ends the quiz'
                        : 'Review and answer at your pace'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mode-specific Tips */}
            <Card className={`${QUIZ_MODES.find(m => m.id === mode)?.bgColor || 'bg-red-50'} ${QUIZ_MODES.find(m => m.id === mode)?.borderColor || 'border-red-200'}`}>
              <CardHeader>
                <CardTitle className="text-gray-900">
                  {mode === 'normal' && 'Tips for Success'}
                  {mode === 'time_attack' && 'Time Attack Tips'}
                  {mode === 'perfect_run' && 'Perfect Run Tips'}
                  {mode === 'boss_quiz' && 'Boss Quiz Tips'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-800">
                  {mode === 'normal' && (
                    <>
                      <li>• Read each question carefully</li>
                      <li>• Use bookmarks to flag questions for review</li>
                      <li>• Check your answers before submitting</li>
                      <li>• Review explanations after completing</li>
                    </>
                  )}
                  {mode === 'time_attack' && (
                    <>
                      <li>• Don't spend too long on any single question</li>
                      <li>• Trust your first instinct</li>
                      <li>• Skip and come back if stuck</li>
                      <li>• Watch the timer!</li>
                    </>
                  )}
                  {mode === 'perfect_run' && (
                    <>
                      <li>• Read every option carefully</li>
                      <li>• Only answer when you're confident</li>
                      <li>• Take your time - there's no rush</li>
                      <li>• One mistake ends it all!</li>
                    </>
                  )}
                  {mode === 'boss_quiz' && (
                    <>
                      <li>• These are the hardest questions</li>
                      <li>• Think deeply before answering</li>
                      <li>• Eliminate obviously wrong answers first</li>
                      <li>• You've got this!</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}