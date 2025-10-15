'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Sparkles, User, Settings, LogOut, ChevronDown } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthContext()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    } else {
      setUserProfile(null)
    }
  }, [user])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getDashboardLink = () => {
    if (!userProfile) return '/dashboard'
    return userProfile.role === 'instructor' ? '/instructor' : '/dashboard'
  }

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">Sabitek</span>
              <Sparkles className="w-4 h-4 text-red-500 mb-2" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/courses" 
              className="text-gray-700 hover:text-red-500 transition-colors"
            >
              Courses
            </Link>
            
            {user && (
              <Link 
                href={getDashboardLink()} 
                className="text-gray-700 hover:text-red-500 transition-colors"
              >
                Dashboard
              </Link>
            )}

            {userProfile?.role === 'instructor' && (
              <Link 
                href="/instructor/courses/create" 
                className="text-gray-700 hover:text-red-500 transition-colors"
              >
                Create Course
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Avatar & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-sm font-semibold text-red-600">
                          {userProfile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}

                    {/* User Info */}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || user.email}
                      </p>
                      {userProfile?.role && (
                        <p className="text-xs text-gray-500 capitalize">
                          {userProfile.role}
                        </p>
                      )}
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        {/* User Info in Dropdown */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {userProfile?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          href={getDashboardLink()}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>

                        <hr className="my-2 border-gray-100" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="border-gray-300">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {/* User Info Mobile */}
              {user && (
                <div className="px-3 py-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex items-center space-x-3">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-lg font-semibold text-red-600">
                          {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || user.email}
                      </p>
                      {userProfile?.role && (
                        <p className="text-xs text-gray-500 capitalize">
                          {userProfile.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Link 
                href="/courses" 
                className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>
              {user && (
                <>
                  <Link 
                    href={getDashboardLink()} 
                    className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile" 
                    className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                </>
              )}
              {userProfile?.role === 'instructor' && (
                <Link 
                  href="/instructor/courses/create" 
                  className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Course
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}