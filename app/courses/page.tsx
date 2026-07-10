'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import SabiLoader from '@/components/ui/SabiLoader'
import { BookOpen, User, Search, Filter, ArrowRight, Play } from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  difficulty_level: string
  cover_image_url?: string
  category?: string
  instructor?: {
    full_name: string
  }
  lessons?: {
    id: string
  }[]
}

export default function CoursesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchCourses()
    }
  }, [user, loading, router])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(full_name),
          lessons(id)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
      setFilteredCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  useEffect(() => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === selectedLevel)
    }

    setFilteredCourses(filtered)
  }, [searchTerm, selectedCategory, selectedLevel, courses])

  const categories = ['all', 'programming', 'design', 'business', 'marketing', 'languages']
  const levels = ['all', 'beginner', 'intermediate', 'advanced']

  const getDifficultyChip = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'intermediate': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'advanced': return 'bg-rose-50 text-rose-600 border-rose-100'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading courses..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* ── Header ── */}
      <section className="relative overflow-hidden border-b border-rose-100/80">
        <div className="absolute -top-24 right-[-8%] w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-[-8%] w-72 h-72 bg-red-50 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
            Course catalog
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-1">
            Find your next{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              skill
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Structured courses with clear paths, checkpoints, and certificates.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {/* ── Filters ── */}
        <div className="relative bg-white/85 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_16px_35px_-24px_rgba(225,29,72,0.4)] p-4 mb-5 overflow-hidden">
          <span className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 rounded-full bg-rose-50/60 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-11 pl-10 pr-3 border border-rose-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300 bg-rose-50/60 text-sm cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full h-11 px-4 border border-rose-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300 bg-rose-50/60 text-sm cursor-pointer"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredCourses.length}</span>{' '}
          {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>

        {/* ── Courses grid ── */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-25px_rgba(225,29,72,0.35)] p-10 text-center">
            <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-rose-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courses{' '}
              <span className="font-serif italic text-red-600">found</span>
            </h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <div className="group bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden hover:shadow-[0_24px_50px_-20px_rgba(225,29,72,0.45)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                  {/* Cover */}
                  <div className="relative h-36 bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden">
                    {course.cover_image_url ? (
                      <img
                        src={course.cover_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-rose-200" />
                      </div>
                    )}

                    {/* Difficulty chip */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur bg-white/90 ${getDifficultyChip(course.difficulty_level)}`}>
                        {course.difficulty_level}
                      </span>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-rose-950/0 group-hover:bg-rose-950/25 transition-all flex items-center justify-center">
                      <div className="w-11 h-11 bg-white/95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-xl">
                        <Play className="w-4 h-4 text-red-500 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-rose-400" />
                        <span className="truncate max-w-[80px]">{course.instructor?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-rose-400" />
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                    </div>

                    {/* Category */}
                    {course.category && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-rose-50/70 border border-rose-100 text-gray-600 rounded-lg">
                          <span className="w-1 h-1 rounded-full bg-rose-400" />
                          {course.category}
                        </span>
                      </div>
                    )}

                    {/* CTA */}
                    <button className="relative overflow-hidden w-full py-2.5 bg-gradient-to-b from-red-500 to-rose-600 group-hover:to-rose-500 text-white rounded-full transition-all text-xs font-semibold flex items-center justify-center gap-2 mt-auto shadow-[0_8px_18px_-8px_rgba(225,29,72,0.55)] group-hover:shadow-[0_10px_22px_-8px_rgba(225,29,72,0.6)] cursor-pointer">
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                      View Course
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
