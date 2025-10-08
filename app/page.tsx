'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Search, Sparkles, ChevronRight } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  instructor_id: string
  instructor?: {
    full_name: string
  }
  price: number
  level: string
  category: string
  slug?: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recommendations, setRecommendations] = useState<Course[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowRecommendations(false)

    try {
      // Search for courses that match the query
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(full_name)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(3)

      if (!error && courses) {
        setRecommendations(courses)
        setShowRecommendations(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section with Background Image */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2032&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08,
            filter: 'grayscale(100%)'
          }}
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-red-500">Sabitek</span> LMS
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Empowering African education through technology. Learn from expert instructors, 
              access quality courses, and transform your future.
            </p>
            
            {user ? (
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline" className="border-gray-300 px-8 py-3 text-lg">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-x-4">
                <Link href="/auth/register">
                  <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-gray-300 px-8 py-3 text-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Search Section - NEW */}
      <section className="py-16 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              What would you like to learn today?
            </h2>
            <p className="text-gray-600">
              Tell us your interests and get AI-powered course recommendations
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g., 'Web development', 'Data science', 'Digital marketing'"
                className="w-full pl-12 pr-32 py-4 text-base border-2 border-gray-200 focus:border-red-500 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-1.5 text-sm"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Recommendations Grid */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">
                Recommended Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((course) => (
                  <Card 
                    key={course.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {course.instructor?.full_name || 'Instructor'}
                        </span>
                        <span className="font-bold text-red-500">
                          {course.price === 0 ? 'Free' : `$${course.price}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/courses">
                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                    Browse All Courses
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Empty State */}
          {showRecommendations && recommendations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No courses found for "{searchQuery}". Try a different search term.
              </p>
              <Link href="/courses">
                <Button variant="outline">
                  Browse All Courses
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Sabitek?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
              <p className="text-gray-600">
                Expert-crafted courses with multimedia lessons, from text to video
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Get instant summaries and answers to your questions with AI assistance
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed progress tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-500">100+</div>
              <div className="text-gray-600 mt-2">Active Courses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500">1000+</div>
              <div className="text-gray-600 mt-2">Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500">50+</div>
              <div className="text-gray-600 mt-2">Expert Instructors</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of learners advancing their careers with Sabitek
          </p>
          {!user && (
            <Link href="/auth/register">
              <Button className="bg-white text-red-500 hover:bg-gray-100 px-8 py-3 text-lg">
                Sign Up for Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}