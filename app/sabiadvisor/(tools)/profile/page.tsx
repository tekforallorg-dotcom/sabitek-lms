'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Link as LinkIcon,
  Target,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'

interface WorkExperience {
  id: string
  company: string
  title: string
  start_date: string
  end_date?: string
  bullets: string[]
}

interface Education {
  id: string
  institution: string
  degree: string
  field?: string
  year: string
}

interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
}

export default function CareerProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeSection, setActiveSection] = useState('basic')
  const [profileCompleteness, setProfileCompleteness] = useState(0)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [links, setLinks] = useState<{ linkedin?: string; github?: string; portfolio?: string }>({})
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [newTargetRole, setNewTargetRole] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/sabiadvisor/profile')
    } else if (user) {
      fetchProfile()
    }
  }, [authLoading, user])

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/advisor/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (res.ok) {
        const data = await res.json()
        const p = data.profile
        setProfileCompleteness(p.profile_completeness || 0)
        setFullName(p.full_name || '')
        setEmail(p.email || '')
        setPhone(p.phone || '')
        setLocation(p.location || '')
        setSummary(p.summary || '')
        setSkills(p.skills || [])
        setWorkExperience(p.work_experience || [])
        setEducation(p.education || [])
        setProjects(p.projects || [])
        setLinks(p.links || {})
        setTargetRoles(p.target_roles || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/advisor/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          location,
          summary,
          skills,
          work_experience: workExperience,
          education,
          projects,
          links,
          target_roles: targetRoles
        })
      })

      if (res.ok) {
        const data = await res.json()
        setProfileCompleteness(data.profile?.profile_completeness || 0)
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const addTargetRole = () => {
    if (newTargetRole.trim() && !targetRoles.includes(newTargetRole.trim())) {
      setTargetRoles([...targetRoles, newTargetRole.trim()])
      setNewTargetRole('')
    }
  }

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      id: crypto.randomUUID(),
      company: '',
      title: '',
      start_date: '',
      end_date: '',
      bullets: ['']
    }])
  }

  const addEducation = () => {
    setEducation([...education, {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      field: '',
      year: ''
    }])
  }

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'experience', label: 'Experience', icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'skills', label: 'Skills', icon: Code, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    { id: 'links', label: 'Links', icon: LinkIcon, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'text-red-600', bgColor: 'bg-red-50' }
  ]

  const getProgressColor = () => {
    if (profileCompleteness >= 70) return 'bg-green-600'
    if (profileCompleteness >= 30) return 'bg-amber-600'
    return 'bg-red-600'
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-600 animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-red-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Career Profile</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor()} transition-all duration-500`}
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{profileCompleteness}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm ${
 saveStatus === 'success'
                ? 'bg-green-600 text-white'
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-800 text-white'
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             saveStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : 
             saveStatus === 'error' ? <AlertCircle className="w-4 h-4" /> :
             <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
          </button>
        </div>
      </div>

      {/* Mobile Section Selector */}
      <div className="md:hidden p-3 bg-white border-b border-gray-100">
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Section Nav */}
        <div className="w-52 bg-white border-r border-gray-200/50 p-3 hidden md:block">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all ${
                    isActive
                      ? `${section.bgColor} ${section.color} font-medium shadow-sm`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white/60' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? section.color : 'text-gray-400'}`} />
                  </div>
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* Profile Tips */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Profile Tips</span>
            </div>
            <p className="text-xs text-gray-500">
              Complete at least 30% to use CV & Cover Letter tools.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50/50">
          {/* Basic Info */}
          {activeSection === 'basic' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-900">Basic Information</h3>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent hover:border-gray-300 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent hover:border-gray-300 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent hover:border-gray-300 transition-colors"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent hover:border-gray-300 transition-colors"
                      placeholder="Lagos, Nigeria"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent hover:border-gray-300 transition-colors resize-none"
                    placeholder="Brief overview of your professional background..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Work Experience</h3>
                </div>
                <button
                  onClick={addWorkExperience}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {workExperience.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200/50 p-8 shadow-sm text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No experience added yet.</p>
                  <button
                    onClick={addWorkExperience}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add your first experience
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <div key={exp.id} className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Experience {i + 1}</span>
                        <button 
                          onClick={() => setWorkExperience(workExperience.filter((_, idx) => idx !== i))} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...workExperience]
                            updated[i].company = e.target.value
                            setWorkExperience(updated)
                          }}
                          placeholder="Company"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors"
                        />
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const updated = [...workExperience]
                            updated[i].title = e.target.value
                            setWorkExperience(updated)
                          }}
                          placeholder="Job Title"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors"
                        />
                      </div>
                      <textarea
                        value={exp.bullets.join('\n')}
                        onChange={(e) => {
                          const updated = [...workExperience]
                          updated[i].bullets = e.target.value.split('\n')
                          setWorkExperience(updated)
                        }}
                        placeholder="Key achievements (one per line)"
                        rows={3}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Education</h3>
                </div>
                <button 
                  onClick={addEducation} 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {education.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200/50 p-8 shadow-sm text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No education added yet.</p>
                  <button
                    onClick={addEducation}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    + Add your education
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={edu.id} className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Education {i + 1}</span>
                        <button 
                          onClick={() => setEducation(education.filter((_, idx) => idx !== i))} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...education]
                            updated[i].institution = e.target.value
                            setEducation(updated)
                          }}
                          placeholder="Institution"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 transition-colors"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...education]
                            updated[i].degree = e.target.value
                            setEducation(updated)
                          }}
                          placeholder="Degree"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 transition-colors"
                        />
                        <input
                          type="text"
                          value={edu.field || ''}
                          onChange={(e) => {
                            const updated = [...education]
                            updated[i].field = e.target.value
                            setEducation(updated)
                          }}
                          placeholder="Field of Study"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 transition-colors"
                        />
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => {
                            const updated = [...education]
                            updated[i].year = e.target.value
                            setEducation(updated)
                          }}
                          placeholder="Year"
                          className="px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 hover:border-gray-300 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-900">Skills</h3>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add a skill (press Enter)"
                    className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 hover:border-gray-300 transition-colors"
                  />
                  <button 
                    onClick={addSkill} 
                    className="px-4 py-3 bg-gray-900 hover:bg-gray-900 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                  >
                    Add
                  </button>
                </div>
                
                {skills.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No skills added yet. Start typing above!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700"
                      >
                        {skill}
                        <button 
                          onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} 
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Links */}
          {activeSection === 'links' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-medium text-gray-900">Professional Links</h3>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={links.linkedin || ''}
                    onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-gray-300 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input
                    type="url"
                    value={links.github || ''}
                    onChange={(e) => setLinks({ ...links, github: e.target.value })}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-gray-300 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
                  <input
                    type="url"
                    value={links.portfolio || ''}
                    onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-gray-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Goals */}
          {activeSection === 'goals' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-medium text-gray-900">Target Roles</h3>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/50 p-5 shadow-sm">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTargetRole}
                    onChange={(e) => setNewTargetRole(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTargetRole()}
                    placeholder="Add a target role (press Enter)"
                    className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 hover:border-gray-300 transition-colors"
                  />
                  <button 
                    onClick={addTargetRole} 
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                  >
                    Add
                  </button>
                </div>
                
                {targetRoles.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No target roles added yet. What roles are you aiming for?</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {targetRoles.map((role, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700"
                      >
                        {role}
                        <button 
                          onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} 
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}