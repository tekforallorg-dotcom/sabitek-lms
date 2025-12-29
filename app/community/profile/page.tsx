'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  BookOpen, 
  GraduationCap,
  Plus,
  X,
  Save,
  ArrowLeft,
  Globe,
  Clock,
  Video,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { 
  Skill, 
  CommunityProfile,
  ProfileSkill,
  SpokenLanguage,
  SessionLength,
  MeetingMethod,
  SkillType,
  SkillLevel,
  SPOKEN_LANGUAGES,
  SESSION_LENGTHS,
  MEETING_METHODS,
  SKILL_LEVELS,
  SKILL_CATEGORIES
} from '@/types/community'

export default function CommunityProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  
  // Profile state
  const [profile, setProfile] = useState<CommunityProfile | null>(null)
  const [teachingSkills, setTeachingSkills] = useState<(ProfileSkill & { skill: Skill })[]>([])
  const [learningSkills, setLearningSkills] = useState<(ProfileSkill & { skill: Skill })[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    timezone: 'Africa/Lagos',
    languages: ['english'] as SpokenLanguage[],
    preferred_session_lengths: ['60'] as SessionLength[],
    preferred_meeting_methods: ['google_meet'] as MeetingMethod[],
    meeting_link: '',
    is_public: true,
    is_available_to_mentor: false,
    is_looking_to_learn: true,
  })
  
  // Skills catalog
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('technology')
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddSkillModal, setShowAddSkillModal] = useState(false)
  const [addSkillType, setAddSkillType] = useState<SkillType>('teach')
  const [newSkill, setNewSkill] = useState({
    skill_id: '',
    level: 'beginner' as SkillLevel,
    years_experience: 0,
    description: '',
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
      router.push('/auth/login?redirect=/community/profile')
    } else if (user) {
      fetchData()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders()
      
      // Fetch profile
      const profileRes = await fetch('/api/community/profile', { headers })
      const profileData = await profileRes.json()
      
      if (profileData.profile) {
        setProfile(profileData.profile)
        setFormData({
          username: profileData.profile.username || '',
          display_name: profileData.profile.display_name || userProfile?.full_name || '',
          bio: profileData.profile.bio || '',
          location: profileData.profile.location || '',
          timezone: profileData.profile.timezone || 'Africa/Lagos',
          languages: profileData.profile.languages || ['english'],
          preferred_session_lengths: profileData.profile.preferred_session_lengths || ['60'],
          preferred_meeting_methods: profileData.profile.preferred_meeting_methods || ['google_meet'],
          meeting_link: profileData.profile.meeting_link || '',
          is_public: profileData.profile.is_public ?? true,
          is_available_to_mentor: profileData.profile.is_available_to_mentor ?? false,
          is_looking_to_learn: profileData.profile.is_looking_to_learn ?? true,
        })
      } else {
        // Pre-fill with user profile data
        setFormData(prev => ({
          ...prev,
          display_name: userProfile?.full_name || '',
        }))
      }
      
      setTeachingSkills(profileData.teaching_skills || [])
      setLearningSkills(profileData.learning_skills || [])

      // Fetch skills catalog (no auth needed for this one)
      const skillsRes = await fetch('/api/community/skills')
      const skillsData = await skillsRes.json()
      setAllSkills(skillsData.skills || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setProfile(data.profile)
        alert('Profile saved successfully!')
      } else {
        alert(data.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.skill_id) {
      alert('Please select a skill')
      return
    }

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/community/profile/skills', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          skill_id: newSkill.skill_id,
          skill_type: addSkillType,
          level: newSkill.level,
          years_experience: addSkillType === 'teach' ? newSkill.years_experience : null,
          description: newSkill.description || null,
        }),
      })

      if (res.ok) {
        await fetchData() // Refresh data
        setShowAddSkillModal(false)
        setNewSkill({ skill_id: '', level: 'beginner', years_experience: 0, description: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add skill')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      alert('Failed to add skill')
    }
  }

  const handleRemoveSkill = async (skillId: string, skillType: SkillType) => {
    if (!confirm('Remove this skill?')) return

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/community/profile/skills?skill_id=${skillId}&skill_type=${skillType}`, {
        method: 'DELETE',
        headers,
      })

      if (res.ok) {
        await fetchData() // Refresh data
      } else {
        alert('Failed to remove skill')
      }
    } catch (error) {
      console.error('Error removing skill:', error)
      alert('Failed to remove skill')
    }
  }

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item)
    }
    return [...array, item]
  }

  const filteredSkills = allSkills.filter(s => s.category === selectedCategory)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs text-gray-700 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/community')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Community Profile</h1>
          <p className="text-xs sm:text-sm text-gray-600">Set up your profile to connect with learners and mentors</p>
        </div>
      </div>

      {/* Profile Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-red-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="your-username"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier for your profile</p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your Name"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell others about yourself, your experience, and what you can help with..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Lagos, Nigeria"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <Input
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="text-sm"
              />
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Languages I Speak
            </label>
            <div className="flex flex-wrap gap-2">
              {SPOKEN_LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setFormData({ 
                    ...formData, 
                    languages: toggleArrayItem(formData.languages, lang.value) 
                  })}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    formData.languages.includes(lang.value)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Session Lengths
              </label>
              <div className="flex flex-wrap gap-2">
                {SESSION_LENGTHS.map(len => (
                  <button
                    key={len.value}
                    onClick={() => setFormData({ 
                      ...formData, 
                      preferred_session_lengths: toggleArrayItem(formData.preferred_session_lengths, len.value) 
                    })}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      formData.preferred_session_lengths.includes(len.value)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Video className="w-4 h-4 inline mr-1" />
                Meeting Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {MEETING_METHODS.map(method => (
                  <button
                    key={method.value}
                    onClick={() => setFormData({ 
                      ...formData, 
                      preferred_meeting_methods: toggleArrayItem(formData.preferred_meeting_methods, method.value) 
                    })}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      formData.preferred_meeting_methods.includes(method.value)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Profile Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-xs sm:text-sm text-gray-700">Make my profile public</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available_to_mentor}
                  onChange={(e) => setFormData({ ...formData, is_available_to_mentor: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-xs sm:text-sm text-gray-700">I'm available to mentor others</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_looking_to_learn}
                  onChange={(e) => setFormData({ ...formData, is_looking_to_learn: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-xs sm:text-sm text-gray-700">I'm looking to learn new skills</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills I Can Teach */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-500" />
                Skills I Can Teach
              </CardTitle>
              <CardDescription className="text-xs">Skills you can help others learn</CardDescription>
            </div>
            <Button
              onClick={() => { setAddSkillType('teach'); setShowAddSkillModal(true); }}
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teachingSkills.length > 0 ? (
            <div className="space-y-2">
              {teachingSkills.map(ps => (
                <div key={ps.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ps.skill?.name}</p>
                    <p className="text-xs text-gray-500">
                      {SKILL_LEVELS.find(l => l.value === ps.level)?.label}
                      {ps.years_experience ? ` • ${ps.years_experience} years` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(ps.skill_id, 'teach')}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs">No teaching skills added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills I Want to Learn */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Skills I Want to Learn
              </CardTitle>
              <CardDescription className="text-xs">Skills you're interested in learning</CardDescription>
            </div>
            <Button
              onClick={() => { setAddSkillType('learn'); setShowAddSkillModal(true); }}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {learningSkills.length > 0 ? (
            <div className="space-y-2">
              {learningSkills.map(ps => (
                <div key={ps.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ps.skill?.name}</p>
                    <p className="text-xs text-gray-500">
                      {SKILL_LEVELS.find(l => l.value === ps.level)?.label}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(ps.skill_id, 'learn')}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs">No learning skills added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Add {addSkillType === 'teach' ? 'Teaching' : 'Learning'} Skill
                </h3>
                <button
                  onClick={() => setShowAddSkillModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Skill Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Skill</label>
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {filteredSkills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => setNewSkill({ ...newSkill, skill_id: skill.id })}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        newSkill.skill_id === skill.id ? 'bg-red-50 text-red-600' : ''
                      }`}
                    >
                      {skill.name}
                      {newSkill.skill_id === skill.id && (
                        <CheckCircle className="w-4 h-4 inline ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {addSkillType === 'teach' ? 'Your expertise level' : 'Your current level'}
                </label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setNewSkill({ ...newSkill, level: level.value })}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        newSkill.level === level.value
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Years Experience (only for teaching) */}
              {addSkillType === 'teach' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={newSkill.years_experience}
                    onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 0 })}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => setShowAddSkillModal(false)}
                variant="outline"
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSkill}
                className={`flex-1 text-sm text-white ${
                  addSkillType === 'teach' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Add Skill
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}