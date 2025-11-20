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
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-24 sm:pb-28 md:pb-36 overflow-hidden">
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
            <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
              Welcome to <span className="text-red-500">Sabitek</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 sm:mb-12 px-4">
              Your AI-powered classroom, with free access to real skills 
              and future-ready learning for every learner.
            </p>
            
            {user ? (
              <div className="space-y-5 sm:space-y-6">
                <div className="animate-pulse-subtle">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-red-50/80 to-pink-50/80 hover:from-red-100 hover:to-pink-100 border border-red-200/60 rounded-full text-red-600 hover:text-red-700 font-medium text-sm sm:text-base transition-all hover:scale-105 shadow-sm hover:shadow-md group backdrop-blur-sm"
                  >
                    Learn more about Sabitek
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:space-x-0 justify-center items-center">
                  <Link href="/dashboard">
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                     Dashboard
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" className="border-gray-300 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                      Browse Courses
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                <div className="animate-pulse-subtle">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-red-50/80 to-pink-50/80 hover:from-red-100 hover:to-pink-100 border border-red-200/60 rounded-full text-red-600 hover:text-red-700 font-medium text-sm sm:text-base transition-all hover:scale-105 shadow-sm hover:shadow-md group backdrop-blur-sm"
                  >
                    Learn about Sabitek
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:space-x-0 justify-center items-center">
                  <Link href="/auth/register">
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="border-gray-300 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Search Section - NEW */}
      <section className="py-16 sm:py-18 md:py-20 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              What would you like to learn today?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 px-4 mb-2">
              Tell us your interests and get AI-powered course recommendations
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g., 'Web development', 'Data science'"
                className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-200 focus:border-red-500 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Recommendations Grid */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                Recommended Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {recommendations.map((course) => (
                  <Card
                    key={course.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`)}
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-base line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
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
              <div className="text-center mt-4 sm:mt-6">
                <Link href="/courses">
                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 text-sm sm:text-base">
                    Browse All Courses
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Empty State */}
          {showRecommendations && recommendations.length === 0 && (
            <div className="text-center py-6 sm:py-8 px-4">
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                No courses found for "{searchQuery}". Try a different search term.
              </p>
              <Link href="/courses">
                <Button variant="outline" className="text-sm sm:text-base">
                  Browse All Courses
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10 sm:mb-12 md:mb-14">
            Why Choose Sabitek?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Feature 1 */}
            <div className="text-center px-4">
              <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Personalized Learning</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Our AI tracks your progress, adapts to your pace, and recommends the next best lesson, quiz, or course for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center px-4">
              <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">AI-Powered Learning</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Get on-demand help from AI tutors, lesson summaries, and smart quizzes that make complex topics easy to understand.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center px-4">
              <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Progress You Can See</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track your growth with dashboards, streaks, and certificates that show employers, schools, and partners what you’ve learned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-red-500">100+</div>
              <div className="text-sm sm:text-base text-gray-600 mt-3">Active Courses</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-red-500">1000+</div>
              <div className="text-sm sm:text-base text-gray-600 mt-3">Students</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-red-500">50+</div>
              <div className="text-sm sm:text-base text-gray-600 mt-3">Expert Instructors</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-red-500">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 2px, transparent 2px)',
            backgroundSize: '30px 30px'
          }}
        ></div>

        {/* Wave pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255, 255, 255, 0.15) 40px, transparent 80px)'
          }}
        ></div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-5 drop-shadow-lg">
            Ready to Start Learning?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 max-w-2xl mx-auto drop-shadow px-4">
            Join thousands of learners advancing their careers with Sabitek
          </p>
          {!user && (
            <Link href="/auth/register">
              <Button className="bg-white text-red-600 hover:bg-gray-50 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                Sign Up for Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}