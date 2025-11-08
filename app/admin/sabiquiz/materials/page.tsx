'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Trash2,
  Download,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import {
  getAllMaterials,
  deleteMaterial,
  isAdmin,
  type AdminMaterial,
} from '@/lib/admin/sabiquiz-admin'

export default function MaterialsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<AdminMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<AdminMaterial[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  useEffect(() => {
    filterMaterials()
  }, [materials, searchTerm, categoryFilter])

  async function checkAdminAndFetch() {
  try {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user found')
      router.push('/login')
      return
    }

    console.log('Current user:', user.id, user.email)

    const adminCheck = await isAdmin(user.id)
    console.log('Admin check result:', adminCheck)
    
    if (!adminCheck) {
      console.error('User is not admin')
      alert('Access denied. Admin privileges required.')
      router.push('/')
      return
    }

    console.log('Fetching materials...')
    const materialsData = await getAllMaterials()
    console.log('Materials loaded:', materialsData.length)
    setMaterials(materialsData)
  } catch (err: any) {
    console.error('Error in checkAdminAndFetch:', err)
    setError(err.message || 'Failed to load materials')
  } finally {
    setLoading(false)
  }
}

  function filterMaterials() {
    let filtered = materials

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.uploader_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter)
    }

    setFilteredMaterials(filtered)
  }

  async function handleDelete(materialId: string, filename: string) {
    if (!confirm(`Delete "${filename}"? This will also delete all associated questions and attempts.`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await deleteMaterial(materialId, user.id)
      setMaterials(materials.filter(m => m.id !== materialId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete material')
    }
  }

  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Materials Library</h1>
        <p className="text-gray-600">Manage all uploaded SabiQuiz materials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
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
                <p className="text-2xl font-bold">
                  {materials.reduce((sum, m) => sum + m.questions_count, 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">
                  {materials.reduce((sum, m) => sum + m.attempts_count, 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Uploaders</p>
                <p className="text-2xl font-bold">
                  {new Set(materials.map(m => m.uploaded_by)).size}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials or uploaders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Materials ({filteredMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No materials found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Filename</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Uploaded By</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Questions</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Attempts</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {material.filename}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{material.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{material.level}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="text-gray-900">{material.uploader_name}</p>
                          <p className="text-gray-500 text-xs">{material.uploader_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {material.questions_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {material.attempts_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(material.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id, material.filename)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}