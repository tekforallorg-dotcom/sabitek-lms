'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import NotificationBell from '@/components/layout/NotificationBell'
// Wallet feature hidden (routes remain; nav entry removed)
import { User, Settings, LogOut, ChevronDown, Sparkles } from 'lucide-react'

/* Nav link with animated gradient underline */
function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative py-1 text-sm font-medium transition-colors ${
        active ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
      }`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-0 h-px w-full bg-gradient-to-r from-red-500 to-rose-400 origin-left transition-transform duration-300 ${
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
        aria-hidden="true"
      />
    </Link>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, signOut, displayRole, homeRoute } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)


  const handleLogout = async () => {
    try {
      await signOut()
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Use the server-resolved home route so institution admins land on
  // /institution/dashboard and super admins on /admin (users.role alone
  // cannot distinguish them from learners).
  const getDashboardLink = () => {
    if (!user) return '/dashboard'
    if (homeRoute && homeRoute !== '/dashboard') return homeRoute
    return userProfile?.role === 'instructor' ? '/instructor' : '/dashboard'
  }

  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-rose-100/80 shadow-[0_10px_30px_-22px_rgba(225,29,72,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">Sabitek</span>
              <Sparkles className="w-4 h-4 text-red-500 mb-2" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink href="/courses" active={pathname === '/courses'}>
              Courses
            </NavLink>

            {user && (
              <>
                <NavLink href={getDashboardLink()} active={pathname === getDashboardLink()}>
                  Dashboard
                </NavLink>
              </>
            )}

            {userProfile?.role === 'instructor' && (
              <NavLink href="/instructor/courses/create" active={pathname === '/instructor/courses/create'}>
                Create Course
              </NavLink>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 pl-1.5 pr-3 py-1.5 rounded-full border border-transparent hover:border-rose-100 hover:bg-rose-50/50 transition-all cursor-pointer"
                  >
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center ring-2 ring-white shadow-sm">
                        <span className="text-sm font-semibold text-white">
                          {userProfile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}

                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || user.email}
                      </p>
                      {displayRole && (
                        <p className="text-xs text-gray-500 capitalize">
                          {displayRole}
                        </p>
                      )}
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_30px_60px_-25px_rgba(225,29,72,0.4)] py-2 z-20 overflow-hidden">
                        <span className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />

                        <div className="px-4 py-3 border-b border-rose-50">
                          <p className="text-sm font-medium text-gray-900">
                            {userProfile?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.email}
                          </p>
                        </div>

                        <div className="px-1.5 pt-1.5">
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-rose-50/60 hover:text-red-600 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>

                          <Link
                            href={getDashboardLink()}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-rose-50/60 hover:text-red-600 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Dashboard</span>
                          </Link>

                        </div>

                        <hr className="my-2 border-rose-50" />

                        <div className="px-1.5 pb-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="rounded-full bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 text-sm font-semibold px-5 shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="group relative overflow-hidden rounded-full bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold px-5 ring-1 ring-red-600/50 shadow-[0_10px_22px_-8px_rgba(225,29,72,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(225,29,72,0.6)]">
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-1 bg-white/90 backdrop-blur-xl rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-25px_rgba(225,29,72,0.35)] p-2 mb-2">
              {user && (
                <div className="px-3 py-3 bg-rose-50/60 rounded-xl mb-1">
                  <div className="flex items-center space-x-3">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center ring-2 ring-white shadow-sm">
                        <span className="text-lg font-semibold text-white">
                          {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || user.email}
                      </p>
                      {displayRole && (
                        <p className="text-xs text-gray-500 capitalize">
                          {displayRole}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Link
                href="/courses"
                className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50/60 hover:text-red-600 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>

              {user && (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50/60 hover:text-red-600 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50/60 hover:text-red-600 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>

                </>
              )}

              {userProfile?.role === 'instructor' && (
                <Link
                  href="/instructor/courses/create"
                  className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50/60 hover:text-red-600 rounded-xl transition-colors"
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
