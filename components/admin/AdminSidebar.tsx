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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl font-bold">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
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
                      w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      text-gray-300 hover:bg-gray-800 hover:text-white
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isSubmenuOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isSubmenuOpen && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = child.href ? isActive(child.href) : false
                        
                        return (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-lg text-sm
                              transition-colors duration-200
                              ${childActive 
                                ? 'bg-red-500 text-white' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              }
                            `}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span className="font-medium">{child.label}</span>
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
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${active 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Site</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}