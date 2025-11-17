'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, GripVertical, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { Module, CreateModuleInput, UpdateModuleInput } from '@/types/module'

interface ModuleManagerProps {
  courseId: string
  onModulesChange?: () => void
}

export default function ModuleManager({ courseId, onModulesChange }: ModuleManagerProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchModules()
  }, [courseId])

  const fetchModules = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('Module title is required')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be logged in')
        return
      }

      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          order_index: modules.length,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create module')
      }

      setFormData({ title: '', description: '' })
      setIsAdding(false)
      await fetchModules()
      onModulesChange?.()
    } catch (error: any) {
      console.error('Error creating module:', error)
      alert(error.message || 'Failed to create module')
    }
  }

  const handleUpdate = async (moduleId: string) => {
    if (!formData.title.trim()) {
      alert('Module title is required')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be logged in')
        return
      }

      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update module')
      }

      setFormData({ title: '', description: '' })
      setEditingId(null)
      await fetchModules()
      onModulesChange?.()
    } catch (error: any) {
      console.error('Error updating module:', error)
      alert(error.message || 'Failed to update module')
    }
  }

  const handleDelete = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Delete module "${moduleTitle}"? Lessons will be unlinked but not deleted.`)) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be logged in')
        return
      }

      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete module')
      }

      await fetchModules()
      onModulesChange?.()
    } catch (error: any) {
      console.error('Error deleting module:', error)
      alert(error.message || 'Failed to delete module')
    }
  }

  const startEdit = (module: Module) => {
    setEditingId(module.id)
    setFormData({
      title: module.title,
      description: module.description || '',
    })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ title: '', description: '' })
  }

  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const currentIndex = modules.findIndex(m => m.id === moduleId)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === modules.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newModules = [...modules]
    const [movedModule] = newModules.splice(currentIndex, 1)
    newModules.splice(newIndex, 0, movedModule)

    // Update order_index for all affected modules
    const moduleOrders = newModules.map((module, index) => ({
      id: module.id,
      order_index: index,
    }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ moduleOrders }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder modules')
      }

      await fetchModules()
      onModulesChange?.()
    } catch (error) {
      console.error('Error reordering modules:', error)
      alert('Failed to reorder modules')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading modules...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Course Modules</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Organize your lessons into modules (sections)
            </p>
          </div>
          {!isAdding && !editingId && (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Module Form */}
        {isAdding && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Module Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to React"
                  className="bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Description (optional)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this module covers..."
                  rows={2}
                  className="bg-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Module
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules List */}
        {modules.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-gray-500">
            <p>No modules yet. Add your first module to get started.</p>
            <p className="text-sm mt-2">
              Modules help organize lessons into logical sections.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <Card
                key={module.id}
                className={editingId === module.id ? 'border-2 border-blue-200 bg-blue-50' : ''}
              >
                <CardContent className="p-4">
                  {editingId === module.id ? (
                    // Edit Form
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Module Title *
                        </label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Description (optional)
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={2}
                          className="bg-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdate(module.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col gap-1 mt-1">
                          <button
                            onClick={() => moveModule(module.id, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <GripVertical className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">
                              {index + 1}.
                            </span>
                            <h3 className="font-semibold text-gray-900">
                              {module.title}
                            </h3>
                          </div>

                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {module.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Order: {module.order_index}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => startEdit(module)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(module.id, module.title)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
