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
  AlertCircle
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
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'goals', label: 'Goals', icon: Target }
  ]

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Career Profile</h1>
          <p className="text-sm text-gray-500">{profileCompleteness}% complete</p>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 
           saveStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : 
           <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Section Nav */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 p-3 hidden md:block">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg mb-1 ${
                  activeSection === section.id
                    ? 'bg-red-50 text-red-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Basic Info */}
          {activeSection === 'basic' && (
            <div className="max-w-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Lagos, Nigeria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Brief overview of your professional background..."
                />
              </div>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && (
            <div className="max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Work Experience</h3>
                <button
                  onClick={addWorkExperience}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {workExperience.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No experience added yet.</p>
              ) : (
                <div className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <span className="text-sm text-gray-500">Experience {i + 1}</span>
                        <button onClick={() => setWorkExperience(workExperience.filter((_, idx) => idx !== i))} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...workExperience]
                            updated[i].company = e.target.value
                            setWorkExperience(updated)
                          }}
                          placeholder="Company"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Education</h3>
                <button onClick={addEducation} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {education.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No education added yet.</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <span className="text-sm text-gray-500">Education {i + 1}</span>
                        <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...education]
                            updated[i].institution = e.target.value
                            setEducation(updated)
                          }}
                          placeholder="Institution"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <h3 className="font-medium text-gray-900 mb-4">Skills</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button onClick={addSkill} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {skill}
                    <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {activeSection === 'links' && (
            <div className="max-w-2xl space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Professional Links</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={links.linkedin || ''}
                  onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <input
                  type="url"
                  value={links.github || ''}
                  onChange={(e) => setLinks({ ...links, github: e.target.value })}
                  placeholder="https://github.com/yourusername"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={links.portfolio || ''}
                  onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* Goals */}
          {activeSection === 'goals' && (
            <div className="max-w-2xl">
              <h3 className="font-medium text-gray-900 mb-4">Target Roles</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTargetRole()}
                  placeholder="Add a target role"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button onClick={addTargetRole} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {targetRoles.map((role, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                    {role}
                    <button onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Section Selector */}
          <div className="md:hidden mb-4">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}