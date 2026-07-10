'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Trash2,
  Loader2,
  Eye
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank</h1>
        <p className="text-gray-600">Manage all AI-generated quiz questions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Multiple Choice</p>
                <p className="text-2xl font-bold">
                  {questions.filter(q => q.question_type === 'multiple_choice').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Usage</p>
                <p className="text-2xl font-bold">
                  {questions.length > 0 
                    ? Math.round(questions.reduce((sum, q) => sum + q.usage_count, 0) / questions.length)
                    : 0}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">From Materials</p>
                <p className="text-2xl font-bold">
                  {new Set(questions.map(q => q.material_id)).size}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions or materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Questions ({filteredQuestions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No questions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Question</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Material</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Difficulty</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Usage</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <p className="line-clamp-2">{question.question_text}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {question.material_filename}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                       <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
  {(question.question_type || 'Unknown').replace(/_/g, ' ')}
</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {question.difficulty ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {question.usage_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(question.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(question.id, question.question_text)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}