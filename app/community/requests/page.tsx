'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus,
  X,
  Search,
  Clock,
  User,
  MessageSquare,
  Filter,
  ChevronDown,
  Zap,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { 
  Skill, 
  LearningRequest,
  SkillLevel,
  SpokenLanguage,
  RequestUrgency,
  SessionLength,
  SKILL_LEVELS,
  SPOKEN_LANGUAGES,
  SESSION_LENGTHS,
  SKILL_CATEGORIES,
  REQUEST_URGENCIES,
  REQUEST_CONSTRAINTS
} from '@/types/community'

function RequestsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  // Data state
  const [requests, setRequests] = useState<LearningRequest[]>([])
  const [myRequests, setMyRequests] = useState<LearningRequest[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    skill_id: '',
    level: 'beginner' as SkillLevel,
    preferred_language: 'english' as SpokenLanguage,
    urgency: 'medium' as RequestUrgency,
    session_length: '60' as SessionLength,
    constraints: [] as string[],
  })

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/community/requests')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Check for skill filter in URL
    const skillSlug = searchParams.get('skill')
    if (skillSlug && skills.length > 0) {
      const skill = skills.find(s => s.slug === skillSlug)
      if (skill) {
        setSelectedCategory(skill.category)
      }
    }
  }, [searchParams, skills])

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders()
      
      // Fetch skills (no auth needed)
      const skillsRes = await fetch('/api/community/skills')
      const skillsData = await skillsRes.json()
      setSkills(skillsData.skills || [])

      // Fetch open requests
      const requestsRes = await fetch('/api/community/requests?status=open', { headers })
      const requestsData = await requestsRes.json()
      setRequests(requestsData.requests || [])

      // Fetch my requests
      const myRes = await fetch('/api/community/requests?my_requests=true', { headers })
      const myData = await myRes.json()
      setMyRequests(myData.requests || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!form.title || form.title.length < 10) {
      alert('Title must be at least 10 characters')
      return
    }
    if (!form.description || form.description.length < 20) {
      alert('Description must be at least 20 characters')
      return
    }
    if (!form.skill_id) {
      alert('Please select a skill')
      return
    }

    setCreating(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/requests', {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        setShowCreateModal(false)
        setForm({
          title: '',
          description: '',
          skill_id: '',
          level: 'beginner',
          preferred_language: 'english',
          urgency: 'medium',
          session_length: '60',
          constraints: [],
        })
        await fetchData()
        setActiveTab('my')
        alert('Request posted successfully!')
      } else {
        alert(data.error || 'Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request')
    } finally {
      setCreating(false)
    }
  }

  const handleCloseRequest = async (requestId: string) => {
    if (!confirm('Close this request?')) return

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/requests?request_id=${requestId}`, {
        method: 'DELETE',
        headers,
      })

      if (res.ok) {
        await fetchData()
      } else {
        alert('Failed to close request')
      }
    } catch (error) {
      console.error('Error closing request:', error)
    }
  }

  const filteredRequests = requests.filter(req => {
    const matchesCategory = !selectedCategory || req.skill?.category === selectedCategory
    const matchesSearch = !searchQuery || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.skill?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const filteredSkillsForForm = selectedCategory 
    ? skills.filter(s => s.category === selectedCategory)
    : skills

  const getUrgencyColor = (urgency: RequestUrgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs text-gray-700 font-medium">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/community')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Learning Requests</h1>
            <p className="text-xs sm:text-sm text-gray-600">Find help or offer your skills</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Post Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'browse'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Browse Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      {/* Filters (for browse tab) */}
      {activeTab === 'browse' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {SKILL_CATEGORIES.slice(0, 4).map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request List */}
      <div className="space-y-3">
        {activeTab === 'browse' ? (
          filteredRequests.length > 0 ? (
            filteredRequests.map(req => (
              <Card key={req.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getUrgencyColor(req.urgency)}`}>
                          {REQUEST_URGENCIES.find(u => u.value === req.urgency)?.label}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                      </div>
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1">{req.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{req.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {req.skill && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                            {req.skill.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {SKILL_LEVELS.find(l => l.value === req.level)?.label}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {SESSION_LENGTHS.find(l => l.value === req.session_length)?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" />
                        {req.user?.full_name?.split(' ')[0] || 'Anonymous'}
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white text-xs"
                      >
                        Offer Help
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">No requests found</p>
              <p className="text-xs text-gray-500">Be the first to post a request!</p>
            </div>
          )
        ) : (
          // My Requests tab
          myRequests.length > 0 ? (
            myRequests.map(req => (
              <Card key={req.id} className={req.status !== 'open' ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          req.status === 'open' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                      </div>
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1">{req.title}</h3>
                      <p className="text-xs text-gray-500">
                        {req.offers_count} offers • {req.views_count} views
                      </p>
                    </div>
                    {req.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseRequest(req.id)}
                        className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">You haven't posted any requests yet</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post Your First Request
              </Button>
            </div>
          )
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Post a Learning Request</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Help me understand React hooks"
                  maxLength={200}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{form.title.length}/200</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what you need help with, your current level, and what you hope to achieve..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">{form.description.length}/1000</p>
              </div>

              {/* Skill Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Skill Category
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SKILL_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        selectedCategory === cat.value
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <select
                  value={form.skill_id}
                  onChange={(e) => setForm({ ...form, skill_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a skill...</option>
                  {filteredSkillsForForm.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>

              {/* Level & Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value as SkillLevel })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {SKILL_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={form.urgency}
                    onChange={(e) => setForm({ ...form, urgency: e.target.value as RequestUrgency })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {REQUEST_URGENCIES.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Session Length & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Session Length</label>
                  <select
                    value={form.session_length}
                    onChange={(e) => setForm({ ...form, session_length: e.target.value as SessionLength })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {SESSION_LENGTHS.map(len => (
                      <option key={len.value} value={len.value}>{len.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={form.preferred_language}
                    onChange={(e) => setForm({ ...form, preferred_language: e.target.value as SpokenLanguage })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {SPOKEN_LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Constraints */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Constraints (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_CONSTRAINTS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => {
                        const newConstraints = form.constraints.includes(c.value)
                          ? form.constraints.filter(x => x !== c.value)
                          : [...form.constraints, c.value]
                        setForm({ ...form, constraints: newConstraints })
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        form.constraints.includes(c.value)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={creating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs text-gray-700 font-medium">Loading requests...</p>
      </div>
    </div>
  )
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RequestsContent />
    </Suspense>
  )
}