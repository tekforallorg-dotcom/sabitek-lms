'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronUp,
  ChevronDown,
  BookOpen,
  Eye,
  Trash2,
  Edit3,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  AlertTriangle,
  PlayCircle,
  FileText,
  Youtube,
  Presentation,
  Clock,
  GraduationCap,
  Settings,
  Globe,
  EyeOff,
  Layers,
  FolderOpen,
  FolderPlus,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import FileUploader from '@/components/upload/file-uploader'
import dynamic from 'next/dynamic'

// Tiptap pulls ~18 extensions; load it only when the editor is actually
// rendered instead of shipping it in the builder's initial bundle.
const RichTextEditor = dynamic(() => import('@/components/editor/rich-text-editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[200px] rounded-xl border border-rose-100 bg-rose-50/40 animate-pulse flex items-center justify-center text-sm text-gray-400">
      Loading editor...
    </div>
  ),
})

interface Lesson {
  id: string
  title: string
  slug: string
  content?: string
  content_type: string
  youtube_url?: string
  pdf_url?: string
  powerpoint_url?: string
  lesson_order: number
  duration_minutes?: number
  module_id?: string | null
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  lesson_count: number
  created_at: string
  updated_at: string
}

interface Course {
  id: string
  title: string
  slug: string
  description: string
  status: string
  difficulty_level: string
  category: string
  cover_image_url?: string
  intro_video_url?: string
  is_free: boolean
  price: number
}

// Custom Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm'
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }>
}

function Modal({ isOpen, onClose, title, message, type = 'info', actions }: ModalProps) {
  if (!isOpen) return null

  const iconMap = {
    info: <AlertCircle className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    error: <X className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    confirm: <AlertTriangle className="w-6 h-6 text-amber-500" />,
  }

  const bgMap = {
    info: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-orange-500',
    confirm: 'from-amber-500 to-orange-500',
  }

  const getButtonClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
      case 'secondary':
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>

        <div className="p-5">
          <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
        </div>

        <div className="px-5 pb-5 flex gap-3 justify-end">
          {actions ? (
            actions.map((action, i) => (
              <Button
                key={i}
                onClick={action.onClick}
                variant={action.variant === 'secondary' ? 'outline' : 'default'}
                className={`rounded-xl ${getButtonClass(action.variant)}`}
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
              size="sm"
            >
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const categories = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Health & Fitness',
  'Music',
  'Photography',
  'Languages',
  'Other',
]

export default function CourseManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [courseLoading, setCourseLoading] = useState(true)

  // Course edit state
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    cover_image_url: '',
    intro_video_url: '',
    is_free: true,
    price: 0,
  })

  // Lesson state
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    content_type: 'text',
    youtube_url: '',
    pdf_url: '',
    powerpoint_url: '',
    duration_minutes: 0,
    module_id: '',
  })
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Module state
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' })
  const [isSavingModuleOrder, setIsSavingModuleOrder] = useState(false)

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'error' | 'warning' | 'confirm'
    actions?: ModalProps['actions']
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' | 'confirm' = 'info',
    actions?: ModalProps['actions']
  ) => {
    setModal({ isOpen: true, title, message, type, actions })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile?.role !== 'instructor') {
        router.push('/dashboard')
      } else {
        fetchCourseData()
      }
    }
  }, [user, userProfile, loading, params.slug, router])

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', params.slug)
        .eq('instructor_id', user?.id)
        .single()

      if (courseError || !courseData) {
        console.error('Course not found or unauthorized')
        router.push('/instructor')
        return
      }

      setCourse(courseData)
      setCourseForm({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        difficulty_level: courseData.difficulty_level,
        cover_image_url: courseData.cover_image_url || '',
        intro_video_url: courseData.intro_video_url || '',
        is_free: courseData.is_free,
        price: courseData.price || 0,
      })

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('lesson_order')

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData)
      }

      // Fetch modules via API (returns with lesson_count)
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        const modRes = await fetch(`/api/courses/${courseData.id}/modules`, {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        })
        if (modRes.ok) {
          const modJson = await modRes.json()
          setModules(modJson.data?.modules || modJson.modules || [])
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setCourseLoading(false)
    }
  }

  const handleUpdateCourse = async () => {
    if (!course || !courseForm.title || courseForm.description.length > 500) {
      showModal(
        'Validation Error',
        'Please fill all required fields. Description must be 500 characters or less.',
        'warning'
      )
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseForm.title,
          description: courseForm.description,
          category: courseForm.category,
          difficulty_level: courseForm.difficulty_level,
          cover_image_url: courseForm.cover_image_url || null,
          intro_video_url: courseForm.intro_video_url || null,
          is_free: courseForm.is_free,
          price: courseForm.is_free ? 0 : courseForm.price,
        })
        .eq('id', course.id)

      if (!error) {
        showModal('Success', 'Course updated successfully!', 'success')
        setIsEditingCourse(false)
        fetchCourseData()
      } else {
        showModal('Error', `Failed to update course: ${error.message}`, 'error')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      showModal('Error', 'Failed to update course', 'error')
    }
  }

  const handleDeleteCourse = async () => {
    if (!course) return

    showModal(
      'Delete Course',
      `Are you sure you want to delete "${course.title}"?\n\nThis will also delete all lessons and cannot be undone.`,
      'confirm',
      [
        { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
        {
          label: 'Delete',
          onClick: async () => {
            closeModal()
            try {
              const { error: lessonsError } = await supabase
                .from('lessons')
                .delete()
                .eq('course_id', course.id)

              if (lessonsError) {
                showModal('Error', `Failed to delete lessons: ${lessonsError.message}`, 'error')
                return
              }

              // Also delete modules
              await supabase.from('modules').delete().eq('course_id', course.id)

              const { error: courseError } = await supabase
                .from('courses')
                .delete()
                .eq('id', course.id)

              if (!courseError) {
                showModal('Success', 'Course deleted successfully!', 'success', [
                  {
                    label: 'Go to Dashboard',
                    onClick: () => router.push('/instructor'),
                    variant: 'primary',
                  },
                ])
              } else {
                showModal('Error', `Failed to delete course: ${courseError.message}`, 'error')
              }
            } catch (error) {
              console.error('Error deleting course:', error)
              showModal('Error', 'Failed to delete course', 'error')
            }
          },
          variant: 'danger',
        },
      ]
    )
  }

  // ── MODULE HANDLERS ──────────────────────────────────────────────

  const handleAddOrUpdateModule = async () => {
    if (!course || !moduleForm.title.trim()) {
      showModal('Validation Error', 'Module title is required.', 'warning')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const isEditing = !!editingModule
      const url = isEditing
        ? `/api/modules/${editingModule.id}`
        : `/api/courses/${course.id}/modules`

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save module')
      }

      showModal(
        'Success',
        isEditing ? 'Module updated successfully!' : 'Module created successfully!',
        'success'
      )
      setIsAddingModule(false)
      setEditingModule(null)
      setModuleForm({ title: '', description: '' })
      fetchCourseData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save module'
      console.error('Module save error:', error)
      showModal('Error', msg, 'error')
    }
  }

  const handleDeleteModule = (moduleId: string, moduleTitle: string, lessonCount: number) => {
    if (lessonCount > 0) {
      showModal(
        'Cannot Delete Module',
        `"${moduleTitle}" contains ${lessonCount} lesson(s).\n\nMove or delete the lessons first, then try again.`,
        'warning'
      )
      return
    }

    showModal(
      'Delete Module',
      `Are you sure you want to delete "${moduleTitle}"?\n\nThis action cannot be undone.`,
      'confirm',
      [
        { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
        {
          label: 'Delete',
          onClick: async () => {
            closeModal()
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) return

              const res = await fetch(`/api/modules/${moduleId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` },
              })

              if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to delete module')
              }

              showModal('Success', 'Module deleted successfully!', 'success')
              fetchCourseData()
            } catch (error: unknown) {
              const msg = error instanceof Error ? error.message : 'Failed to delete module'
              console.error('Module delete error:', error)
              showModal('Error', msg, 'error')
            }
          },
          variant: 'danger',
        },
      ]
    )
  }

  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const currentIndex = modules.findIndex((m) => m.id === moduleId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= modules.length) return

    const newModules = [...modules]
    const temp = newModules[currentIndex]
    newModules[currentIndex] = newModules[targetIndex]
    newModules[targetIndex] = temp

    // Optimistic update
    setModules(newModules.map((m, idx) => ({ ...m, order_index: idx + 1 })))
    setIsSavingModuleOrder(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/modules/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          course_id: course?.id,
          module_ids: newModules.map((m) => m.id),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to reorder modules')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to reorder modules'
      console.error('Module reorder error:', error)
      showModal('Error', msg, 'error')
      fetchCourseData() // rollback
    } finally {
      setIsSavingModuleOrder(false)
    }
  }

  // ── LESSON HANDLERS ──────────────────────────────────────────────

  const handleAddOrUpdateLesson = async () => {
    if (!course || !lessonForm.title) return

    try {
      // Auto-assign module: if user didn't choose, put in first module (or create "Main Content" if none exist)
      let moduleIdToUse = lessonForm.module_id || editingLesson?.module_id || null

      if (!moduleIdToUse && modules.length > 0) {
        moduleIdToUse = modules[0].id
      }

      // If still no module, create a default one
      if (!moduleIdToUse && !editingLesson) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const modRes = await fetch(`/api/courses/${course.id}/modules`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ title: 'Main Content' }),
          })
          if (modRes.ok) {
            const j = await modRes.json()
            const created = j.data || j
            moduleIdToUse = created.id
          }
        }
      }

      const lessonData = {
        course_id: course.id,
        module_id: moduleIdToUse,
        title: lessonForm.title,
        slug: generateSlug(lessonForm.title),
        content: lessonForm.content,
        content_type: lessonForm.content_type,
        youtube_url: lessonForm.youtube_url || null,
        pdf_url: lessonForm.pdf_url || null,
        powerpoint_url: lessonForm.powerpoint_url || null,
        duration_minutes: lessonForm.duration_minutes || null,
        lesson_order: editingLesson ? editingLesson.lesson_order : (lessons.length + 1) * 10,
      }

      if (editingLesson) {
        const { error } = await supabase.from('lessons').update(lessonData).eq('id', editingLesson.id)

        if (!error) {
          showModal('Success', 'Lesson updated successfully!', 'success')
          setEditingLesson(null)
        }
      } else {
        const { error } = await supabase.from('lessons').insert(lessonData)

        if (!error) {
          showModal('Success', 'Lesson added successfully!', 'success')
          setIsAddingLesson(false)
          setAddingLessonToModuleId(null)
        }
      }

      setLessonForm({
        title: '',
        content: '',
        content_type: 'text',
        youtube_url: '',
        pdf_url: '',
        powerpoint_url: '',
        duration_minutes: 0,
        module_id: '',
      })
      fetchCourseData()
    } catch (error) {
      console.error('Error saving lesson:', error)
      showModal('Error', 'Failed to save lesson', 'error')
    }
  }

  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    showModal(
      'Delete Lesson',
      `Are you sure you want to delete "${lessonTitle}"?\n\nThis action cannot be undone.`,
      'confirm',
      [
        { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
        {
          label: 'Delete',
          onClick: async () => {
            closeModal()
            try {
              const { error } = await supabase.from('lessons').delete().eq('id', lessonId)

              if (!error) {
                showModal('Success', 'Lesson deleted successfully!', 'success')
                fetchCourseData()
              }
            } catch (error) {
              console.error('Error deleting lesson:', error)
              showModal('Error', 'Failed to delete lesson', 'error')
            }
          },
          variant: 'danger',
        },
      ]
    )
  }

  const publishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase.from('courses').update({ status: 'published' }).eq('id', course.id)

      if (!error) {
        showModal('Success', 'Course published successfully! It is now visible to learners.', 'success')
        setCourse({ ...course, status: 'published' })
      }
    } catch (error) {
      console.error('Error publishing course:', error)
      showModal('Error', 'Failed to publish course', 'error')
    }
  }

  const unpublishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase.from('courses').update({ status: 'draft' }).eq('id', course.id)

      if (!error) {
        showModal('Success', 'Course unpublished. It is now hidden from learners.', 'success')
        setCourse({ ...course, status: 'draft' })
      }
    } catch (error) {
      console.error('Error unpublishing course:', error)
      showModal('Error', 'Failed to unpublish course', 'error')
    }
  }

  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex((l) => l.id === lessonId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const newLessons = [...lessons]
    const temp = newLessons[currentIndex]
    newLessons[currentIndex] = newLessons[targetIndex]
    newLessons[targetIndex] = temp

    const updatedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      lesson_order: (idx + 1) * 10,
    }))

    setLessons(updatedLessons)
    setIsSavingOrder(true)

    try {
      const updates = updatedLessons.map((lesson) =>
        supabase.from('lessons').update({ lesson_order: lesson.lesson_order }).eq('id', lesson.id)
      )

      const results = await Promise.all(updates)
      const hasError = results.some((r) => r.error)

      if (hasError) {
        console.error('Error saving lesson order')
        fetchCourseData()
        showModal('Error', 'Failed to save lesson order. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error reordering lessons:', error)
      fetchCourseData()
      showModal('Error', 'Failed to save lesson order. Please try again.', 'error')
    } finally {
      setIsSavingOrder(false)
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'powerpoint':
        return <Presentation className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'youtube':
        return 'YouTube'
      case 'pdf':
        return 'PDF'
      case 'powerpoint':
        return 'PowerPoint'
      default:
        return 'Text'
    }
  }

  const cancelLessonForm = () => {
    setIsAddingLesson(false)
    setEditingLesson(null)
    setAddingLessonToModuleId(null)
    setLessonForm({
      title: '',
      content: '',
      content_type: 'text',
      youtube_url: '',
      pdf_url: '',
      powerpoint_url: '',
      duration_minutes: 0,
      module_id: '',
    })
  }

  const cancelModuleForm = () => {
    setIsAddingModule(false)
    setEditingModule(null)
    setModuleForm({ title: '', description: '' })
  }

  // Group lessons by module for display
  const unassignedLessons = lessons.filter((l) => !l.module_id)

  if (loading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-red-100 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        actions={modal.actions}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-pink-900/20" />

        <div className="absolute top-10 right-[15%] w-20 h-20 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button onClick={() => router.push('/instructor')} className="hover:text-white transition-colors">
              Instructor Dashboard
            </button>
            <span>/</span>
            <span className="text-white">{course?.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course?.status === 'published'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {course?.status === 'published' ? '● Published' : '○ Draft'}
                </span>
                {course?.is_free ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Free
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ₦{course?.price?.toLocaleString()}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{course?.title}</h1>
              <p className="text-gray-400 text-sm max-w-2xl line-clamp-2">{course?.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {course?.difficulty_level}
                </span>
                <span className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  {course?.category}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsEditingCourse(true)}
                variant="outline"
                className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 rounded-xl"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                onClick={() => router.push(`/courses/${course?.slug}`)}
                variant="outline"
                className="border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700 rounded-xl"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Preview
              </Button>
              {course?.status === 'published' ? (
                <Button
                  onClick={unpublishCourse}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  onClick={publishCourse}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/20"
                  size="sm"
                >
                  <Globe className="w-4 h-4 mr-1.5" />
                  Publish
                </Button>
              )}
              <Button
                onClick={handleDeleteCourse}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Edit Course Card */}
        {isEditingCourse && (
          <Card className="rounded-2xl border-gray-100 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Edit Course Details</CardTitle>
                  <CardDescription className="text-xs">Update your course information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="Enter course title"
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({courseForm.description.length}/500 characters)
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="flex w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                    placeholder="Describe what students will learn..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:ring-red-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                    <select
                      value={courseForm.difficulty_level}
                      onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                  <FileUploader
                    label="Upload Cover Image"
                    accept="image/*"
                    folder="course-covers"
                    currentUrl={courseForm.cover_image_url}
                    onUpload={(url: string) => setCourseForm({ ...courseForm, cover_image_url: url })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro Video URL (Optional)</label>
                  <Input
                    value={courseForm.intro_video_url}
                    onChange={(e) => setCourseForm({ ...courseForm, intro_video_url: e.target.value })}
                    placeholder="YouTube or Vimeo link"
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free_edit"
                    checked={courseForm.is_free}
                    onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="is_free_edit" className="text-sm font-medium text-gray-700">
                    This course is free
                  </label>
                </div>

                {!courseForm.is_free && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                    <Input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setIsEditingCourse(false)} className="border-gray-200 rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCourse}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════
             COURSE MODULES CARD
             ══════════════════════════════════════════════════════════════ */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Course Modules
                    {isSavingModuleOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Organize lessons into modules for better structure
                    {!isSavingModuleOrder && modules.length > 1 && (
                      <span className="text-gray-400 ml-1">• Use arrows to reorder</span>
                    )}
                  </CardDescription>
                </div>
              </div>
              {!isAddingModule && !editingModule && (
                <Button
                  onClick={() => setIsAddingModule(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                  size="sm"
                >
                  <FolderPlus className="w-4 h-4 mr-1.5" />
                  Add Module
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Module Form */}
            {(isAddingModule || editingModule) && (
              <div className="border border-gray-200 rounded-2xl p-5 mb-6 bg-gradient-to-br from-indigo-50/50 to-white">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {editingModule ? <Edit3 className="w-4 h-4 text-white" /> : <FolderPlus className="w-4 h-4 text-white" />}
                  </div>
                  {editingModule ? 'Edit Module' : 'Add New Module'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g., Introduction, Week 1, Final Project"
                      className="rounded-xl border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      rows={2}
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="What this module covers..."
                      className="flex w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={cancelModuleForm} className="border-gray-200 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateModule}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                    >
                      {editingModule ? 'Update Module' : 'Add Module'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modules List */}
            {modules.length > 0 ? (
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveModule(module.id, 'up')}
                            disabled={index === 0 || isSavingModuleOrder}
                            className={`p-1 rounded-lg transition-colors ${
                              index === 0 || isSavingModuleOrder
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
                            }`}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveModule(module.id, 'down')}
                            disabled={index === modules.length - 1 || isSavingModuleOrder}
                            className={`p-1 rounded-lg transition-colors ${
                              index === modules.length - 1 || isSavingModuleOrder
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
                            }`}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Module Number */}
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                          <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                        </div>

                        {/* Module Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{module.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {module.lesson_count} lesson{module.lesson_count !== 1 ? 's' : ''}
                            </span>
                            {module.description && (
                              <span className="truncate">• {module.description}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingModule(module)
                            setModuleForm({
                              title: module.title,
                              description: module.description || '',
                            })
                          }}
                          className="border-gray-200 rounded-xl text-xs"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteModule(module.id, module.title, module.lesson_count)}
                          className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No modules yet. Create modules to organize lessons into logical groups.
                </p>
                <Button
                  onClick={() => setIsAddingModule(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                  size="sm"
                >
                  <FolderPlus className="w-4 h-4 mr-1.5" />
                  Add First Module
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════
             COURSE LESSONS CARD
             ══════════════════════════════════════════════════════════════ */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Course Lessons
                    {isSavingOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage your course content
                    {!isSavingOrder && lessons.length > 1 && (
                      <span className="text-gray-400 ml-1">• Use arrows to reorder</span>
                    )}
                  </CardDescription>
                </div>
              </div>
              {!isAddingLesson && !editingLesson && (
                <Button
                  onClick={() => setIsAddingLesson(true)}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Lesson
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Lesson Form */}
            {(isAddingLesson || editingLesson) && (
              <div className="border border-gray-200 rounded-2xl p-5 mb-6 bg-gradient-to-br from-gray-50 to-white">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {editingLesson ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Enter lesson title"
                      className="rounded-xl border-gray-200"
                    />
                  </div>

                  {/* Module selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module {modules.length === 0 && <span className="text-xs text-gray-500">(will auto-create)</span>}
                    </label>
                    <select
                      value={lessonForm.module_id || editingLesson?.module_id || ''}
                      onChange={(e) => setLessonForm({ ...lessonForm, module_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:ring-red-500"
                    >
                      {modules.length === 0 && <option value="">Main Content (auto-created)</option>}
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                    <select
                      value={lessonForm.content_type}
                      onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="text">📝 Text</option>
                      <option value="youtube">📺 YouTube Video</option>
                      <option value="pdf">📄 PDF Document</option>
                      <option value="powerpoint">📊 PowerPoint</option>
                    </select>
                  </div>

                  {lessonForm.content_type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <RichTextEditor
                        content={lessonForm.content}
                        onChange={(newContent) => setLessonForm({ ...lessonForm, content: newContent })}
                        placeholder="Enter lesson content. Use the toolbar to format text, add images, and embed videos..."
                      />
                    </div>
                  )}

                  {lessonForm.content_type === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                      <Input
                        value={lessonForm.youtube_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, youtube_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                  )}

                  {lessonForm.content_type === 'pdf' && (
                    <FileUploader
                      label="Upload PDF Document"
                      accept=".pdf"
                      folder="pdfs"
                      currentUrl={lessonForm.pdf_url}
                      onUpload={(url: string) => setLessonForm({ ...lessonForm, pdf_url: url })}
                    />
                  )}

                  {lessonForm.content_type === 'powerpoint' && (
                    <FileUploader
                      label="Upload PowerPoint Presentation"
                      accept=".ppt,.pptx"
                      folder="presentations"
                      currentUrl={lessonForm.powerpoint_url}
                      onUpload={(url: string) => setLessonForm({ ...lessonForm, powerpoint_url: url })}
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={lessonForm.duration_minutes}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })
                      }
                      placeholder="Estimated duration"
                      className="rounded-xl border-gray-200"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={cancelLessonForm} className="border-gray-200 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateLesson}
                      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                    >
                      {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lessons List (flat, ordered by lesson_order — same as before) */}
            {lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const parentModule = modules.find((m) => m.id === lesson.module_id)
                  return (
                    <div
                      key={lesson.id}
                      className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveLesson(lesson.id, 'up')}
                              disabled={index === 0 || isSavingOrder}
                              className={`p-1 rounded-lg transition-colors ${
                                index === 0 || isSavingOrder
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveLesson(lesson.id, 'down')}
                              disabled={index === lessons.length - 1 || isSavingOrder}
                              className={`p-1 rounded-lg transition-colors ${
                                index === lessons.length - 1 || isSavingOrder
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Lesson Number */}
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-red-50 group-hover:to-pink-50 transition-colors">
                            <span className="text-sm font-bold text-gray-600 group-hover:text-red-500 transition-colors">
                              {index + 1}
                            </span>
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{lesson.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                {getContentTypeIcon(lesson.content_type)}
                                {getContentTypeLabel(lesson.content_type)}
                              </span>
                              {parentModule && (
                                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                  <Layers className="w-3 h-3" />
                                  {parentModule.title}
                                </span>
                              )}
                              {lesson.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLesson(lesson)
                              setLessonForm({
                                title: lesson.title,
                                content: lesson.content || '',
                                content_type: lesson.content_type,
                                youtube_url: lesson.youtube_url || '',
                                pdf_url: lesson.pdf_url || '',
                                powerpoint_url: lesson.powerpoint_url || '',
                                duration_minutes: lesson.duration_minutes || 0,
                                module_id: lesson.module_id || '',
                              })
                            }}
                            className="border-gray-200 rounded-xl text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/instructor/lessons/${lesson.id}/quiz`)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs"
                          >
                            Quiz
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLesson(lesson.id, lesson.title)}
                            className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No lessons yet. Add your first lesson to get started.
                </p>
                <Button
                  onClick={() => setIsAddingLesson(true)}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Lesson
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}