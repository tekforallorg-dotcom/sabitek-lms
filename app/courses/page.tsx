'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { BookOpen, Clock, User, Search, Filter } from 'lucide-react'

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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-50 text-green-700 border-green-200'
      case 'intermediate': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'advanced': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Discover Courses</h1>
          <p className="mt-2 text-gray-600">Find the perfect course to advance your skills</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
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

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-red-500 hover:shadow-lg transition-all cursor-pointer flex flex-col"
                onClick={() => router.push(`/courses/${course.slug}`)}
              >
                {/* Course Cover */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Difficulty Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
                    </span>
                  </div>
                </div>

                {/* Content - Flex column with flex-1 */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                    {course.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{course.instructor?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{course.lessons?.length || 0} lessons</span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {course.category && (
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {course.category}
                      </span>
                    </div>
                  )}

                  {/* View Button - mt-auto pushes to bottom */}
                  <button
                    className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium group-hover:shadow-md mt-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/courses/${course.slug}`)
                    }}
                  >
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}