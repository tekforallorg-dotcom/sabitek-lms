'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Trophy, TrendingUp, Target, BookOpen, Clock, Award, ArrowRight, Calendar,
  Flame, Star, Zap, Brain, Shield, Crown, Medal, ChevronRight, ArrowLeft,
  Sparkles, BarChart3
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
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-indigo-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-gray-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-3xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-20 h-20 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl rotate-45 blur-sm" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/sabiquiz/materials')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Materials</span>
          </button>
          
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-2 border border-white/10">
                  <Sparkles className="w-3 h-3" />
                  Performance Insights
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Track your learning progress and achievements</p>
              </div>
            </div>
            
            {/* Time Range Filter */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/10">
              {(['7', '30', '90', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    timeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {range === 'all' ? 'All' : `${range}d`}
                </button>
              ))}
            </div>
          </div>

          {/* XP & Level Card in Hero */}
          {xpData && (
            <div className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              {/* Mobile Layout */}
              <div className="flex sm:hidden flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">{xpData.currentLevel}</span>
                    </div>
                    <div>
                      <p className="text-purple-200 text-xs">Level</p>
                      <p className="text-sm font-semibold text-white">
                        {LEVEL_TITLES[Math.min(xpData.currentLevel - 1, LEVEL_TITLES.length - 1)]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-200 text-xs">This Week</p>
                    <p className="text-lg font-bold text-white flex items-center justify-end gap-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      +{xpData.xpThisWeek}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-200 text-xs">Total XP</p>
                    <p className="font-bold text-white flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {xpData.totalXp.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${xpData.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-purple-200 text-xs mt-1.5 text-right">{xpData.xpToNextLevel} XP to next level</p>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Level Badge */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                      <span className="text-4xl font-bold text-white">{xpData.currentLevel}</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                      {LEVEL_TITLES[Math.min(xpData.currentLevel - 1, LEVEL_TITLES.length - 1)]}
                    </div>
                  </div>
                  
                  {/* XP Info */}
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Total XP</p>
                    <p className="text-3xl font-bold text-white flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-400" />
                      {xpData.totalXp.toLocaleString()}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-purple-200">Next Level</span>
                        <span className="text-white font-medium">{xpData.xpToNextLevel} XP to go</span>
                      </div>
                      <div className="w-48 h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${xpData.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly XP */}
                <div className="text-right bg-white/10 rounded-xl px-6 py-4">
                  <p className="text-purple-200 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold text-white flex items-center justify-end gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    +{xpData.xpThisWeek}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Streak + Core Stats in Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-300 font-medium">Streak</p>
                  <p className="text-xl font-bold text-white">{streak?.current_streak || 0}d</p>
                </div>
              </div>
            </div>

            {/* Quizzes */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Quizzes</p>
                  <p className="text-xl font-bold text-white">{data.totalQuizzes}</p>
                </div>
              </div>
            </div>

            {/* Avg Score */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Avg Score</p>
                  <p className="text-xl font-bold text-white">{data.averageScore}%</p>
                </div>
              </div>
            </div>

            {/* Best Score */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Best</p>
                  <p className="text-xl font-bold text-white">{data.bestScore}%</p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Questions</p>
                  <p className="text-xl font-bold text-white">{data.totalQuestions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Challenge Mode Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Time Attack Wins</p>
                <p className="text-2xl font-bold text-gray-900">{challengeStats.timeAttackWins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Perfect Runs</p>
                <p className="text-2xl font-bold text-gray-900">{challengeStats.perfectRuns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Boss Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{challengeStats.bossQuizCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Score Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Score Trend</h3>
              </div>
            </div>
            <div className="p-5">
              {data.scoreHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="url(#colorGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: '#ef4444' }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Difficulty Performance Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Performance by Difficulty</h3>
              </div>
            </div>
            <div className="p-5">
              {data.difficultyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.difficultyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} stroke="#888" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(value, name) => {
                        if (name === 'avgScore') return [`${value}%`, 'Avg Score']
                        return [value, name]
                      }}
                    />
                    <Bar dataKey="avgScore" radius={[8, 8, 0, 0]}>
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
                <div className="h-[220px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No data yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges & Weak Topics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Badges */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Medal className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Badges Earned</h3>
              </div>
            </div>
            <div className="p-5">
              {badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100"
                    >
                      <span className="text-3xl">
                        {BADGE_ICONS[badge.badge_id] || BADGE_ICONS.default}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{badge.badge_name}</p>
                        <p className="text-xs text-gray-500">{badge.badge_description}</p>
                      </div>
                      <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-lg">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Medal className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">No badges earned yet</p>
                  <p className="text-sm mt-1">Keep learning to unlock achievements!</p>
                </div>
              )}
            </div>
          </div>

          {/* Weak Topics */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Areas to Improve</h3>
              </div>
            </div>
            <div className="p-5">
              {weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">{topic.topic}</span>
                        <span className="text-sm text-red-600 font-bold">
                          {topic.mastery_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                          style={{ width: `${topic.mastery_percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {topic.total_attempts} questions attempted
                      </p>
                    </div>
                  ))}
                  <Button 
                    className="w-full mt-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl h-11"
                    onClick={() => router.push('/sabiquiz/materials')}
                  >
                    Practice Weak Topics
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">No weak topics identified</p>
                  <p className="text-sm mt-1">Complete more quizzes to see insights!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Topic Mastery Overview */}
        {topicMastery.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Topic Mastery</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topicMastery.slice(0, 9).map((topic, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">
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
                          topic.mastery_percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          topic.mastery_percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${topic.mastery_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Quizzes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
      <Clock className="w-5 h-5 text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900">Recent Quizzes</h3>
      <button 
        onClick={() => router.push('/sabiquiz/history')}
        className="text-xs text-red-600 hover:text-red-700 font-medium"
      >
        View all history →
      </button>
    </div>
  </div>
  <Button
    onClick={() => router.push('/sabiquiz/materials')}
    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
  >
    Take New Quiz
  </Button>
</div>

          </div>
          <div className="p-5">
            {data.recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {data.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => router.push(`/sabiquiz/results/${attempt.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                          {attempt.material_name}
                        </h4>
                        {getModeIcon(attempt.mode)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </span>
                        <span>
                          {attempt.correct_answers}/{attempt.total_questions} correct
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${getScoreColor(attempt.score || 0)}`}>
                        {attempt.score}%
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium">No quizzes completed yet</p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                  onClick={() => router.push('/sabiquiz/materials')}
                >
                  Start Your First Quiz
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}