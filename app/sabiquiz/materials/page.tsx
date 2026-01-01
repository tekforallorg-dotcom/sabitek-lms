'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, Trash2, Calendar, HardDrive, Flame, Star, Trophy, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FileUpload from '@/components/sabiquiz/FileUpload'
import { getUserXP } from '@/lib/sabiquiz/quiz-utils'
import type { Material } from '@/lib/sabiquiz/types'

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
        alert('You must be logged in to delete materials')
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
      alert('Failed to delete material')
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Study Materials</h1>
        <p className="text-sm text-gray-600">
          Upload materials to generate AI-powered quizzes
        </p>
      </div>

      {/* Mini Dashboard Snippet */}
      {statsLoading ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl h-[88px] md:h-[76px] animate-pulse" />
      ) : quickStats && quickStats.totalQuizzes > 0 ? (
        <div 
          className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/sabiquiz/analytics')}
        >
          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">{quickStats.level}</span>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Level</p>
                  <p className="font-semibold text-sm">
                    {LEVEL_TITLES[Math.min(quickStats.level - 1, LEVEL_TITLES.length - 1)]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-purple-200">
                <span className="text-xs">Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">{quickStats.totalXp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium">{quickStats.currentStreak}d streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">{quickStats.totalQuizzes}</span>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Level */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">{quickStats.level}</span>
                </div>
                <div>
                  <p className="text-purple-200 text-xs">Level</p>
                  <p className="font-semibold text-sm">
                    {LEVEL_TITLES[Math.min(quickStats.level - 1, LEVEL_TITLES.length - 1)]}
                  </p>
                </div>
              </div>

              {/* XP */}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-purple-200 text-xs">XP</p>
                  <p className="font-semibold text-sm">{quickStats.totalXp.toLocaleString()}</p>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-purple-200 text-xs">Streak</p>
                  <p className="font-semibold text-sm">{quickStats.currentStreak} days</p>
                </div>
              </div>

              {/* Quizzes */}
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-purple-200 text-xs">Quizzes</p>
                  <p className="font-semibold text-sm">{quickStats.totalQuizzes}</p>
                </div>
              </div>
            </div>

            {/* View Dashboard Link */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-purple-200 hover:text-white transition-colors justify-end">
                <span className="text-sm font-medium">View Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-purple-300">All time stats</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <FileUpload onUploadComplete={fetchMaterials} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Materials ({materials.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">No materials uploaded yet</p>
              <p className="text-xs text-gray-500">
                Upload your first study material to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {materials.map((material) => (
              <Card
                key={material.id}
                className="hover:shadow-md transition-shadow border-gray-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <FileText className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate mb-1.5">
                          {material.filename}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium leading-tight">
                            {material.category}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium leading-tight">
                            {material.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMaterial(material.id, material.file_path)}
                      className="text-gray-400 hover:text-red-600 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-3">
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
                      className="w-full bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                      onClick={() => router.push(`/sabiquiz/generate/${material.id}`)}
                    >
                      Generate Quiz
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}