
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
  DollarSign,
  ShoppingCart,
  BookOpen,
  Users,
  Eye,
  ExternalLink,
  User,
  FileText,
  ArrowLeft
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

  const fetchBillingData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const { data: instructorCourses } = await supabase
        .from('courses')
        .select('id, title, slug, price')
        .eq('instructor_id', user.id)

      if (!instructorCourses || instructorCourses.length === 0) {
        setLoading(false)
        return
      }

      const courseIds = instructorCourses.map(c => c.id)

      const { data: purchases } = await supabase
        .from('course_purchases')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url),
          course:courses(id, title, slug, price)
        `)
        .in('course_id', courseIds)
        .eq('status', 'successful')
        .order('created_at', { ascending: false })

      const allPurchases = purchases || []

      const totalEarnings = allPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const earningsThisMonth = allPurchases
        .filter(p => new Date(p.created_at) >= monthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      const earningsLast30Days = allPurchases
        .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      const uniqueStudents = new Set(allPurchases.map(p => p.user_id)).size

      setStats({
        totalEarnings,
        earningsThisMonth,
        earningsLast30Days,
        pendingPayouts: 0,
        totalSales: allPurchases.length,
        totalStudents: uniqueStudents
      })

      setSales(allPurchases)

      const earningsByCourse: Record<string, CourseEarnings> = {}
      allPurchases.forEach(p => {
        if (!earningsByCourse[p.course_id]) {
          const course = instructorCourses.find(c => c.id === p.course_id)
          earningsByCourse[p.course_id] = {
            course_id: p.course_id,
            title: course?.title || 'Unknown Course',
            slug: course?.slug || '',
            total_earnings: 0,
            total_sales: 0,
            price: course?.price || 0
          }
        }
        earningsByCourse[p.course_id].total_earnings += p.amount || 0
        earningsByCourse[p.course_id].total_sales += 1
      })

      setCourseEarnings(Object.values(earningsByCourse).sort((a, b) => b.total_earnings - a.total_earnings))
      generateChartData(allPurchases)

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/instructor" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
            <p className="text-sm text-gray-500 mt-1">Track your course sales and earnings</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Earnings</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">This Month</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats.earningsThisMonth)}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Sales</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalSales}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Students</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Earnings (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => [formatCurrency((value as number) || 0), 'Earnings']} />
                      <Bar dataKey="earnings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">No sales data yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Course</CardTitle>
            </CardHeader>
            <CardContent>
              {courseEarnings.length > 0 ? (
                <div className="space-y-3">
                  {courseEarnings.slice(0, 5).map((course, index) => (
                    <div key={course.course_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
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
                <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">No course sales yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-gray-500" />
                Recent Sales
              </CardTitle>
              <Button onClick={handleExportCSV} disabled={exporting || filteredSales.length === 0} variant="outline" size="sm">
                <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by student or course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No sales yet</p>
                <p className="text-xs text-gray-400 mt-1">When students purchase your courses, they'll appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Student</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 hidden sm:table-cell">Course</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 hidden md:table-cell">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewSale(sale)}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {sale.user?.avatar_url ? (
                              <img src={sale.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-600 text-sm font-medium">{sale.user?.full_name?.charAt(0) || '?'}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">{sale.user?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[180px] sm:hidden">{sale.course?.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <p className="text-sm text-gray-900 truncate max-w-[200px]">{sale.course?.title}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.amount)}</p>
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                        </td>
                        <td className="py-3">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredSales.length > 0 && (
              <div className="mt-4 text-xs text-gray-500">
                Showing {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>

        <Sheet open={drawerOpen} onClose={closeDrawer} title="Sale Details">
          {selectedSale && (
            <div className="p-4 space-y-6">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700 mb-1">You Earned</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedSale.amount)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Student
                </h3>
                <div className="flex items-center gap-3">
                  {selectedSale.user?.avatar_url ? (
                    <img src={selectedSale.user.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 text-lg font-semibold">{selectedSale.user?.full_name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedSale.user?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-gray-500">{selectedSale.user?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  Course
                </h3>
                <p className="font-medium text-gray-900 mb-2">{selectedSale.course?.title}</p>
                <Link href={`/courses/${selectedSale.course?.slug}`} className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700" onClick={(e) => e.stopPropagation()}>
                  View Course <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedSale.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      {selectedSale.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Currency</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSale.currency}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(selectedSale.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full" onClick={closeDrawer}>Close</Button>
              </div>
            </div>
          )}
        </Sheet>
      </div>
    </div>
  )
}
