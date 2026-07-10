'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  BarChart3,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
  ChevronLeft,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Building2,
  ClipboardList
} from 'lucide-react'
import { useAuthContext } from '@/components/providers/auth-provider'

interface NavItem {
  label: string
  href?: string
  icon: any
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Institutions', href: '/admin/institutions', icon: Building2 },
  { label: 'Applications', href: '/admin/applications', icon: ClipboardList },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Certificates', href: '/admin/certificates', icon: Award },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard },
  {
    label: 'SabiQuiz',
    icon: Brain,
    children: [
      { label: 'Materials', href: '/admin/sabiquiz/materials', icon: FileText },
      { label: 'Questions', href: '/admin/sabiquiz/questions', icon: MessageSquare },
      { label: 'Analytics', href: '/admin/sabiquiz/analytics', icon: TrendingUp },
    ]
  },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  // '/admin/settings' link removed: the page does not exist yet (was a 404).
]

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>('SabiQuiz')
  const pathname = usePathname()
  const { signOut } = useAuthContext()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/85 backdrop-blur-xl border border-rose-100 text-gray-700 shadow-sm hover:bg-white hover:text-red-600 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white/85 backdrop-blur-xl border-r border-rose-100
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-rose-100">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isSubmenuOpen = openSubmenu === item.label
            const active = item.href ? isActive(item.href) : false

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl
                      text-sm font-medium transition-colors
                      border border-transparent
                      text-gray-600 hover:bg-rose-50/60 hover:text-red-600
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isSubmenuOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isSubmenuOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l border-rose-100 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = child.href ? isActive(child.href) : false

                        return (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                              transition-colors
                              ${childActive
                                ? 'bg-rose-50/70 border border-rose-100 text-red-600 font-semibold'
                                : 'border border-transparent text-gray-600 font-medium hover:bg-rose-50/60 hover:text-red-600'
                              }
                            `}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                  transition-colors
                  ${active
                    ? 'bg-rose-50/70 border border-rose-100 text-red-600 font-semibold'
                    : 'border border-transparent text-gray-600 font-medium hover:bg-rose-50/60 hover:text-red-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-rose-100 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-rose-50/60 hover:text-red-600 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-rose-50/60 hover:text-red-700 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
