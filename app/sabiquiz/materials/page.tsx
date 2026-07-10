'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  Trash2, 
  Calendar, 
  HardDrive, 
  Flame, 
  Star, 
  Trophy, 
  ChevronRight, 
  Wallet, 
  Plus,
  Sparkles,
  BookOpen,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FileUpload from '@/components/sabiquiz/FileUpload'
import { getUserXP } from '@/lib/sabiquiz/quiz-utils'
import type { Material } from '@/lib/sabiquiz/types'
import { toast } from '@/components/ui/toast'

interface QuickStats {
  level: number
  totalXp: number
  currentStreak: number
  totalQuizzes: number
}

const LEVEL_TITLES = [
  'Novice', 'Learner', 'Student', 'Scholar', 'Expert',
  'Master', 'Grandmaster', 'Sage', 'Wizard', 'Legend'
]

export default function MaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const { balance } = useWallet()

  useEffect(() => {
    Promise.all([fetchMaterials(), fetchQuickStats()])
  }, [])

  async function fetchQuickStats() {
    try {
      setStatsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatsLoading(false)
        return
      }

      // Run all queries in parallel
      const [xpData, streakResult, countResult] = await Promise.all([
        getUserXP(user.id),
        supabase
          .from('study_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('sabiquiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
      ])

      setQuickStats({
        level: xpData.currentLevel,
        totalXp: xpData.totalXp,
        currentStreak: streakResult.data?.current_streak || 0,
        totalQuizzes: countResult.count || 0,
      })
    } catch (err) {
      console.error('Error fetching quick stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  async function fetchMaterials() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('No user logged in')
        setMaterials([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('sabiquiz_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteMaterial(id: string, filePath: string) {
    if (!confirm('Delete this material? This cannot be undone.')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.warning('You must be logged in to delete materials')
        return
      }

      await supabase.storage.from('sabiquiz-materials').remove([filePath])

      const { error } = await supabase
        .from('sabiquiz_materials')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      fetchMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Failed to delete material')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
          {/* Top Row: Title + Wallet */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-white/10">
                <Sparkles className="w-3 h-3" />
                AI-Powered Learning
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Study Materials</h1>
              <p className="text-gray-400 text-sm">
                Upload materials to generate AI-powered quizzes
              </p>
            </div>
            
            {/* Wallet Display */}
<div className="flex items-center gap-2">
  <Link
    href="/sabiquiz/history"
    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
  >
    <Clock className="w-4 h-4 text-gray-300" />
    <span className="text-sm font-medium text-white hidden sm:inline">History</span>
  </Link>
  <Link
    href="/account/wallet"
    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
  >
    <Wallet className="w-4 h-4 text-gray-300" />
    <span className="text-sm font-medium text-white">
      {balance?.balanceFormatted || '₦0'}
    </span>
  </Link>
  <Link
    href="/account/wallet"
    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
  >
    <Plus className="w-4 h-4" />
    <span className="hidden sm:inline">Top Up</span>
  </Link>
</div>
          </div>

          {/* Quick Stats in Hero */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-pulse">
                  <div className="h-10 bg-white/10 rounded-lg" />
                </div>
              ))}
            </div>
          ) : quickStats && quickStats.totalQuizzes > 0 ? (
            <div 
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-all mt-4"
              onClick={() => router.push('/sabiquiz/analytics')}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Level */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="text-xl font-bold text-white">{quickStats.level}</span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Level</p>
                    <p className="font-semibold text-white text-sm">
                      {LEVEL_TITLES[Math.min(quickStats.level - 1, LEVEL_TITLES.length - 1)]}
                    </p>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total XP</p>
                    <p className="font-semibold text-white text-sm">{quickStats.totalXp.toLocaleString()}</p>
                  </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Streak</p>
                    <p className="font-semibold text-white text-sm">{quickStats.currentStreak} days</p>
                  </div>
                </div>

                {/* Quizzes */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Quizzes</p>
                    <p className="font-semibold text-white text-sm">{quickStats.totalQuizzes} completed</p>
                  </div>
                </div>
              </div>

              {/* View Dashboard Link */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10 text-gray-300 hover:text-white transition-colors">
                <span className="text-sm font-medium">View Full Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload onUploadComplete={fetchMaterials} />
        </div>

        {/* Materials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Materials</h2>
                <p className="text-sm text-gray-500">{materials.length} files uploaded</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials uploaded yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload your first study material to start generating AI-powered quizzes
              </p>
              <div className="inline-flex items-center gap-2 text-red-600 text-sm font-medium">
                <Zap className="w-4 h-4" />
                Supports PDF, TXT, and DOCX files
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
                          <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate mb-2 text-sm">
                            {material.filename}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
                              {material.category}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                              {material.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMaterial(material.id, material.file_path)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>{(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(material.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {material.status === 'ready' && (
                      <Button
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-10 text-sm font-medium rounded-xl shadow-lg shadow-red-500/20 transition-all"
                        onClick={() => router.push(`/sabiquiz/generate/${material.id}`)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Quiz
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}