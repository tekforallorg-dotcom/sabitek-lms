'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  Trash2
} from 'lucide-react'
import {
  getAllMaterials,
  deleteMaterial,
  isAdmin,
  type AdminMaterial,
} from '@/lib/admin/sabiquiz-admin'
import { toast } from '@/components/ui/toast'

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
      toast.error('Access denied. Admin privileges required.')
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
      toast.error(err.message || 'Failed to delete material')
    }
  }

  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="animate-pulse space-y-8 p-6 md:p-8">
          <div className="space-y-3">
            <div className="h-3 w-36 rounded-full bg-rose-100/80" />
            <div className="h-8 w-72 rounded-lg bg-rose-50/60" />
            <div className="h-4 w-56 rounded-lg bg-rose-50/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-rose-50/60" />
            ))}
          </div>
          <div className="bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 space-y-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-rose-50/60 rounded-lg h-10" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">SabiQuiz admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
          Materials <span className="font-serif italic text-red-600">library</span>
        </h1>
        <p className="text-gray-600">Manage all uploaded SabiQuiz materials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{materials.length}</p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {materials.reduce((sum, m) => sum + m.questions_count, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {materials.reduce((sum, m) => sum + m.attempts_count, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Uploaders</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">
                {new Set(materials.map(m => m.uploaded_by)).size}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials or uploaders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400">
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
        </div>
      </div>

      {/* Materials Table */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">All Materials ({filteredMaterials.length})</h2>
        </div>
        <div className="p-6 pt-2">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                No materials <span className="font-serif italic text-red-600">found</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rose-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Filename</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Level</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Uploaded By</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Questions</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Attempts</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
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
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-gray-900">
                        {material.questions_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-gray-900">
                        {material.attempts_count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(material.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(material.id, material.filename)}
                            aria-label={`Delete ${material.filename}`}
                            className="inline-flex h-8 w-8 items-center justify-center bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
