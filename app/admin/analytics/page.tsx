'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  Activity,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface AnalyticsData {
  dateRange: {
    start: string
    end: string
    days: number
  }
  userGrowth: Array<{ date: string; count: number; newUsers: number }>
  enrollmentTrend: Array<{ date: string; count: number }>
  certificateTrend: Array<{ date: string; count: number }>
  popularCourses: Array<{
    id: string
    title: string
    thumbnail: string
    enrollments: number
  }>
  metrics: {
    totalUsers: number
    activeUsers: {
      dau: number
      wau: number
    }
    completionRate: number
    averageGrade: number
    totalEnrollments: number
    totalCertificates: number
  }
}

export default function AnalyticsPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchAnalytics()
    }
  }, [authLoading, userProfile, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired')
        return
      }

      const response = await fetch(`/api/admin/analytics?days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && !analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{analytics.metrics.totalUsers}</p>
              <p className="text-xs text-blue-600 mt-2">
                {analytics.userGrowth[analytics.userGrowth.length - 1]?.newUsers || 0} new this period
              </p>
            </div>

            {/* Active Users */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg border border-green-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">DAU</p>
                  <p className="text-sm font-semibold text-green-700">{analytics.metrics.activeUsers.dau}</p>
                </div>
              </div>
              <p className="text-sm text-green-700 font-medium">Weekly Active</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{analytics.metrics.activeUsers.wau}</p>
              <p className="text-xs text-green-600 mt-2">Active in last 7 days</p>
            </div>

            {/* Certificates Issued */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600">Avg Grade</p>
                  <p className="text-sm font-semibold text-purple-700">{analytics.metrics.averageGrade}%</p>
                </div>
              </div>
              <p className="text-sm text-purple-700 font-medium">Certificates</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{analytics.metrics.totalCertificates}</p>
              <p className="text-xs text-purple-600 mt-2">
                {analytics.certificateTrend.reduce((sum, d) => sum + d.count, 0)} issued this period
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-orange-700 font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{analytics.metrics.completionRate}%</p>
              <p className="text-xs text-orange-600 mt-2">
                {analytics.metrics.totalEnrollments} total enrollments
              </p>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
                <p className="text-sm text-gray-600 mt-1">Total users over time</p>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Total Users"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="New Users"
                  dot={{ fill: '#10b981', r: 3 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Certificate Trend Chart */}
          {analytics.certificateTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Certificate Issuance</h2>
                  <p className="text-sm text-gray-600 mt-1">Certificates issued over time</p>
                </div>
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.certificateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#a855f7" 
                    radius={[8, 8, 0, 0]}
                    name="Certificates Issued"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Popular Courses */}
          {analytics.popularCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Popular Courses</h2>
                  <p className="text-sm text-gray-600 mt-1">Top courses by enrollments</p>
                </div>
                <BookOpen className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {analytics.popularCourses.map((course, index) => (
                  <div 
                    key={course.id} 
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-sm text-gray-600">{course.enrollments} enrollments</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {course.enrollments}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Enrollments */}
          {analytics.metrics.totalEnrollments === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-900 mb-2">No Enrollments Yet</h3>
              <p className="text-blue-700 text-sm">
                Enrollment tracking will appear here once users start enrolling in courses.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}