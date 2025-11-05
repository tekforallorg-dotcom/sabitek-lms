'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Calendar, Search, Filter, ArrowRight, BookOpen } from 'lucide-react'
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
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
            <p className="text-gray-600 mt-2">View all your past quiz attempts</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">Take some quizzes to see your history here!</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
          <p className="text-gray-600 mt-2">View all your past quiz attempts ({attempts.length} total)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Score Filter */}
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  Showing {filteredAttempts.length} of {attempts.length} attempts
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setScoreFilter('all')
                    setDateFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => router.push(`/sabiquiz/results/${attempt.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {attempt.material_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span>
                          {attempt.correct_answers}/{attempt.total_questions} correct
                        </span>
                        <span className="capitalize text-xs px-2 py-1 bg-gray-100 rounded">
                          {attempt.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(attempt.score).split(' ')[0]}`}>
                          {attempt.score}%
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${getScoreColor(attempt.score)}`}>
                          {getScoreLabel(attempt.score)}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}