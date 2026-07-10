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
  Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/toast'
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
    error: 'from-red-500 to-rose-600',
    warning: 'from-amber-500 to-orange-500',
    confirm: 'from-amber-500 to-orange-500',
  }

  const getButtonClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50'
      case 'danger':
        return 'bg-gradient-to-b from-red-600 to-rose-700 hover:to-rose-600 text-white font-semibold ring-1 ring-red-700/50'
      case 'secondary':
      default:
        return 'bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white shadow-sm'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
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
                className={`rounded-full ${getButtonClass(action.variant)}`}
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button
              onClick={onClose}
              className="bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50"
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
      toast.error('Please fill all required fields. Description must be 500 characters or less.')
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
        toast.success('Course updated successfully!')
        setIsEditingCourse(false)
        fetchCourseData()
      } else {
        toast.error(`Failed to update course: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Failed to update course')
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
      toast.error('Module title is required.')
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

      toast.success(isEditing ? 'Module updated successfully!' : 'Module created successfully!')
      setIsAddingModule(false)
      setEditingModule(null)
      setModuleForm({ title: '', description: '' })
      fetchCourseData()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save module'
      console.error('Module save error:', error)
      toast.error(msg)
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
          toast.success('Lesson updated successfully!')
          setEditingLesson(null)
        }
      } else {
        const { error } = await supabase.from('lessons').insert(lessonData)

        if (!error) {
          toast.success('Lesson added successfully!')
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
      toast.error('Failed to save lesson')
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
        toast.success('Course published successfully! It is now visible to learners.')
        setCourse({ ...course, status: 'published' })
      }
    } catch (error) {
      console.error('Error publishing course:', error)
      toast.error('Failed to publish course')
    }
  }

  const unpublishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase.from('courses').update({ status: 'draft' }).eq('id', course.id)

      if (!error) {
        toast.success('Course unpublished. It is now hidden from learners.')
        setCourse({ ...course, status: 'draft' })
      }
    } catch (error) {
      console.error('Error unpublishing course:', error)
      toast.error('Failed to unpublish course')
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
        toast.error('Failed to save lesson order. Please try again.')
      }
    } catch (error) {
      console.error('Error reordering lessons:', error)
      fetchCourseData()
      toast.error('Failed to save lesson order. Please try again.')
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

  // Publish stepper state
  const curriculumComplete = modules.length > 0 && lessons.length > 0
  const isPublished = course?.status === 'published'
  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  if (loading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
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
    <div className="min-h-screen bg-[#fffcfb]">
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
        <div className="absolute -top-24 right-[10%] w-72 h-72 bg-rose-100/60 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 left-[5%] w-80 h-80 bg-red-100/50 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button onClick={() => router.push('/instructor')} className="hover:text-red-600 transition-colors">
              Instructor Dashboard
            </button>
            <span>/</span>
            <span className="text-gray-900">{course?.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
                Course builder
              </p>
              <div className="flex items-center gap-3 mb-3">
                {course?.status === 'published' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Draft
                  </span>
                )}
                {course?.is_free ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    Free
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    ₦{course?.price?.toLocaleString()}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                {(() => {
                  const words = (course?.title || '').trim().split(' ')
                  const last = words.pop()
                  return (
                    <>
                      {words.join(' ')}
                      {words.length > 0 ? ' ' : ''}
                      <span className="font-serif italic text-red-600">{last}</span>
                    </>
                  )
                })()}
              </h1>
              <p className="text-gray-500 text-sm max-w-2xl line-clamp-2">{course?.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-500" />
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-red-500" />
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-red-500" />
                  {course?.difficulty_level}
                </span>
                <span className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-red-500" />
                  {course?.category}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsEditingCourse(true)}
                variant="outline"
                className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                onClick={() => router.push(`/courses/${course?.slug}`)}
                variant="outline"
                className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Preview
              </Button>
              {course?.status === 'published' ? (
                <Button
                  onClick={unpublishCourse}
                  variant="outline"
                  className="bg-white/70 backdrop-blur border border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-full shadow-sm"
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  onClick={publishCourse}
                  className="relative overflow-hidden bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(16,185,129,0.55)] ring-1 ring-green-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <Globe className="w-4 h-4 mr-1.5" />
                  Publish
                </Button>
              )}
              <Button
                onClick={handleDeleteCourse}
                variant="outline"
                className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Publish Stepper */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] px-5 py-4">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
            {/* Step 1: Details */}
            <button
              type="button"
              onClick={() => scrollToSection('builder-details')}
              className="flex items-center gap-3 text-left group"
            >
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  Details
                </span>
                <span className="block text-xs text-gray-500">Course info saved</span>
              </span>
            </button>

            <span className="hidden sm:block h-px flex-1 bg-rose-100" aria-hidden="true" />

            {/* Step 2: Curriculum */}
            <button
              type="button"
              onClick={() => scrollToSection('builder-curriculum')}
              className="flex items-center gap-3 text-left group"
            >
              {curriculumComplete ? (
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                  2
                </span>
              )}
              <span>
                <span className="block text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  Curriculum
                </span>
                <span className="block text-xs text-gray-500">
                  {modules.length} modules · {lessons.length} lessons
                </span>
              </span>
            </button>

            <span className="hidden sm:block h-px flex-1 bg-rose-100" aria-hidden="true" />

            {/* Step 3: Publish */}
            <div className="flex items-center gap-3">
              {isPublished ? (
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </span>
              ) : curriculumComplete ? (
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                  3
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-400">
                  3
                </span>
              )}
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  Publish
                  {isPublished && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" aria-hidden="true" />
                      Live
                    </span>
                  )}
                </span>
                <span className="block text-xs text-gray-500">
                  {isPublished ? 'Visible to learners' : 'Make your course visible'}
                </span>
              </span>
              {!isPublished && (
                <Button
                  onClick={publishCourse}
                  size="sm"
                  className="ml-1 relative overflow-hidden bg-gradient-to-b from-emerald-400 to-green-500 hover:to-green-400 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(16,185,129,0.55)] ring-1 ring-green-600/50 transition-all hover:-translate-y-0.5"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <Globe className="w-4 h-4 mr-1.5" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Course Card */}
        {isEditingCourse && (
          <Card
            id="builder-details"
            className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]"
          >
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">Edit Course Details</CardTitle>
                  <CardDescription className="text-xs">Update your course information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="Enter course title"
                    className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
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
                    className="flex w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    placeholder="Describe what students will learn..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Difficulty Level</label>
                    <select
                      value={courseForm.difficulty_level}
                      onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Cover Image</label>
                  <FileUploader
                    label="Upload Cover Image"
                    accept="image/*"
                    folder="course-covers"
                    currentUrl={courseForm.cover_image_url}
                    onUpload={(url: string) => setCourseForm({ ...courseForm, cover_image_url: url })}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Intro Video URL (Optional)</label>
                  <Input
                    value={courseForm.intro_video_url}
                    onChange={(e) => setCourseForm({ ...courseForm, intro_video_url: e.target.value })}
                    placeholder="YouTube or Vimeo link"
                    className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free_edit"
                    checked={courseForm.is_free}
                    onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })}
                    className="h-4 w-4 rounded border-rose-200 text-red-500 focus:ring-red-400"
                  />
                  <label htmlFor="is_free_edit" className="text-sm font-medium text-gray-700">
                    This course is free
                  </label>
                </div>

                {!courseForm.is_free && (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Price (₦)</label>
                    <Input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-rose-100">
                  <Button variant="outline" onClick={() => setIsEditingCourse(false)} className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCourse}
                    className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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
        <Card
          id="builder-curriculum"
          className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]"
        >
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    Course Modules
                    {isSavingModuleOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
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
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <FolderPlus className="w-4 h-4 mr-1.5" />
                  Add Module
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Module Form */}
            {(isAddingModule || editingModule) && (
              <div className="border border-rose-100 rounded-2xl p-5 mb-6 bg-rose-50/40">
                <h3 className="font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                    {editingModule ? <Edit3 className="w-4 h-4 text-white" /> : <FolderPlus className="w-4 h-4 text-white" />}
                  </div>
                  {editingModule ? 'Edit Module' : 'Add New Module'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g., Introduction, Week 1, Final Project"
                      className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      rows={2}
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="What this module covers..."
                      className="flex w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-rose-100">
                    <Button variant="outline" onClick={cancelModuleForm} className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateModule}
                      className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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
                    className="border border-rose-100 rounded-xl p-4 bg-white/70 hover:bg-rose-50/40 transition-all group"
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
                                : 'text-gray-400 hover:text-red-500 hover:bg-rose-50'
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
                                : 'text-gray-400 hover:text-red-500 hover:bg-rose-50'
                            }`}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Module Number */}
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-red-500">{index + 1}</span>
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
                          className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm text-xs"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteModule(module.id, module.title, module.lesson_count)}
                          className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full text-xs"
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
                <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No modules yet. Create modules to organize lessons into logical groups.
                </p>
                <Button
                  onClick={() => setIsAddingModule(true)}
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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
        <Card className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    Course Lessons
                    {isSavingOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">
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
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Lesson
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Lesson Form */}
            {(isAddingLesson || editingLesson) && (
              <div className="border border-rose-100 rounded-2xl p-5 mb-6 bg-rose-50/40">
                <h3 className="font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                    {editingLesson ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Lesson Title</label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Enter lesson title"
                      className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  {/* Module selector */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">
                      Module {modules.length === 0 && <span className="text-xs text-gray-500">(will auto-create)</span>}
                    </label>
                    <select
                      value={lessonForm.module_id || editingLesson?.module_id || ''}
                      onChange={(e) => setLessonForm({ ...lessonForm, module_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400"
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
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Content Type</label>
                    <select
                      value={lessonForm.content_type}
                      onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400"
                    >
                      <option value="text">Text</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="pdf">PDF Document</option>
                      <option value="powerpoint">PowerPoint</option>
                    </select>
                  </div>

                  {lessonForm.content_type === 'text' && (
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">Content</label>
                      <RichTextEditor
                        content={lessonForm.content}
                        onChange={(newContent) => setLessonForm({ ...lessonForm, content: newContent })}
                        placeholder="Enter lesson content. Use the toolbar to format text, add images, and embed videos..."
                      />
                    </div>
                  )}

                  {lessonForm.content_type === 'youtube' && (
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">YouTube URL</label>
                      <Input
                        value={lessonForm.youtube_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, youtube_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
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
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={lessonForm.duration_minutes}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })
                      }
                      placeholder="Estimated duration"
                      className="rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-rose-100">
                    <Button variant="outline" onClick={cancelLessonForm} className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateLesson}
                      className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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
                          <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                            <span className="text-sm font-semibold text-red-500">
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
                            className="bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white rounded-full text-xs shadow-sm"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/instructor/lessons/${lesson.id}/quiz`)}
                            className="bg-rose-50/60 border-rose-100 text-red-600 hover:bg-rose-50 hover:border-rose-200 rounded-full text-xs"
                          >
                            Quiz
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLesson(lesson.id, lesson.title)}
                            className="bg-red-50 border-red-100 text-red-600 hover:bg-red-100 rounded-full text-xs"
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
                <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No lessons yet. Add your first lesson to get started.
                </p>
                <Button
                  onClick={() => setIsAddingLesson(true)}
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
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