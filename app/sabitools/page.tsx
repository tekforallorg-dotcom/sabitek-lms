'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Zap, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { sabitoolsCatalog } from '@/lib/sabitools-catalog'

export default function SabiToolsPage() {
  const router = useRouter()
  const { user } = useAuth()
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
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            NEW
          </span>
        )
      case 'popular':
        return (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            POPULAR
          </span>
        )
      case 'beta':
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            BETA
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
  <span className="text-red-500">Sabi</span>Tools
</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8">
              One place to access Sabitek tools that help you learn, create, and grow your career.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="h-16 bg-gray-50 relative -mt-1">
          <svg 
            className="absolute -top-1 left-0 w-full h-16 text-gray-900" 
            viewBox="0 0 1440 64" 
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,32 C480,64 960,0 1440,32 L1440,0 L0,0 Z"></path>
          </svg>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>{sabitoolsCatalog.length} tools available</span>
          </div>
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon
              return (
                <Card 
                  key={tool.id}
                  className="group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-red-200 overflow-hidden cursor-pointer"
                  onClick={() => router.push(tool.href)}
                >
                  <CardContent className="p-0">
                    {/* Card Header with gradient */}
                    <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
                    
                    <div className="p-5 sm:p-6">
                      {/* Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <IconComponent className="w-6 h-6 text-red-600" />
                        </div>
                        {getStatusBadge(tool.status)}
                      </div>

                      {/* Name */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                        {tool.name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-sm text-gray-500 mb-3">
                        {tool.shortDescription}
                      </p>

                      {/* Long Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {tool.longDescription}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tool.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <Button
                        className="w-full bg-gray-900 hover:bg-red-600 text-white transition-colors group-hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!user) {
                            router.push(`/auth/login?redirect=${tool.href}`)
                          } else {
                            router.push(tool.href)
                          }
                        }}
                      >
                        Open Tool
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
            <p className="text-sm text-gray-600">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            More tools coming soon
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're building more AI-powered tools to help Nigerian learners succeed. 
            Stay tuned for updates!
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/courses')}
            className="border-gray-300"
          >
            Browse Courses
          </Button>
        </div>
      </div>
    </div>
  )
}