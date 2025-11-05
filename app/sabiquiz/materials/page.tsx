'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, Trash2, Calendar, HardDrive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FileUpload from '@/components/sabiquiz/FileUpload'
import type { Material } from '@/lib/sabiquiz/types'

export default function MaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaterials()
  }, [])

  async function fetchMaterials() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sabiquiz_materials')
        .select('*')
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
      await supabase.storage.from('sabiquiz-materials').remove([filePath])

      const { error } = await supabase
        .from('sabiquiz_materials')
        .delete()
        .eq('id', id)

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