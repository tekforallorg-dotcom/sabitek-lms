'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { User, Settings, LogOut, ChevronDown, Zap, CreditCard } from 'lucide-react'
import { sabitoolsCatalog } from '@/lib/sabitools-catalog'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSabiToolsOpen, setIsSabiToolsOpen] = useState(false)

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

  const closeAllMenus = () => {
    setIsSabiToolsOpen(false)
    setIsMenuOpen(false)
  }

  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">Sabitek</span>
              <Zap className="w-4 h-4 text-red-500 mb-2" />
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
              <>
                <Link 
                  href={getDashboardLink()} 
                  className="text-gray-700 hover:text-red-500 transition-colors"
                >
                  Dashboard
                </Link>

                {/* SabiTools Dropdown - Desktop */}
                <div 
                  className="relative"
                  onMouseEnter={() => setIsSabiToolsOpen(true)}
                  onMouseLeave={() => setIsSabiToolsOpen(false)}
                >
                  <button 
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors py-2"
                    onClick={() => setIsSabiToolsOpen(!isSabiToolsOpen)}
                  >
                    <Zap className="w-4 h-4" />
                    <span>SabiTools</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSabiToolsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSabiToolsOpen && (
                    <div className="absolute left-0 top-full w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 mt-0">
                      {/* View All link at top */}
                      <Link
                        href="/sabitools"
                        className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-red-500 border-b border-gray-100 mb-1"
                        onClick={() => setIsSabiToolsOpen(false)}
                      >
                        <span>View all tools</span>
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </Link>
                      
                      {sabitoolsCatalog.map((tool) => {
                        const IconComponent = tool.icon
                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                            onClick={() => setIsSabiToolsOpen(false)}
                          >
                            <IconComponent className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{tool.name}</span>
                                {tool.status === 'new' && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                    NEW
                                  </span>
                                )}
                                {tool.status === 'popular' && (
                                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded-full">
                                    HOT
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{tool.shortDescription}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
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

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
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

                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {userProfile?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.email}
                          </p>
                        </div>

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

                        <Link
                          href="/account/billing"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Billing</span>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
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

                  {/* SabiTools - Mobile */}
                  <div className="px-3 py-2">
                    <button
                      onClick={() => setIsSabiToolsOpen(!isSabiToolsOpen)}
                      className="flex items-center justify-between w-full text-gray-700"
                    >
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>SabiTools</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isSabiToolsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSabiToolsOpen && (
                      <div className="ml-4 mt-2 space-y-1">
                        {/* View all link for mobile */}
                        <Link
                          href="/sabitools"
                          className="flex items-center space-x-2 px-3 py-2 text-xs text-red-600 font-medium hover:bg-red-50 rounded"
                          onClick={closeAllMenus}
                        >
                          <span>View all tools →</span>
                        </Link>
                        
                        {sabitoolsCatalog.map((tool) => {
                          const IconComponent = tool.icon
                          return (
                            <Link
                              key={tool.id}
                              href={tool.href}
                              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                              onClick={closeAllMenus}
                            >
                              <IconComponent className="w-4 h-4 text-red-500" />
                              <span>{tool.name}</span>
                              {tool.status === 'new' && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                                  NEW
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Link 
                    href="/profile" 
                    className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>

                  <Link 
                    href="/account/billing" 
                    className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
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