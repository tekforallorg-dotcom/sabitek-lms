'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { 
  Search, 
  Zap, 
  TrendingUp,
  Wallet,
  Plus,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import { sabitoolsCatalog } from '@/lib/sabitools-catalog'
import SabiLoader from '@/components/ui/SabiLoader'

export default function SabiSuitePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { balance } = useWallet()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = sabitoolsCatalog.filter(tool => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.shortDescription.toLowerCase().includes(query) ||
      tool.longDescription.toLowerCase().includes(query) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] font-bold rounded-lg uppercase shadow-sm">
            New
          </span>
        )
      case 'popular':
        return (
          <span className="px-2 py-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold rounded-lg uppercase shadow-sm flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" />
            Hot
          </span>
        )
      case 'beta':
        return (
          <span className="px-2 py-1 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-[10px] font-bold rounded-lg uppercase shadow-sm">
            Beta
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SabiLoader text="Loading..." size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Sub Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">SabiSuite</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>{sabitoolsCatalog.length} tools</span>
              </div>
              {user && (
                <>
                  <Link
                    href="/account/wallet"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md"
                  >
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {balance?.balanceFormatted || '₦0'}
                    </span>
                  </Link>
                  <Link
                    href="/account/wallet"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Top Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero - Compact with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-red-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-100/50 via-transparent to-pink-100/50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-red-600 px-4 py-2 rounded-full text-xs font-semibold mb-4 border border-red-100 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Learning Suite
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              All Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">Learning Tools</span>
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto mb-6">
              Discover AI tools that help you learn, create, and grow your career.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 shadow-lg shadow-gray-200/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    if (!user) {
                      router.push(`/auth/login?redirect=${tool.href}`)
                    } else {
                      router.push(tool.href)
                    }
                  }}
                  className="group relative bg-white rounded-3xl border border-gray-200/80 p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-200 hover:-translate-y-1"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-pink-50/0 group-hover:from-red-50/50 group-hover:to-pink-50/50 rounded-3xl transition-all duration-300" />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Icon */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 group-hover:scale-105 transition-all duration-300">
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      {getStatusBadge(tool.status)}
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {tool.shortDescription}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {tool.longDescription}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.tags.map((tag, i) => (
                        <span 
                          key={i}
                          className="px-2.5 py-1 bg-gray-100 group-hover:bg-white text-gray-600 text-[11px] font-medium rounded-lg transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">Click to open</span>
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-300">
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No tools found</h3>
            <p className="text-xs text-gray-500">Try a different search term</p>
          </div>
        )}

        {/* Coming Soon */}
        <div className="mt-10 relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Coming Soon</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">More tools on the way</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              We're building more AI-powered tools to help learners across Africa succeed. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}