'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Trophy, TrendingUp, Target, BookOpen, Clock, Award, ArrowRight, Calendar,
  Flame, Star, Zap, Brain, Shield, Crown, Medal, ChevronRight, ArrowLeft
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { getUserXP, getUserBadges, getWeakTopics } from '@/lib/sabiquiz/quiz-utils'

interface QuizAttempt {
  id: string
  score: number
  correct_answers: number
  total_questions: number
  completed_at: string
  material_name: string
  mode: string
  difficulty: string
}

interface StreakData {
  current_streak: number
  longest_streak: number
  total_study_days: number
  last_study_date: string
}

interface XPData {
  totalXp: number
  currentLevel: number
  xpThisWeek: number
  xpToNextLevel: number
  progressPercent: number
}

interface Badge {
  id: string
  badge_id: string
  badge_name: string
  badge_description: string
  earned_at: string
}

interface WeakTopic {
  topic: string
  category: string
  mastery_percentage: number
  total_attempts: number
}

interface TopicMastery {
  topic: string
  mastery_percentage: number
  total_attempts: number
  correct_attempts: number
}

interface ChallengeModeStats {
  timeAttackWins: number
  perfectRuns: number
  bossQuizCompleted: number
}

interface AnalyticsData {
  totalQuizzes: number
  averageScore: number
  bestScore: number
  totalQuestions: number
  recentAttempts: QuizAttempt[]
  scoreHistory: { date: string; score: number }[]
  difficultyStats: { difficulty: string; avgScore: number; count: number }[]
}

const LEVEL_TITLES = [
  'Novice', 'Learner', 'Student', 'Scholar', 'Expert',
  'Master', 'Grandmaster', 'Sage', 'Wizard', 'Legend',
  'Champion', 'Virtuoso', 'Prodigy', 'Genius', 'Titan',
  'Mythic', 'Immortal', 'Divine', 'Transcendent', 'Ultimate'
]

const BADGE_ICONS: Record<string, string> = {
  'accuracy_builder': '🎯',
  'consistency': '🔥',
  'depth': '🧠',
  'default': '🏅'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  'easy': '#22c55e',
  'medium': '#eab308',
  'hard': '#ef4444'
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('30')
  const [data, setData] = useState<AnalyticsData>({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    totalQuestions: 0,
    recentAttempts: [],
    scoreHistory: [],
    difficultyStats: [],
  })
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([])
  const [challengeStats, setChallengeStats] = useState<ChallengeModeStats>({
    timeAttackWins: 0,
    perfectRuns: 0,
    bossQuizCompleted: 0,
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Calculate date filter
      let dateFilter = null
      if (timeRange !== 'all') {
        const days = parseInt(timeRange)
        const date = new Date()
        date.setDate(date.getDate() - days)
        dateFilter = date.toISOString()
      }

      // Fetch quiz attempts
      let attemptsQuery = supabase
        .from('sabiquiz_attempts')
        .select(`
          id,
          score,
          correct_answers,
          total_questions,
          completed_at,
          material_id,
          mode,
          difficulty,
          sabiquiz_materials!material_id(filename)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (dateFilter) {
        attemptsQuery = attemptsQuery.gte('completed_at', dateFilter)
      }

      const { data: rawAttempts, error } = await attemptsQuery

      if (error) throw error

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('study_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      setStreak(streakData)

      // Fetch XP data
      const xp = await getUserXP(user.id)
      setXpData(xp)

      // Fetch badges
      const userBadges = await getUserBadges(user.id)
      setBadges(userBadges)

      // Fetch weak topics
      const weak = await getWeakTopics(user.id)
      setWeakTopics(weak)

      // Fetch topic mastery
      const { data: masteryData } = await supabase
        .from('sabiquiz_mastery')
        .select('*')
        .eq('user_id', user.id)
        .order('mastery_percentage', { ascending: true })

      setTopicMastery(masteryData || [])

      // Calculate challenge mode stats
      if (rawAttempts) {
        const timeAttackWins = rawAttempts.filter(a => a.mode === 'time_attack' && (a.score || 0) >= 60).length
        const perfectRuns = rawAttempts.filter(a => a.mode === 'perfect_run' && a.score === 100).length
        const bossQuizCompleted = rawAttempts.filter(a => a.mode === 'boss_quiz').length

        setChallengeStats({ timeAttackWins, perfectRuns, bossQuizCompleted })
      }

      if (rawAttempts && rawAttempts.length > 0) {
        const attempts: QuizAttempt[] = rawAttempts.map((attempt: any) => ({
          id: attempt.id,
          score: attempt.score,
          correct_answers: attempt.correct_answers,
          total_questions: attempt.total_questions,
          completed_at: attempt.completed_at,
          material_name: attempt.sabiquiz_materials?.filename || 'Unknown Material',
          mode: attempt.mode || 'normal',
          difficulty: attempt.difficulty || 'mixed',
        }))

        const totalQuizzes = attempts.length
        const averageScore = Math.round(
          attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalQuizzes
        )
        const bestScore = Math.max(...attempts.map(a => a.score || 0))
        const totalQuestions = attempts.reduce((sum, a) => sum + (a.total_questions || 0), 0)

        // Score history for chart (last 10 quizzes, reversed for chronological)
        const scoreHistory = attempts.slice(0, 10).reverse().map(a => ({
          date: new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: a.score || 0,
        }))

        // Difficulty stats
        const difficultyMap = new Map<string, { total: number; count: number }>()
        attempts.forEach(a => {
          const diff = a.difficulty || 'mixed'
          if (!difficultyMap.has(diff)) {
            difficultyMap.set(diff, { total: 0, count: 0 })
          }
          const stats = difficultyMap.get(diff)!
          stats.total += a.score || 0
          stats.count++
        })

        const difficultyStats = Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
          difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          avgScore: Math.round(stats.total / stats.count),
          count: stats.count,
        }))

        setData({
          totalQuizzes,
          averageScore,
          bestScore,
          totalQuestions,
          recentAttempts: attempts.slice(0, 5),
          scoreHistory,
          difficultyStats,
        })
      } else {
        setData({
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          totalQuestions: 0,
          recentAttempts: [],
          scoreHistory: [],
          difficultyStats: [],
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

  function getModeIcon(mode: string) {
    switch (mode) {
      case 'time_attack': return <Zap className="w-3 h-3 text-orange-500" />
      case 'perfect_run': return <Trophy className="w-3 h-3 text-yellow-500" />
      case 'boss_quiz': return <Shield className="w-3 h-3 text-red-500" />
      default: return null
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
     {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sabiquiz/materials')}
            className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Materials
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your learning progress and achievements</p>
            </div>
            
            {/* Time Range Filter */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {(['7', '30', '90', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `${range}d`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP & Level Card */}
        {xpData && (
          <Card className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Level Badge */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-4xl font-bold">{xpData.currentLevel}</span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      {LEVEL_TITLES[Math.min(xpData.currentLevel - 1, LEVEL_TITLES.length - 1)]}
                    </div>
                  </div>
                  
                  {/* XP Info */}
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Total XP</p>
                    <p className="text-3xl font-bold flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-400" />
                      {xpData.totalXp.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-purple-200">Next Level</span>
                        <span className="text-white font-medium">{xpData.xpToNextLevel} XP to go</span>
                      </div>
                      <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${xpData.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly XP */}
                <div className="text-right">
                  <p className="text-purple-200 text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold flex items-center justify-end gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    +{xpData.xpThisWeek}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row 1: Streak + Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Streak Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Current Streak</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {streak?.current_streak || 0} days
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between text-sm">
                <span className="text-orange-600">Best: {streak?.longest_streak || 0} days</span>
                <span className="text-orange-600">Total: {streak?.total_study_days || 0} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Core Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Quizzes</span>
              </div>
              <p className="text-2xl font-bold">{data.totalQuizzes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Avg Score</span>
              </div>
              <p className="text-2xl font-bold">{data.averageScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Best Score</span>
              </div>
              <p className="text-2xl font-bold">{data.bestScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Questions</span>
              </div>
              <p className="text-2xl font-bold">{data.totalQuestions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Mode Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">Time Attack Wins</p>
                  <p className="text-xl font-bold text-orange-700">{challengeStats.timeAttackWins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Perfect Runs</p>
                  <p className="text-xl font-bold text-yellow-700">{challengeStats.perfectRuns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-red-600 font-medium">Boss Quizzes</p>
                  <p className="text-xl font-bold text-red-700">{challengeStats.bossQuizCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Score Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.scoreHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Difficulty Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-green-500" />
                Performance by Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.difficultyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.difficultyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} stroke="#888" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value, name) => {
                        if (name === 'avgScore') return [`${value}%`, 'Avg Score']
                        return [value, name]
                      }}
                    />
                    <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                      {data.difficultyStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={DIFFICULTY_COLORS[entry.difficulty.toLowerCase()] || '#888'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges & Weak Topics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Medal className="w-5 h-5 text-yellow-500" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <span className="text-3xl">
                        {BADGE_ICONS[badge.badge_id] || BADGE_ICONS.default}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{badge.badge_name}</p>
                        <p className="text-xs text-gray-500">{badge.badge_description}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Medal className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Keep learning to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-purple-500" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{topic.topic}</span>
                        <span className="text-sm text-red-600 font-medium">
                          {topic.mastery_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${topic.mastery_percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {topic.total_attempts} questions attempted
                      </p>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => router.push('/sabiquiz/materials')}
                  >
                    Practice Weak Topics
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No weak topics identified</p>
                  <p className="text-sm">Complete more quizzes to see insights!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Topic Mastery Overview */}
        {topicMastery.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Topic Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topicMastery.slice(0, 9).map((topic, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {topic.topic}
                      </span>
                      <span className={`text-sm font-bold ${
                        topic.mastery_percentage >= 80 ? 'text-green-600' :
                        topic.mastery_percentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {topic.mastery_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          topic.mastery_percentage >= 80 ? 'bg-green-500' :
                          topic.mastery_percentage >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${topic.mastery_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                Recent Quizzes
              </CardTitle>
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
            {data.recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {data.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => router.push(`/sabiquiz/results/${attempt.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {attempt.material_name}
                        </h4>
                        {getModeIcon(attempt.mode)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </span>
                        <span>
                          {attempt.correct_answers}/{attempt.total_questions} correct
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-xl font-bold ${getScoreColor(attempt.score || 0).split(' ')[0]}`}>
                        {attempt.score}%
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No quizzes completed yet</p>
                <Button 
                  className="mt-4 bg-red-600 hover:bg-red-700"
                  onClick={() => router.push('/sabiquiz/materials')}
                >
                  Start Your First Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}