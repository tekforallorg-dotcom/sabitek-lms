'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search,
  Filter,
  Star,
  Clock,
  MapPin,
  Globe,
  CheckCircle,
  ChevronDown,
  MessageSquare,
  Calendar,
  Zap,
  Users,
  ArrowLeft,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { 
  Skill,
  MentorProfile,
  SkillCategory,
  SpokenLanguage,
  SkillLevel,
  SKILL_CATEGORIES,
  SPOKEN_LANGUAGES,
  SKILL_LEVELS
} from '@/types/community'

function BrowseMentorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  // Data
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // UI
  const [loading, setLoading] = useState(true)

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
      router.push('/auth/login?redirect=/community/browse')
    } else if (user) {
      fetchSkills()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchMentors()
    }
  }, [user, selectedCategory, selectedSkill, selectedLanguage, selectedLevel])

  useEffect(() => {
    // Check URL params
    const skillSlug = searchParams.get('skill')
    if (skillSlug && skills.length > 0) {
      const skill = skills.find(s => s.slug === skillSlug)
      if (skill) {
        setSelectedSkill(skill.id)
        setSelectedCategory(skill.category)
      }
    }
  }, [searchParams, skills])

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/community/skills')
      const data = await res.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
    }
  }

  const fetchMentors = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()
      if (selectedSkill) params.set('skill_id', selectedSkill)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedLanguage) params.set('language', selectedLanguage)
      if (selectedLevel) params.set('level', selectedLevel)

      const res = await fetch(`/api/community/mentors?${params}`, { headers })
      const data = await res.json()
      setMentors(data.mentors || [])
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedSkill(null)
    setSelectedLanguage(null)
    setSelectedLevel(null)
    setSearchQuery('')
  }

  const filteredMentors = mentors.filter(mentor => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      mentor.display_name?.toLowerCase().includes(query) ||
      mentor.bio?.toLowerCase().includes(query) ||
      mentor.teaching_skills?.some(s => s.skill?.name.toLowerCase().includes(query))
    )
  })

  const filteredSkillsForSelect = selectedCategory
    ? skills.filter(s => s.category === selectedCategory)
    : skills

  const hasActiveFilters = selectedCategory || selectedSkill || selectedLanguage || selectedLevel

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/community')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Find a Mentor</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, skill, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={`flex items-center gap-2 text-sm rounded-xl ${hasActiveFilters ? 'border-red-500 text-red-600' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {[selectedCategory, selectedSkill, selectedLanguage, selectedLevel].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value || null)
                      setSelectedSkill(null)
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">All categories</option>
                    {SKILL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Skill</label>
                  <select
                    value={selectedSkill || ''}
                    onChange={(e) => setSelectedSkill(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">All skills</option>
                    {filteredSkillsForSelect.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Language</label>
                  <select
                    value={selectedLanguage || ''}
                    onChange={(e) => setSelectedLanguage(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">Any language</option>
                    {SPOKEN_LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Experience</label>
                  <select
                    value={selectedLevel || ''}
                    onChange={(e) => setSelectedLevel(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">Any level</option>
                    {SKILL_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mentor Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map(mentor => (
              <Card 
                key={mentor.user_id} 
                className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-red-200 cursor-pointer overflow-hidden"
                onClick={() => router.push(`/community/mentor/${mentor.user_id}`)}
              >
                <CardContent className="p-0">
                  {/* Header with gradient */}
                  <div className="h-16 bg-gradient-to-r from-red-500 to-red-600 relative">
                    {mentor.is_verified && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-green-700">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 pb-4 -mt-8 relative">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden mb-3">
                      {mentor.avatar_url ? (
                        <img 
                          src={mentor.avatar_url} 
                          alt={mentor.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xl font-bold">
                          {mentor.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Name & Location */}
                    <h3 className="font-semibold text-gray-900 text-base group-hover:text-red-600 transition-colors">
                      {mentor.display_name}
                    </h3>
                    {mentor.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {mentor.location}
                      </p>
                    )}

                    {/* Bio */}
                    {mentor.bio && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-2">
                        {mentor.bio}
                      </p>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {mentor.teaching_skills?.slice(0, 3).map((ps, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-medium"
                        >
                          {ps.skill?.name}
                        </span>
                      ))}
                      {mentor.teaching_skills?.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{mentor.teaching_skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe className="w-3.5 h-3.5" />
                        {mentor.languages?.slice(0, 2).map(l => 
                          SPOKEN_LANGUAGES.find(sl => sl.value === l)?.label.slice(0, 3)
                        ).join(', ')}
                      </div>
                      {mentor.response_time_hours && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          &lt;{mentor.response_time_hours}h reply
                        </div>
                      )}
                      {mentor.completion_rate > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Zap className="w-3.5 h-3.5" />
                          {mentor.completion_rate}%
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/community/mentor/${mentor.user_id}`)
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs rounded-lg border-gray-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Direct message or request
                          alert('Coming soon: Send request')
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more mentors'
                : 'Be the first to become a mentor! Set up your profile and start teaching.'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline" className="text-sm">
                Clear filters
              </Button>
            ) : (
              <Button 
                onClick={() => router.push('/community/profile')} 
                className="bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                Become a Mentor
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

export default function BrowseMentorsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrowseMentorsContent />
    </Suspense>
  )
}