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
  ChevronLeft,
  Sparkles
} from 'lucide-react'

const tools = [
  {
    id: 'profile',
    title: 'My Profile',
    icon: User,
    href: '/sabiadvisor/profile',
    color: 'text-gray-700',
    activeColor: 'text-gray-900',
    bgColor: 'bg-gray-100',
    activeBg: 'bg-gradient-to-r from-gray-100 to-gray-50'
  },
  {
    id: 'cv',
    title: 'CV Builder',
    icon: FileText,
    href: '/sabiadvisor/cv',
    color: 'text-blue-600',
    activeColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    activeBg: 'bg-gradient-to-r from-blue-100 to-blue-50'
  },
  {
    id: 'cover-letter',
    title: 'Cover Letter',
    icon: Mail,
    href: '/sabiadvisor/cover-letter',
    color: 'text-green-600',
    activeColor: 'text-green-700',
    bgColor: 'bg-green-50',
    activeBg: 'bg-gradient-to-r from-green-100 to-green-50'
  },
  {
    id: 'interview',
    title: 'Interview Prep',
    icon: MessageSquare,
    href: '/sabiadvisor/interview',
    color: 'text-purple-600',
    activeColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    activeBg: 'bg-gradient-to-r from-purple-100 to-purple-50'
  },
  {
    id: 'roadmap',
    title: 'Career Roadmap',
    icon: Map,
    href: '/sabiadvisor/survey',
    color: 'text-orange-600',
    activeColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    activeBg: 'bg-gradient-to-r from-orange-100 to-orange-50'
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50/50 via-white to-red-50/30 flex flex-col">
      {/* Top Header - Pink Gradient - Fixed overflow */}
      <header className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 sticky top-0 z-40 shadow-lg shadow-pink-500/10 overflow-hidden">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white transition-colors flex-shrink-0"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Back to landing */}
              <Link 
                href="/sabiadvisor"
                className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="h-5 w-px bg-white/20 hidden sm:block flex-shrink-0" />
              
              {/* Current tool */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 flex-shrink-0">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="font-semibold text-white hidden md:inline">SabiAdvisor</span>
                <span className="text-white/60 hidden md:inline">/</span>
                <span className="text-white/90 text-sm truncate max-w-[100px] sm:max-w-none">{currentTool.title}</span>
              </div>
            </div>

            {/* Wallet - More compact on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                href="/account/wallet"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg sm:rounded-xl border border-white/30 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  {balance?.balanceFormatted || '₦0'}
                </span>
              </Link>
              <Link
                href="/account/wallet"
                className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-white/90 text-red-600 text-sm font-medium rounded-lg sm:rounded-xl transition-all shadow-lg shadow-black/10"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Top Up</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Enhanced */}
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30
          w-60 bg-white/80 backdrop-blur-md border-r border-gray-200/50 flex flex-col
          transition-transform duration-300 ease-out
          pt-16 lg:pt-0 shadow-xl lg:shadow-none
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">AI Career Tools</p>
                <p className="text-sm font-semibold text-gray-900">SabiAdvisor</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = pathname.startsWith(tool.href)
              
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? `${tool.activeBg} ${tool.activeColor} font-medium shadow-sm`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? tool.bgColor : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? tool.color : 'text-gray-400'}`} />
                  </div>
                  {tool.title}
                </Link>
              )
            })}
          </nav>

          {/* Help Section - Enhanced */}
          <div className="p-3 border-t border-gray-100">
            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4 border border-pink-100">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-700">Need help?</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Check our guides on creating effective CVs and cover letters.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                View Help Center →
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden transition-opacity"
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