'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/providers/auth-provider'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthContext()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-black">Sabitek</span>
              <span className="text-xs text-red-500 font-semibold">LMS</span>
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
              <div className="flex items-center space-x-4">
                <div className="hidden md:block text-sm text-gray-600">
                  <span className="font-medium">{userProfile?.full_name || user.email}</span>
                  {userProfile?.role && (
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded-full">
                      {userProfile.role}
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Logout
                </Button>
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
              <Link 
                href="/courses" 
                className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>
              {user && (
                <Link 
                  href={getDashboardLink()} 
                  className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
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