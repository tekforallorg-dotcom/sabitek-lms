'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { 
  CheckCircle, 
  Receipt,
  Loader2,
  Search,
  Download,
  Calendar,
  RefreshCw,
  ShoppingCart,
  BookOpen,
  Users,
  Eye,
  ExternalLink,
  User,
  FileText,
  ArrowLeft,
  TrendingUp,
  Wallet
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalEarnings: number
  earningsThisMonth: number
  earningsLast30Days: number
  pendingPayouts: number
  totalSales: number
  totalStudents: number
}

interface CourseSale {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  course_id: string
  user_id?: string
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
  course?: {
    id: string
    title: string
    slug: string
    price: number
  }
}

interface CourseEarnings {
  course_id: string
  title: string
  slug: string
  total_earnings: number
  total_sales: number
  price: number
}

interface ChartData {
  date: string
  earnings: number
  sales: number
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

export default function InstructorBillingPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    earningsThisMonth: 0,
    earningsLast30Days: 0,
    pendingPayouts: 0,
    totalSales: 0,
    totalStudents: 0
  })
  const [sales, setSales] = useState<CourseSale[]>([])
  const [courseEarnings, setCourseEarnings] = useState<CourseEarnings[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [selectedSale, setSelectedSale] = useState<CourseSale | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile?.role !== 'instructor') {
        router.push('/dashboard')
      } else {
        fetchBillingData()
      }
    }
  }, [authLoading, user, userProfile])

  // EXACT SAME PATTERN AS PROFILE PAGE (which works correctly)
  const fetchBillingData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Step 1: Fetch instructor's courses (SAME AS PROFILE PAGE)
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug, price, is_free')
        .eq('instructor_id', user.id)

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
        setLoading(false)
        return
      }

      if (!courses || courses.length === 0) {
        // No courses - set empty state
        setStats({
          totalEarnings: 0,
          earningsThisMonth: 0,
          earningsLast30Days: 0,
          pendingPayouts: 0,
          totalSales: 0,
          totalStudents: 0
        })
        setSales([])
        setCourseEarnings([])
        setChartData([])
        setLoading(false)
        return
      }

      const courseIds = courses.map(c => c.id)

      // Step 2: Fetch enrollments (SAME AS PROFILE PAGE - simple select)
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('id, course_id, user_id, enrolled_at')
        .in('course_id', courseIds)

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
        setLoading(false)
        return
      }

      const allEnrollments = enrollments || []

      // Step 3: Calculate revenue (SAME LOGIC AS PROFILE PAGE)
      let totalRevenue = 0
      let revenueThisMonth = 0
      let revenueLast30Days = 0

      if (allEnrollments.length > 0) {
        allEnrollments.forEach(enrollment => {
          const course = courses.find(c => c.id === enrollment.course_id)
          if (course && !course.is_free && course.price) {
            totalRevenue += course.price
            
            const enrolledDate = new Date(enrollment.enrolled_at)
            if (enrolledDate >= monthStart) {
              revenueThisMonth += course.price
            }
            if (enrolledDate >= thirtyDaysAgo) {
              revenueLast30Days += course.price
            }
          }
        })
      }

      // Step 4: Get unique students count
      const uniqueStudentIds = [...new Set(allEnrollments.map(e => e.user_id))]
      const totalStudents = uniqueStudentIds.length

      // Step 5: Fetch user details for the sales table (separate query)
      let usersMap: Record<string, any> = {}
      if (uniqueStudentIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .in('id', uniqueStudentIds)

        if (users) {
          usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {})
        }
      }

      // Step 6: Build sales data for table (sorted by date)
      const salesData: CourseSale[] = allEnrollments
        .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
        .map(enrollment => {
          const course = courses.find(c => c.id === enrollment.course_id)
          const amount = (course && !course.is_free && course.price) ? course.price : 0

          return {
            id: enrollment.id,
            amount: amount,
            currency: 'NGN',
            status: 'successful',
            created_at: enrollment.enrolled_at,
            course_id: enrollment.course_id,
            user_id: enrollment.user_id,
            user: usersMap[enrollment.user_id] || null,
            course: course ? {
              id: course.id,
              title: course.title,
              slug: course.slug,
              price: course.price || 0
            } : undefined
          }
        })

      // Step 7: Set stats
      setStats({
        totalEarnings: totalRevenue,
        earningsThisMonth: revenueThisMonth,
        earningsLast30Days: revenueLast30Days,
        pendingPayouts: 0,
        totalSales: allEnrollments.length,
        totalStudents: totalStudents
      })

      setSales(salesData)

      // Step 8: Calculate earnings by course
      const earningsByCourse: Record<string, CourseEarnings> = {}
      allEnrollments.forEach(enrollment => {
        const course = courses.find(c => c.id === enrollment.course_id)
        if (!earningsByCourse[enrollment.course_id]) {
          earningsByCourse[enrollment.course_id] = {
            course_id: enrollment.course_id,
            title: course?.title || 'Unknown Course',
            slug: course?.slug || '',
            total_earnings: 0,
            total_sales: 0,
            price: course?.price || 0
          }
        }
        // Add revenue only for paid courses
        if (course && !course.is_free && course.price) {
          earningsByCourse[enrollment.course_id].total_earnings += course.price
        }
        earningsByCourse[enrollment.course_id].total_sales += 1
      })

      setCourseEarnings(Object.values(earningsByCourse).sort((a, b) => b.total_earnings - a.total_earnings))
      generateChartData(salesData)

    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (purchases: CourseSale[]) => {
    const days = 30
    const data: ChartData[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayPurchases = purchases.filter(p => 
        p.created_at.startsWith(dateStr)
      )

      data.push({
        date: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        earnings: dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0),
        sales: dayPurchases.length
      })
    }

    setChartData(data)
  }

  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales
    const query = searchQuery.toLowerCase()
    return sales.filter(sale => 
      sale.user?.email?.toLowerCase().includes(query) ||
      sale.user?.full_name?.toLowerCase().includes(query) ||
      sale.course?.title?.toLowerCase().includes(query)
    )
  }, [sales, searchQuery])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBillingData()
    setRefreshing(false)
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const headers = ['Date', 'Student', 'Email', 'Course', 'Amount', 'Status']
      const rows = filteredSales.map(sale => [
        new Date(sale.created_at).toISOString(),
        sale.user?.full_name || 'Unknown',
        sale.user?.email || '',
        sale.course?.title || '',
        sale.amount,
        sale.status
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-course-sales-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleViewSale = (sale: CourseSale) => {
    setSelectedSale(sale)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedSale(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500 mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-pink-500 mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-gray-300 font-medium">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[5%] w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg rotate-45 blur-sm" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link href="/instructor" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-white/10">
                <Wallet className="w-3 h-3" />
                Instructor Earnings
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Earnings</h1>
              <p className="text-gray-400 text-sm">Track your course sales and revenue performance</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards in Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">Total Earnings</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">₦</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">This Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">{formatCurrency(stats.earningsThisMonth)}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">Total Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.totalSales}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400">Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.totalStudents}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Earnings Chart */}
          <Card className="lg:col-span-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Earnings (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency((value as number) || 0), 'Earnings']} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="earnings" fill="url(#greenGradient)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm">No sales data yet</p>
                    <p className="text-xs text-gray-400 mt-1">Your earnings will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* By Course */}
          <Card className="border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                By Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courseEarnings.length > 0 ? (
                <div className="space-y-3">
                  {courseEarnings.slice(0, 5).map((course, index) => (
                    <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm text-gray-700 truncate">{course.title}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(course.total_earnings)}</p>
                        <p className="text-xs text-gray-500">{course.total_sales} sale{course.total_sales !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
                  <BookOpen className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="text-sm">No course sales yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales Table */}
        <Card className="border-gray-100 rounded-2xl shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                Recent Sales
              </CardTitle>
              <Button 
                onClick={handleExportCSV} 
                disabled={exporting || filteredSales.length === 0} 
                variant="outline" 
                size="sm"
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by student or course..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-9 rounded-xl h-11 border-gray-200 focus:border-red-500 focus:ring-red-500" 
                />
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No sales yet</p>
                <p className="text-xs text-gray-400 mt-1">When students purchase your courses, they'll appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Student</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 hidden sm:table-cell">Course</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 hidden md:table-cell">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredSales.map((sale) => (
                      <tr 
                        key={sale.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors" 
                        onClick={() => handleViewSale(sale)}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {sale.user?.avatar_url ? (
                              <img src={sale.user.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 text-sm font-semibold">{sale.user?.full_name?.charAt(0) || '?'}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">{sale.user?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[180px] sm:hidden">{sale.course?.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 hidden sm:table-cell">
                          <p className="text-sm text-gray-700 truncate max-w-[200px]">{sale.course?.title}</p>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
                            +{formatCurrency(sale.amount)}
                          </span>
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                        </td>
                        <td className="py-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredSales.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                Showing {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sale Details Sheet/Drawer */}
        <Sheet open={drawerOpen} onClose={closeDrawer} title="Sale Details">
          {selectedSale && (
            <div className="p-4 space-y-6">
              {/* Earnings Highlight */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center border border-green-100">
                <p className="text-sm text-green-700 mb-1 font-medium">You Earned</p>
                <p className="text-4xl font-bold text-green-600">{formatCurrency(selectedSale.amount)}</p>
              </div>

              {/* Student Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  Student
                </h3>
                <div className="flex items-center gap-4">
                  {selectedSale.user?.avatar_url ? (
                    <img src={selectedSale.user.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-xl font-semibold">{selectedSale.user?.full_name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedSale.user?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-gray-500">{selectedSale.user?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-3 h-3 text-white" />
                  </div>
                  Course
                </h3>
                <p className="font-semibold text-gray-900 mb-3">{selectedSale.course?.title}</p>
                <Link 
                  href={`/courses/${selectedSale.course?.slug}`} 
                  className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium" 
                  onClick={(e) => e.stopPropagation()}
                >
                  View Course <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Transaction Details */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  Transaction Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedSale.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      {selectedSale.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Currency</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedSale.currency}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm font-semibold text-gray-900">{formatDate(selectedSale.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl h-12 border-gray-200 hover:bg-gray-50" 
                  onClick={closeDrawer}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Sheet>
      </div>
    </div>
  )
}