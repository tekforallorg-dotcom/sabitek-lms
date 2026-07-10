'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Search,
  Trash2
} from 'lucide-react'
import {
  getAllQuestions,
  deleteQuestion,
  isAdmin,
  type AdminQuestion,
} from '@/lib/admin/sabiquiz-admin'
import { toast } from '@/components/ui/toast'

export default function QuestionsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<AdminQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, searchTerm, typeFilter, difficultyFilter])

  async function checkAdminAndFetch() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const adminCheck = await isAdmin(user.id)
      if (!adminCheck) {
        router.push('/')
        return
      }

      const questionsData = await getAllQuestions()
      setQuestions(questionsData)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  function filterQuestions() {
    let filtered = questions

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.material_filename.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(q => q.question_type === typeFilter)
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter)
    }

    setFilteredQuestions(filtered)
  }

  async function handleDelete(questionId: string, questionText: string) {
    if (!confirm(`Delete this question?\n\n"${questionText.substring(0, 100)}..."`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await deleteQuestion(questionId, user.id)
      setQuestions(questions.filter(q => q.id !== questionId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete question')
    }
  }

  const types = ['all', ...Array.from(new Set(questions.map(q => q.question_type).filter(t => t != null)))]
  const difficulties = ['all', 'easy', 'medium', 'hard']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="animate-pulse space-y-8 p-6 md:p-8">
          <div className="space-y-3">
            <div className="h-3 w-36 rounded-full bg-rose-100/80" />
            <div className="h-8 w-72 rounded-lg bg-rose-50/60" />
            <div className="h-4 w-56 rounded-lg bg-rose-50/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-rose-50/60" />
            ))}
          </div>
          <div className="bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 space-y-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-rose-50/60 rounded-lg h-10" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">SabiQuiz admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
          Question <span className="font-serif italic text-red-600">bank</span>
        </h1>
        <p className="text-gray-600">Manage all AI-generated quiz questions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{questions.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Multiple Choice</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {questions.filter(q => q.question_type === 'multiple_choice').length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Usage</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {questions.length > 0
                  ? Math.round(questions.reduce((sum, q) => sum + q.usage_count, 0) / questions.length)
                  : 0}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">From Materials</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {new Set(questions.map(q => q.material_id)).size}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions or materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
               {types.map(type => (
  <SelectItem key={type} value={type}>
    {type === 'all' ? 'All Types' : (type || 'Unknown').replace(/_/g, ' ')}
  </SelectItem>
))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(diff => (
                  <SelectItem key={diff} value={diff}>
                    {diff === 'all' ? 'All Difficulties' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">All Questions ({filteredQuestions.length})</h2>
        </div>
        <div className="p-6 pt-2">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
                <MessageSquare className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                No questions <span className="font-serif italic text-red-600">found</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rose-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Question</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Material</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Type</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Difficulty</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Usage</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question) => (
                    <tr key={question.id} className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <p className="line-clamp-2">{question.question_text}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {question.material_filename}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                       <span className="px-2.5 py-1 bg-rose-50 text-red-600 border border-rose-100 rounded-full text-xs font-semibold">
  {(question.question_type || 'Unknown').replace(/_/g, ' ')}
</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {question.difficulty ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            question.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            question.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {question.difficulty}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-gray-900">
                        {question.usage_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(question.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(question.id, question.question_text)}
                            aria-label="Delete question"
                            className="inline-flex h-8 w-8 items-center justify-center bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
