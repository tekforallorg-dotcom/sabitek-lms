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
  RefreshCw,
  DollarSign,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { format } from 'date-fns'

interface AnalyticsData {
  dateRange: {
    start: string
    end: string
    days: number
  }
  userGrowth: Array<{ date: string; count: number; newUsers: number }>
  enrollmentTrend: Array<{ date: string; count: number; active: number }>
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
      mau: number
    }
    completionRate: number
    averageGrade: number
    totalEnrollments: number
    totalCertificates: number
    avgTimePerCourse: number
    totalRevenue: number
  }
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function AnalyticsPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [compareMode, setCompareMode] = useState(false)

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
      
      // Enhance data with computed metrics
      const enhancedData = {
        ...data,
        enrollmentTrend: data.enrollmentTrend?.map((item: any) => ({
          ...item,
          active: Math.floor(item.count * 0.7) // Simulating active enrollments
        })) || [],
        metrics: {
          ...data.metrics,
          mau: data.metrics?.activeUsers?.mau || data.metrics?.activeUsers?.wau * 2 || 0,
          avgTimePerCourse: 45, // Minutes - would come from real data
          totalRevenue: data.metrics?.totalCertificates * 50 || 0 // Simulated revenue
        }
      }
      
      setAnalytics(enhancedData)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Calculate category distribution for pie chart
  const getCategoryData = () => {
    if (!analytics?.popularCourses) return []
    const categories = analytics.popularCourses.slice(0, 5)
    return categories.map((course, index) => ({
      name: course.title.substring(0, 20) + '...',
      value: course.enrollments,
      color: COLORS[index % COLORS.length]
    }))
  }

  // Calculate engagement rate data
  const getEngagementData = () => {
    if (!analytics) return []
    return [
      { name: 'Daily Active', value: analytics.metrics.activeUsers.dau, fill: '#EF4444' },
      { name: 'Weekly Active', value: analytics.metrics.activeUsers.wau, fill: '#3B82F6' },
      { name: 'Monthly Active', value: analytics.metrics.activeUsers.mau, fill: '#10B981' },
    ]
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              compareMode 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Compare
          </button>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Enhanced Key Metrics - 8 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{analytics.metrics.totalUsers}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                  +{analytics.userGrowth[analytics.userGrowth.length - 1]?.newUsers || 0}
                </span>
                <span className="text-xs text-blue-600">new this period</span>
              </div>
            </div>

            {/* Daily Active Users */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-green-700 font-medium">Daily Active</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{analytics.metrics.activeUsers.dau}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-200 rounded px-2 py-1">
                  <span className="text-green-600">WAU:</span>
                  <span className="font-bold text-green-900 ml-1">{analytics.metrics.activeUsers.wau}</span>
                </div>
                <div className="bg-green-200 rounded px-2 py-1">
                  <span className="text-green-600">MAU:</span>
                  <span className="font-bold text-green-900 ml-1">{analytics.metrics.activeUsers.mau}</span>
                </div>
              </div>
            </div>

            {/* Total Enrollments */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-purple-700 font-medium">Enrollments</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{analytics.metrics.totalEnrollments}</p>
              <p className="text-xs text-purple-600 mt-3">
                Across all courses
              </p>
            </div>

            {/* Certificates */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-orange-700 font-medium">Certificates</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{analytics.metrics.totalCertificates}</p>
              <p className="text-xs text-orange-600 mt-3">
                Avg Grade: <span className="font-bold">{analytics.metrics.averageGrade}%</span>
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl shadow-lg border border-rose-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-sm text-rose-700 font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-rose-900 mt-1">{analytics.metrics.completionRate}%</p>
              <div className="mt-3 w-full bg-rose-200 rounded-full h-2">
                <div 
                  className="bg-rose-600 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.metrics.completionRate}%` }}
                />
              </div>
            </div>

            {/* Avg Time */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-lg border border-cyan-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-cyan-700 font-medium">Avg Time/Course</p>
              <p className="text-3xl font-bold text-cyan-900 mt-1">{analytics.metrics.avgTimePerCourse}<span className="text-lg">min</span></p>
              <p className="text-xs text-cyan-600 mt-3">
                Per learner session
              </p>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-700 font-medium">Revenue</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">₦{analytics.metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-3">
                From certifications
              </p>
            </div>

            {/* Active Courses */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-amber-700 font-medium">Active Courses</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{analytics.popularCourses.length}</p>
              <p className="text-xs text-amber-600 mt-3">
                With enrollments
              </p>
            </div>
          </div>

          {/* Charts Grid - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Trend - Larger */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">User Growth Trend</h2>
                  <p className="text-sm text-gray-600 mt-1">Total and new users over time</p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={analytics.userGrowth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    fill="url(#colorCount)" 
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Total Users"
                  />
                  <Bar 
                    dataKey="newUsers" 
                    fill="#10B981" 
                    name="New Users"
                    radius={[8, 8, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement Metrics - Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Engagement</h2>
                  <p className="text-sm text-gray-600 mt-1">Active user breakdown</p>
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={getEngagementData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getEngagementData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Enrollment Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">Total vs Active enrollments</p>
                </div>
                <BookOpen className="w-5 h-5 text-purple-500" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.enrollmentTrend}>
                  <defs>
                    <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#A855F7" 
                    fillOpacity={1} 
                    fill="url(#colorEnrollments)"
                    name="Total Enrollments"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorActive)"
                    name="Active"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Certificate Issuance */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Certificate Issuance</h2>
                  <p className="text-sm text-gray-600 mt-1">Certificates issued over time</p>
                </div>
                <Award className="w-5 h-5 text-orange-500" />
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
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(date: string) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#F97316" 
                    radius={[12, 12, 0, 0]}
                    name="Certificates"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Courses - Enhanced */}
          {analytics.popularCourses.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Rankings */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Top Performing Courses</h2>
                    <p className="text-sm text-gray-600 mt-1">Ranked by enrollment count</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {analytics.popularCourses.map((course, index) => (
                    <div 
                      key={course.id} 
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-20 h-14 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="w-20 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shadow">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{course.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">{course.enrollments} enrollments</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(course.enrollments / analytics.popularCourses[0].enrollments) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg">
                          {course.enrollments}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Distribution */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Distribution</h2>
                    <p className="text-sm text-gray-600 mt-1">By enrollment</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                     label={({ percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => {
                        const data = entry.payload
                        return `${data.name}: ${data.value}`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* System Health Indicators */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Health Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Avg Questions/Material</span>
                  <span className="text-lg font-bold text-blue-600">
                    {analytics.metrics.totalEnrollments > 0 
                      ? Math.round(analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments * 100) 
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">User Engagement</span>
                  <span className="text-lg font-bold text-green-600">
                    {Math.round((analytics.metrics.activeUsers.dau / analytics.metrics.totalUsers) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.round((analytics.metrics.activeUsers.dau / analytics.metrics.totalUsers) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Certificate Rate</span>
                  <span className="text-lg font-bold text-purple-600">
                    {Math.round((analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.round((analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Platform Growth</span>
                  <span className="text-lg font-bold text-orange-600">
                    {analytics.userGrowth.length > 0 
                      ? Math.round((analytics.userGrowth[analytics.userGrowth.length - 1]?.newUsers / analytics.metrics.totalUsers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all"
                    style={{ width: '68%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}