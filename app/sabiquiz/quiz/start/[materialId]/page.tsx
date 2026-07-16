'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Clock, 
  Target, 
  BookOpen, 
  AlertCircle, 
  Zap, 
  Trophy, 
  Skull,
  FileText,
  Play,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getQuizQuestions, getQuestionCounts } from '@/lib/sabiquiz/quiz-utils'
import type { Material, QuestionCounts, DifficultyLevel } from '@/lib/sabiquiz/types'
import SabiLoader from '@/components/ui/SabiLoader'

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
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
  },
  {
    id: 'time_attack' as QuizMode,
    name: 'Time Attack',
    description: 'Race against the countdown clock!',
    icon: Zap,
    gradient: 'from-orange-500 to-amber-600',
    lightBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
  },
  {
    id: 'perfect_run' as QuizMode,
    name: 'Perfect Run',
    description: 'One wrong answer and it\'s over!',
    icon: Trophy,
    gradient: 'from-yellow-500 to-amber-600',
    lightBg: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-600',
  },
  {
    id: 'boss_quiz' as QuizMode,
    name: 'Boss Quiz',
    description: 'Hard questions only. Are you ready?',
    icon: Skull,
    gradient: 'from-red-500 to-pink-600',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
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

  const selectedMode = QUIZ_MODES.find(m => m.id === mode) || QUIZ_MODES[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <SabiLoader text="Loading quiz..." size="lg" />
        </div>
      </div>
    )
  }

  if (error && !material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="w-full rounded-xl h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const canStartQuiz = finalCount >= 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Materials</span>
          </button>

          {/* Title Section */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Play className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-2 border border-white/10">
                <Sparkles className="w-3 h-3" />
                Configure Your Quiz
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Start Quiz</h1>
              <p className="text-gray-400 text-sm mt-1">Choose your challenge mode and settings</p>
            </div>
          </div>

          {/* Material Info Card in Hero */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{material?.filename}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-medium">
                    {material?.category}
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 text-gray-300 rounded-lg text-xs font-medium">
                    {questionCounts.total} questions
                  </span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold text-white">{finalCount}</div>
                <div className="text-xs text-gray-400">selected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Challenge Mode Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Challenge Mode</h3>
                    <p className="text-xs text-gray-500">Choose how you want to test yourself</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
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
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                            : isSelected
                              ? `${m.borderColor} ${m.lightBg}`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          isSelected 
                            ? `bg-gradient-to-br ${m.gradient} shadow-lg`
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                        {m.id === 'boss_quiz' && questionCounts.hard === 0 && (
                          <p className="text-xs text-red-500 mt-2">No hard questions</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Quiz Settings</h3>
                    <p className="text-xs text-gray-500">Configure your quiz parameters</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-6">
                {/* Difficulty Selection - Hidden for Boss Quiz */}
                {mode !== 'boss_quiz' && (
                  <div>
                    <Label className="text-sm font-semibold mb-3 block text-gray-900">Difficulty Level</Label>
                    <RadioGroup 
                      value={difficulty} 
                      onValueChange={(value) => setDifficulty(value as DifficultyLevel | 'mixed')} 
                      className="space-y-2"
                    >
                      {[
                        { value: 'easy', label: 'Easy', count: questionCounts.easy, color: 'green' },
                        { value: 'medium', label: 'Medium', count: questionCounts.medium, color: 'yellow' },
                        { value: 'hard', label: 'Hard', count: questionCounts.hard, color: 'red' },
                        { value: 'mixed', label: 'Mixed (All Levels)', count: questionCounts.total, color: 'purple' },
                      ].map((item) => (
                        <div 
                          key={item.value}
                          className={`flex items-center justify-between p-3 border rounded-xl transition-all ${
                            item.count === 0 && item.value !== 'mixed'
                              ? 'opacity-50 cursor-not-allowed' 
                              : difficulty === item.value
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem 
                              value={item.value} 
                              id={item.value} 
                              disabled={item.count === 0 && item.value !== 'mixed'} 
                            />
                            <Label htmlFor={item.value} className="cursor-pointer font-medium text-sm">
                              {item.label}
                            </Label>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {item.count} available
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Boss Quiz Notice */}
                {mode === 'boss_quiz' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Skull className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-red-800 font-semibold">Boss Quiz uses hard questions only</p>
                        <p className="text-xs text-red-600 mt-0.5">{questionCounts.hard} hard questions available</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Number of Questions Selection */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block text-gray-900">Number of Questions</Label>
                  <select
                    value={requestedCount}
                    onChange={(e) => setRequestedCount(Number(e.target.value))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-sm"
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
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Only {availableQuestions} questions available. You'll answer <span className="font-semibold">{finalCount}</span> questions.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {inProgressAttempt ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-blue-800">
                        You have an incomplete quiz from {new Date(inProgressAttempt.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push(`/sabiquiz/quiz/${inProgressAttempt.id}`)} 
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20" 
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Resume Quiz
                    </Button>
                    <Button 
                      onClick={handleStartQuiz} 
                      disabled={!canStartQuiz || starting} 
                      variant="outline"
                      className="w-full h-12 rounded-xl border-2" 
                      size="lg"
                    >
                      {starting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Start New {getModeTitle(mode)} ({finalCount} questions)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleStartQuiz} 
                    disabled={!canStartQuiz || starting} 
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20" 
                    size="lg"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
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
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quiz Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${selectedMode.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <selectedMode.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Quiz Details</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Questions</p>
                    <p className="text-sm text-gray-600">
                      {finalCount} of {availableQuestions} available
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 bg-gradient-to-br ${
                    mode === 'time_attack' ? 'from-orange-500 to-amber-600' : 'from-green-500 to-emerald-600'
                  } rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
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

                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 bg-gradient-to-br ${
                    mode === 'perfect_run' ? 'from-yellow-500 to-amber-600' : 'from-purple-500 to-pink-600'
                  } rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
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
              </div>
            </div>

            {/* Mode-specific Tips */}
            <div className={`rounded-2xl border overflow-hidden ${selectedMode.lightBg} ${selectedMode.borderColor}`}>
              <div className="p-5 border-b border-opacity-50" style={{ borderColor: 'inherit' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${selectedMode.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {mode === 'normal' && 'Tips for Success'}
                    {mode === 'time_attack' && 'Time Attack Tips'}
                    {mode === 'perfect_run' && 'Perfect Run Tips'}
                    {mode === 'boss_quiz' && 'Boss Quiz Tips'}
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-3">
                  {mode === 'normal' && (
                    <>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        Read each question carefully
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        Use bookmarks to flag questions for review
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        Check your answers before submitting
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        Review explanations after completing
                      </li>
                    </>
                  )}
                  {mode === 'time_attack' && (
                    <>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        Don't spend too long on any single question
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        Trust your first instinct
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        Skip and come back if stuck
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        Watch the timer!
                      </li>
                    </>
                  )}
                  {mode === 'perfect_run' && (
                    <>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        Read every option carefully
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        Only answer when you're confident
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        Take your time - there's no rush
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        One mistake ends it all!
                      </li>
                    </>
                  )}
                  {mode === 'boss_quiz' && (
                    <>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        These are the hardest questions
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Think deeply before answering
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Eliminate obviously wrong answers first
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        You've got this!
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}