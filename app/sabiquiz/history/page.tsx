'use client'
import SabiLoader from '@/components/ui/SabiLoader'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  ArrowRight, 
  BookOpen, 
  ArrowLeft,
  Sparkles,
  History,
  Trophy,
  Target,
  ChevronRight
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QuizAttempt {
  id: string
  score: number
  correct_answers: number
  total_questions: number
  completed_at: string
  material_name: string
  difficulty: string
}

export default function QuizHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [attempts, searchQuery, scoreFilter, dateFilter])

  async function fetchHistory() {
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
          difficulty,
          material_id,
          sabiquiz_materials!material_id(filename)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (error) throw error

      if (rawAttempts) {
        const formattedAttempts: QuizAttempt[] = rawAttempts.map((attempt: any) => ({
          id: attempt.id,
          score: attempt.score,
          correct_answers: attempt.correct_answers,
          total_questions: attempt.total_questions,
          completed_at: attempt.completed_at,
          difficulty: attempt.difficulty || 'mixed',
          material_name: attempt.sabiquiz_materials?.filename || 'Unknown Material'
        }))

        setAttempts(formattedAttempts)
      }
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...attempts]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.material_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(a => {
        if (scoreFilter === 'excellent') return a.score >= 80
        if (scoreFilter === 'good') return a.score >= 60 && a.score < 80
        if (scoreFilter === 'fair') return a.score >= 40 && a.score < 60
        if (scoreFilter === 'poor') return a.score < 40
        return true
      })
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(a => {
        const attemptDate = new Date(a.completed_at)
        const daysDiff = Math.floor((now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dateFilter === 'week') return daysDiff <= 7
        if (dateFilter === 'month') return daysDiff <= 30
        if (dateFilter === 'quarter') return daysDiff <= 90
        return true
      })
    }

    setFilteredAttempts(filtered)
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getScoreBg(score: number) {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200'
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <SabiLoader text="Loading history..." size="lg" />
        </div>
      </div>
    )
  }

  // Calculate stats for hero
  const totalAttempts = attempts.length
  const avgScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) 
    : 0
  const bestScore = totalAttempts > 0 
    ? Math.max(...attempts.map(a => a.score)) 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

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
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <History className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-2 border border-white/10">
                  <Sparkles className="w-3 h-3" />
                  Quiz History
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Past Attempts</h1>
                <p className="text-gray-400 text-sm mt-1">Review and learn from your quiz history</p>
              </div>
            </div>
          </div>

          {/* Stats in Hero */}
          {totalAttempts > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Total Attempts</p>
                    <p className="text-xl font-bold text-white">{totalAttempts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Avg Score</p>
                    <p className="text-xl font-bold text-white">{avgScore}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Best Score</p>
                    <p className="text-xl font-bold text-white">{bestScore}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {attempts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">Take some quizzes to see your history here!</p>
            <Button 
              onClick={() => router.push('/sabiquiz/materials')} 
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl h-11 px-6"
            >
              Browse Materials
            </Button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  {/* Score Filter */}
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Filter by score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                      <SelectItem value="good">Good (60-79%)</SelectItem>
                      <SelectItem value="fair">Fair (40-59%)</SelectItem>
                      <SelectItem value="poor">Needs Work (&lt;40%)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="quarter">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(searchQuery || scoreFilter !== 'all' || dateFilter !== 'all') && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{filteredAttempts.length}</span> of <span className="font-semibold text-gray-900">{attempts.length}</span> attempts
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('')
                        setScoreFilter('all')
                        setDateFilter('all')
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {filteredAttempts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
                    onClick={() => router.push(`/sabiquiz/results/${attempt.id}`)}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors truncate">
                            {attempt.material_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              {attempt.correct_answers}/{attempt.total_questions} correct
                            </span>
                            <span className={`capitalize text-xs px-2.5 py-1 rounded-lg font-medium ${getDifficultyColor(attempt.difficulty)}`}>
                              {attempt.difficulty}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                              {attempt.score}%
                            </div>
                            <div className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${getScoreBg(attempt.score)}`}>
                              {getScoreLabel(attempt.score)}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}