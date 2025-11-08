'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  MessageSquare,
  Target,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getSystemStats,
  getUsageChartData,
  isAdmin,
  type SystemStats,
} from '@/lib/admin/sabiquiz-admin'

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function AnalyticsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [usageData, setUsageData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const adminCheck = await isAdmin(user.id)
      if (!adminCheck) {
        router.push('/')
        return
      }

      // Fetch stats
      const statsData = await getSystemStats()
      setStats(statsData)

      // Fetch usage chart data
      const usageChartData = await getUsageChartData()
      setUsageData(usageChartData)

      // Fetch category distribution
      const { data: materials } = await supabase
        .from('sabiquiz_materials')
        .select('category')

      const categoryCounts = new Map<string, number>()
      materials?.forEach(m => {
        const cat = m.category || 'Uncategorized'
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      })

      const categoryChartData = Array.from(categoryCounts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      setCategoryData(categoryChartData)

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-800">{error || 'Failed to load data'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SabiQuiz Analytics</h1>
        <p className="text-gray-600">System-wide performance and usage metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold">{stats.totalMaterials}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.materialsThisMonth} this month
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.questionsThisMonth} this month
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{stats.attemptsThisMonth} this month
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-xs text-gray-500 mt-1">Across all quizzes</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="materials"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Materials Uploaded"
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Quiz Attempts"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Materials by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Materials', value: stats.materialsThisMonth },
                  { name: 'Questions', value: stats.questionsThisMonth },
                  { name: 'Attempts', value: stats.attemptsThisMonth },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Questions per Material</span>
                  <span className="text-sm font-bold">
                    {stats.totalMaterials > 0
                      ? Math.round(stats.totalQuestions / stats.totalMaterials)
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalQuestions / stats.totalMaterials) / 50) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Attempts per Material</span>
                  <span className="text-sm font-bold">
                    {stats.totalMaterials > 0
                      ? Math.round(stats.totalAttempts / stats.totalMaterials)
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalAttempts / stats.totalMaterials) / 10) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="text-sm font-bold">{stats.averageScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${stats.averageScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Platform Adoption</span>
                  <span className="text-sm font-bold">
                    {stats.totalUsers > 0
                      ? Math.round((stats.totalAttempts / stats.totalUsers) * 100) / 100
                      : 0}{' '}
                    attempts/user
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalAttempts / stats.totalUsers) / 5) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}