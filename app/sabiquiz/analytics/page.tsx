'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Target, BookOpen, Clock, Award, ArrowRight, Calendar } from 'lucide-react'

interface QuizAttempt {
  id: string
  score: number
  correct_answers: number
  total_questions: number
  completed_at: string
  material_name: string
}

interface AnalyticsData {
  totalQuizzes: number
  averageScore: number
  bestScore: number
  totalQuestions: number
  recentAttempts: QuizAttempt[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalQuestions: 0,
    recentAttempts: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

async function fetchAnalytics() {
  try {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: rawAttempts, error } = await supabase
      .from('sabiquiz_attempts')
      .select(`
        id,
        score,
        correct_answers,
        total_questions,
        completed_at,
        material_id,
        sabiquiz_materials!material_id(filename)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (error) throw error

    if (rawAttempts && rawAttempts.length > 0) {
      // Transform the data to match our interface
      const attempts: QuizAttempt[] = rawAttempts.map((attempt: any) => ({
        id: attempt.id,
        score: attempt.score,
        correct_answers: attempt.correct_answers,
        total_questions: attempt.total_questions,
        completed_at: attempt.completed_at,
        material_name: attempt.sabiquiz_materials?.filename || 'Unknown Material'
      }))

      const totalQuizzes = attempts.length
      const averageScore = Math.round(
        attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalQuizzes
      )
      const bestScore = Math.max(...attempts.map(a => a.score || 0))
      const totalQuestions = attempts.reduce((sum, a) => sum + (a.total_questions || 0), 0)

      setData({
        totalQuizzes,
        averageScore,
        bestScore,
        totalQuestions,
        recentAttempts: attempts.slice(0, 10),
      })
    }
  } catch (err) {
    console.error('Error fetching analytics:', err)
  } finally {
    setLoading(false)
  }
}

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (data.totalQuizzes === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your learning progress and performance</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
            <p className="text-gray-600 mb-6">Complete some quizzes to see your progress here!</p>
            <Button onClick={() => router.push('/sabiquiz/materials')} className="bg-red-600 hover:bg-red-700">
              Browse Materials
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your learning progress and performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Quizzes</CardTitle>
              <Trophy className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalQuizzes}</div>
              <p className="text-xs text-gray-500 mt-1">Quizzes completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              <Target className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Across all quizzes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Best Score</CardTitle>
              <Award className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.bestScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Personal best</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Questions Answered</CardTitle>
              <BookOpen className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalQuestions}</div>
              <p className="text-xs text-gray-500 mt-1">Total questions</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Performance Overview
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Your progress at a glance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.averageScore >= 80 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">🎉 Excellent Performance!</p>
                  <p className="text-xs text-green-600 mt-1">You're mastering the material. Keep up the great work!</p>
                </div>
              )}
              
              {data.averageScore >= 60 && data.averageScore < 80 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">👍 Good Progress!</p>
                  <p className="text-xs text-blue-600 mt-1">You're doing well. Focus on weak areas to improve further.</p>
                </div>
              )}
              
              {data.averageScore < 60 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">💪 Keep Practicing!</p>
                  <p className="text-xs text-yellow-600 mt-1">Review the materials and try again. You'll improve with practice!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quiz History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  Recent Quiz Attempts
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Your last {data.recentAttempts.length} quizzes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/sabiquiz/materials')}
              >
                Take New Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => router.push(`/sabiquiz/results/${attempt.id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {attempt.material_name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </span>
                      <span>
                        {attempt.correct_answers}/{attempt.total_questions} correct
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(attempt.score || 0).split(' ')[0]}`}>
                        {attempt.score}%
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${getScoreColor(attempt.score || 0)}`}>
                        {getScoreLabel(attempt.score || 0)}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}