'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  AlertCircle, 
  Target,
  Filter,
  Flame,
  Brain,
  HelpCircle,
  Sparkles,
  Clock,
  Zap,
  Star,
  ChevronRight,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWrongQuestionIds, getWeakTopics, createQuizAttempt } from '@/lib/sabiquiz/quiz-utils'
import type { Question } from '@/lib/sabiquiz/types'
import Link from 'next/link'

interface QuizAttempt {
  id: string
  material_id: string
  title: string
  score: number
  correct_answers: number
  total_questions: number
  time_taken_seconds: number
}

interface QuizResponse {
  id: string
  question_id: string
  selected_answer: number
  correct: boolean
  time_seconds: number
}

interface QuestionWithResponse extends Question {
  response: QuizResponse
}

interface TopicPerformance {
  topic: string
  correct: number
  total: number
  percentage: number
}

interface DifficultyPerformance {
  difficulty: string
  correct: number
  total: number
  percentage: number
}

interface WeakTopic {
  topic: string
  category: string
  mastery_percentage: number
  total_attempts: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<QuestionWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([])
  const [difficultyPerformance, setDifficultyPerformance] = useState<DifficultyPerformance[]>([])
  
  // New states for review/retry
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [startingRetry, setStartingRetry] = useState(false)

  useEffect(() => {
    fetchResults()
  }, [attemptId])

  async function fetchResults() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      const { data: attemptData, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      setAttempt(attemptData)

      const { data: responses, error: responsesError } = await supabase
        .from('sabiquiz_responses')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: true })

      if (responsesError) throw responsesError

      const questionIds = responses.map(r => r.question_id)
      const { data: questionsData, error: questionsError } = await supabase
        .from('sabiquiz_questions')
        .select('*')
        .in('id', questionIds)

      if (questionsError) throw questionsError

      const questionsWithResponses = questionsData.map(q => ({
        ...q,
        response: responses.find(r => r.question_id === q.id)!
      }))

      setQuestions(questionsWithResponses)
      calculatePerformance(questionsWithResponses)

      // Get wrong question IDs
      const wrongIds = await getWrongQuestionIds(attemptId)
      console.log('Wrong question IDs:', wrongIds)
      setWrongQuestionIds(wrongIds)

      // Get weak topics for this user
      if (user) {
        const weak = await getWeakTopics(user.id)
        setWeakTopics(weak)
      }

    } catch (err: any) {
      console.error('Error fetching results:', err)
      setError('Failed to load quiz results')
    } finally {
      setLoading(false)
    }
  }

  function calculatePerformance(questions: QuestionWithResponse[]) {
    const topicMap = new Map<string, { correct: number; total: number }>()
    const difficultyMap = new Map<string, { correct: number; total: number }>()

    questions.forEach(q => {
      const topic = q.topic || 'General'
      const difficulty = q.difficulty || 'medium'
      const isCorrect = q.response.correct

      if (!topicMap.has(topic)) {
        topicMap.set(topic, { correct: 0, total: 0 })
      }
      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, { correct: 0, total: 0 })
      }

      const topicStats = topicMap.get(topic)!
      const diffStats = difficultyMap.get(difficulty)!

      topicStats.total++
      diffStats.total++

      if (isCorrect) {
        topicStats.correct++
        diffStats.correct++
      }
    })

    const topicPerf = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    })).sort((a, b) => a.percentage - b.percentage)

    const diffPerf = Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
      difficulty,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }))

    setTopicPerformance(topicPerf)
    setDifficultyPerformance(diffPerf)
  }

  async function handleRetryWrongOnly() {
    if (wrongQuestionIds.length === 0 || !attempt) return
    
    setStartingRetry(true)
    try {
      const newAttemptId = await createQuizAttempt(
        attempt.material_id,
        'mixed',
        wrongQuestionIds.length,
        wrongQuestionIds
      )
      router.push(`/sabiquiz/quiz/${newAttemptId}`)
    } catch (err) {
      console.error('Error starting retry:', err)
      setStartingRetry(false)
    }
  }

  async function handleRetryWeakTopics() {
    if (weakTopics.length === 0) return
    
    setStartingRetry(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const topicNames = weakTopics.map(t => t.topic)
      
      // Fetch questions from weak topics
      const { data: weakQuestions, error } = await supabase
        .from('sabiquiz_questions')
        .select('id')
        .in('topic', topicNames)
        .eq('status', 'approved')
        .limit(10)

      if (error) throw error
      if (!weakQuestions || weakQuestions.length === 0) {
        alert('No questions available for weak topics')
        setStartingRetry(false)
        return
      }

      const questionIds = weakQuestions.map(q => q.id)
      
      // Create attempt without material_id (weak topics quiz)
      const { data: newAttempt, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .insert({
          user_id: user.id,
          material_id: null,
          title: `Weak Topics Practice - ${new Date().toLocaleDateString()}`,
          category: 'Weak Topics',
          difficulty: null,
          total_questions: questionIds.length,
          question_ids: questionIds,
          correct_answers: 0,
          score: 0,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      router.push(`/sabiquiz/quiz/${newAttempt.id}`)
    } catch (err) {
      console.error('Error starting weak topics retry:', err)
      setStartingRetry(false)
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  function getScoreColorCard(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getScoreMessage(score: number) {
    if (score >= 90) return 'Outstanding! 🎉'
    if (score >= 80) return 'Great job! 👏'
    if (score >= 70) return 'Good work! 👍'
    if (score >= 60) return 'Not bad! 💪'
    return 'Keep practicing! 📚'
  }

  function getScoreEmoji(score: number) {
    if (score >= 90) return '🏆'
    if (score >= 80) return '🌟'
    if (score >= 70) return '⭐'
    if (score >= 60) return '👍'
    return '📚'
  }

  function getRecommendations(score: number, topicPerf: TopicPerformance[], diffPerf: DifficultyPerformance[]) {
    const recommendations: string[] = []

    if (score < 60) {
      recommendations.push('Focus on reviewing the material thoroughly before retaking the quiz.')
    }

    const weakTopicsInQuiz = topicPerf.filter(t => t.percentage < 60)
    if (weakTopicsInQuiz.length > 0) {
      recommendations.push(`Study these topics: ${weakTopicsInQuiz.map(t => t.topic).join(', ')}`)
    }

    const hardQuestions = diffPerf.find(d => d.difficulty === 'hard')
    if (hardQuestions && hardQuestions.percentage < 50) {
      recommendations.push('Practice more hard-level questions to improve mastery.')
    }

    if (score >= 80) {
      recommendations.push('Excellent work! Try harder difficulty levels to challenge yourself.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Review the explanations and try the quiz again to reinforce your learning.')
    }

    return recommendations
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-pink-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-gray-300">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-4">{error || 'Quiz results not found'}</p>
            <Button 
              onClick={() => router.push('/sabiquiz/materials')}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl h-11"
            >
              Back to Materials
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const score = attempt.score || 0
  const correctAnswers = attempt.correct_answers || 0
  const totalQuestions = attempt.total_questions || questions.length
  const recommendations = getRecommendations(score, topicPerformance, difficultyPerformance)
  
  // Filter questions based on showWrongOnly
  const displayedQuestions = showWrongOnly 
    ? questions.filter(q => !q.response.correct)
    : questions

  const wrongCount = wrongQuestionIds.length
  const isPerfectScore = wrongCount === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl rotate-12 blur-sm" />
        <div className="absolute bottom-20 left-[10%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl rotate-45 blur-sm" />

        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
          {/* Top Row: Back Button */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/sabiquiz/materials')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Materials</span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
              </div>
              <span className="font-bold text-xl text-white">SabiQuiz</span>
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-4 border border-white/10">
              <Trophy className="w-3 h-3" />
              Quiz Complete
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl">{getScoreEmoji(score)}</span>
              <div>
                <h1 className={`text-5xl sm:text-6xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </h1>
                <p className="text-gray-400 text-lg">{getScoreMessage(score)}</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm max-w-md mx-auto">{attempt.title}</p>
          </div>

          {/* Stats Grid in Hero */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/20">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{correctAnswers}</p>
              <p className="text-xs text-gray-400">Correct</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-500/20">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{totalQuestions - correctAnswers}</p>
              <p className="text-xs text-gray-400">Incorrect</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{formatTime(attempt.time_taken_seconds || 0)}</p>
              <p className="text-xs text-gray-400">Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Practice Options */}
        <Card className="mb-6 rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900">Practice Options</span>
                <p className="text-xs text-gray-500 font-normal mt-0.5">Continue improving your knowledge</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {isPerfectScore ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Perfect Score! No wrong answers to retry.
                </p>
              </div>
            ) : (
              <button
                onClick={handleRetryWrongOnly}
                disabled={startingRetry}
                className="w-full flex items-center justify-between p-4 border-2 border-red-200 rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Retry Wrong Only</p>
                    <p className="text-xs text-gray-500">{wrongCount} questions to practice</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            {weakTopics.length > 0 && (
              <button
                onClick={handleRetryWeakTopics}
                disabled={startingRetry}
                className="w-full flex items-center justify-between p-4 border-2 border-orange-200 rounded-2xl hover:bg-orange-50 hover:border-orange-300 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Brain className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Practice Weak Topics</p>
                    <p className="text-xs text-gray-500">{weakTopics.length} topics below 60%</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            <button
              onClick={() => router.push(`/sabiquiz/quiz/start/${attempt.material_id}`)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Retake Full Quiz</p>
                  <p className="text-xs text-gray-500">Start fresh with all questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </button>
          </CardContent>
        </Card>

        {/* Topic Performance */}
        {topicPerformance.length > 0 && (
          <Card className="mb-6 rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Performance by Topic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topicPerformance.map((topic) => (
                <div key={topic.topic} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{topic.topic}</span>
                    <span className={`font-semibold ${
                      topic.percentage >= 80 ? 'text-green-600' :
                      topic.percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {topic.correct}/{topic.total} ({topic.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        topic.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        topic.percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Difficulty Performance */}
        {difficultyPerformance.length > 0 && (
          <Card className="mb-6 rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Target className="w-5 h-5 text-white" />
                </div>
                Performance by Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {difficultyPerformance.map((diff) => (
                  <div key={diff.difficulty} className={`text-center p-4 rounded-2xl border-2 ${
                    diff.difficulty === 'easy' ? 'bg-green-50 border-green-200' :
                    diff.difficulty === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-xs font-medium mb-1 capitalize ${
                      diff.difficulty === 'easy' ? 'text-green-700' :
                      diff.difficulty === 'medium' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>{diff.difficulty}</p>
                    <p className={`text-2xl font-bold ${
                      diff.difficulty === 'easy' ? 'text-green-600' :
                      diff.difficulty === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{diff.percentage}%</p>
                    <p className="text-xs text-gray-500">{diff.correct}/{diff.total}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card className="mb-6 rounded-2xl border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900">Recommendations</span>
                <p className="text-xs text-gray-500 font-normal mt-0.5">Tips to improve your performance</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Review Answers Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            Review Answers
          </h3>
          
          {wrongCount > 0 && (
            <Button
              variant={showWrongOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowWrongOnly(!showWrongOnly)}
              className={`rounded-xl ${showWrongOnly ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white" : ""}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showWrongOnly ? `Showing Wrong (${wrongCount})` : `Show Wrong Only (${wrongCount})`}
            </Button>
          )}
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          {displayedQuestions.map((q, index) => {
            const isCorrect = q.response.correct
            const selectedAnswer = q.response.selected_answer
            const correctAnswer = q.correct_answer
            
            // Find original index for numbering
            const originalIndex = questions.findIndex(orig => orig.id === q.id)

            return (
              <Card key={q.id} className={`rounded-2xl border-0 shadow-sm overflow-hidden ${
                isCorrect ? 'ring-2 ring-green-200 ring-offset-2' : 'ring-2 ring-red-200 ring-offset-2'
              }`}>
                <CardHeader className={`pb-3 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium flex-1 flex items-start gap-3">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 ${
                        isCorrect 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {originalIndex + 1}
                      </span>
                      <span className="text-gray-900 leading-relaxed">{q.question}</span>
                    </CardTitle>
                    {isCorrect ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-100 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2">
                        <CheckCircle className="w-4 h-4" />
                        Correct
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-red-100 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2">
                        <XCircle className="w-4 h-4" />
                        Wrong
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => {
                      const isSelected = selectedAnswer === optIndex
                      const isCorrectOption = correctAnswer === optIndex
                      
                      let bgColor = 'bg-gray-50 border-gray-200'
                      let textColor = 'text-gray-700'
                      
                      if (isCorrectOption) {
                        bgColor = 'bg-green-50 border-green-300'
                        textColor = 'text-green-800'
                      } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-50 border-red-300'
                        textColor = 'text-red-800'
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-4 rounded-xl border-2 ${bgColor}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`font-bold text-sm ${
                                isCorrectOption ? 'text-green-600' : 
                                isSelected && !isCorrect ? 'text-red-600' : 
                                'text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className={`text-sm ${textColor}`}>{option}</span>
                            </div>
                            {isCorrectOption && (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {q.rationale && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800">{q.rationale}</p>
                    </div>
                  )}

                  {/* Why wrong / Why correct */}
                  {!isCorrect && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                        💡 Takeaway
                      </p>
                      <p className="text-sm text-amber-800">
                        The correct answer is <strong>{String.fromCharCode(65 + correctAnswer)}</strong>. 
                        Review this topic to strengthen your understanding.
                      </p>
                    </div>
                  )}

                  {q.topic && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <BookOpen className="w-3 h-3" />
                        {q.topic}
                      </span>
                      {q.difficulty && (
                        <span className={`capitalize px-2.5 py-1 rounded-lg font-medium ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 mt-8 mb-6">
          <Button
            onClick={() => router.push(`/sabiquiz/quiz/start/${attempt.material_id}`)}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl h-12 shadow-lg shadow-red-500/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
          <Button
            onClick={() => router.push('/sabiquiz/materials')}
            variant="outline"
            className="flex-1 rounded-xl h-12"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Materials
          </Button>
        </div>
      </div>
    </div>
  )
}