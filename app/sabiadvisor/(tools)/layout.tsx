'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { 
  Briefcase,
  FileText,
  Mail,
  MessageSquare,
  Map,
  User,
  Wallet,
  Plus,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react'

const tools = [
  {
    id: 'profile',
    title: 'My Profile',
    icon: User,
    href: '/sabiadvisor/profile',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  {
    id: 'cv',
    title: 'CV Builder',
    icon: FileText,
    href: '/sabiadvisor/cv',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'cover-letter',
    title: 'Cover Letter',
    icon: Mail,
    href: '/sabiadvisor/cover-letter',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'interview',
    title: 'Interview Prep',
    icon: MessageSquare,
    href: '/sabiadvisor/interview',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'roadmap',
    title: 'Career Roadmap',
    icon: Map,
    href: '/sabiadvisor/survey',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
]

export default function SabiAdvisorToolsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { balance } = useWallet()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const currentTool = tools.find(t => pathname.startsWith(t.href)) || tools[0]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Back to landing */}
              <Link 
                href="/sabiadvisor"
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="h-5 w-px bg-gray-200 hidden sm:block" />
              
              {/* Current tool */}
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-900">SabiAdvisor</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 text-sm">{currentTool.title}</span>
              </div>
            </div>

            {/* Wallet */}
            <div className="flex items-center gap-2">
              <Link
                href="/account/wallet"
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {balance?.balanceFormatted || '₦0'}
                </span>
              </Link>
              <Link
                href="/account/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Top Up</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30
          w-56 bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200 ease-in-out
          pt-16 lg:pt-0
        `}>
          <nav className="flex-1 p-3 space-y-1">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = pathname.startsWith(tool.href)
              
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? `${tool.bgColor} ${tool.color} font-medium`
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? tool.color : 'text-gray-400'}`} />
                  {tool.title}
                </Link>
              )
            })}
          </nav>

          {/* Help link */}
          <div className="p-3 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">
                Need help? Check our guides on creating effective CVs and cover letters.
              </p>
              <Link
                href="/support"
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                View Help Center →
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}