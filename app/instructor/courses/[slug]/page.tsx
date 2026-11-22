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
  BarChart3,
  ListChecks,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import {
  MODULE_QUIZ_TYPE,
  findModuleQuiz,
  isModuleQuiz,
  moduleQuizTitle,
  orderAfterAll,
  quizOrderAfterNewLesson,
  uniqueSlug,
} from '@/lib/lessons/module-quiz'
import FileUploader from '@/components/upload/file-uploader'
import dynamic from 'next/dynamic'
import SabiLoader from '@/components/ui/SabiLoader'

// Tiptap pulls ~18 extensions; load it only when the editor is actually
// rendered instead of shipping it in the builder's initial bundle.
const RichTextEditor = dynamic(() => import('@/components/editor/rich-text-editor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[200px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse flex items-center justify-center text-sm text-gray-400">
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
  institution_id?: string | null
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
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    confirm: 'bg-amber-600',
  }

  const getButtonClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-red-600 hover:bg-red-700 text-white font-medium ring-1 ring-red-600/50'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-medium ring-1 ring-red-700/50'
      case 'secondary':
      default:
        return 'bg-white border border-gray-200 hover:border-gray-200 hover:bg-white shadow-sm'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-medium tracking-tight text-white">{title}</h3>
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
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50"
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
  const [creatingQuizForModuleId, setCreatingQuizForModuleId] = useState<string | null>(null)
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
        // Keep the address a lesson already has unless its title changed, and
        // never reuse another lesson's address in this course: the lesson page
        // finds lessons by address and would open the wrong one.
        slug:
          editingLesson && editingLesson.title === lessonForm.title
            ? editingLesson.slug
            : uniqueSlug(
                generateSlug(lessonForm.title),
                lessons.filter((l) => l.id !== editingLesson?.id).map((l) => l.slug)
              ),
        content: lessonForm.content,
        content_type: lessonForm.content_type,
        youtube_url: lessonForm.youtube_url || null,
        pdf_url: lessonForm.pdf_url || null,
        powerpoint_url: lessonForm.powerpoint_url || null,
        duration_minutes: lessonForm.duration_minutes || null,
        // Highest order in the course plus 10. Counting lessons instead gave a
        // new lesson the same order as an existing one after a deletion, and
        // two lessons with one order can lock a learner out.
        lesson_order: editingLesson ? editingLesson.lesson_order : orderAfterAll(lessons),
      }

      if (editingLesson) {
        const { error } = await supabase.from('lessons').update(lessonData).eq('id', editingLesson.id)
        if (error) throw error

        // A lesson moved into a module that ends in a quiz goes in front of the quiz.
        if (!error && !isModuleQuiz(editingLesson)) {
          const moved = quizOrderAfterNewLesson(
            lessons.filter((l) => l.id !== editingLesson.id),
            moduleIdToUse,
            lessonData.lesson_order
          )
          if (moved) {
            await supabase.from('lessons').update({ lesson_order: moved.lesson_order }).eq('id', moved.id)
          }
        }

        // Edited content invalidates AI caches built from the old version
        if (!error) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return
            fetch('/api/ai/invalidate-lesson', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ lessonId: editingLesson.id }),
            }).catch(() => {})
          })
        }

        if (!error) {
          toast.success('Lesson updated successfully!')
          setEditingLesson(null)
        }
      } else {
        const { error } = await supabase.from('lessons').insert(lessonData)
        if (error) throw error

        if (!error) {
          // The module's quiz stays last: move it behind the lesson just added.
          const moved = quizOrderAfterNewLesson(lessons, moduleIdToUse, lessonData.lesson_order)
          if (moved) {
            await supabase.from('lessons').update({ lesson_order: moved.lesson_order }).eq('id', moved.id)
          }
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
      toast.error('The lesson was not saved. Check your connection and try again.')
    }
  }

  // A module quiz is a quiz-only lesson at the end of the module. It reuses
  // the quiz editor, grading and unlock rules that lesson quizzes already have.
  const openModuleQuiz = async (module: Module) => {
    if (!course) return

    const existing = findModuleQuiz(lessons, module.id)
    if (existing) {
      router.push(`/instructor/lessons/${existing.id}/quiz`)
      return
    }

    setCreatingQuizForModuleId(module.id)
    try {
      const title = moduleQuizTitle(module.title)
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          course_id: course.id,
          module_id: module.id,
          title,
          slug: uniqueSlug(
            generateSlug(title),
            lessons.map((l) => l.slug)
          ),
          content: '',
          content_type: MODULE_QUIZ_TYPE,
          lesson_order: orderAfterAll(lessons),
        })
        .select('id')
        .single()

      if (error || !data) {
        console.error('Error creating module quiz:', error)
        toast.error('Could not add the quiz. Please try again.')
        return
      }

      router.push(`/instructor/lessons/${data.id}/quiz`)
    } catch (error) {
      console.error('Error creating module quiz:', error)
      toast.error('Could not add the quiz. Please try again.')
    } finally {
      setCreatingQuizForModuleId(null)
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
              const { data: deleted, error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId)
                .select('id')

              if (error || !deleted || deleted.length === 0) {
                throw error ?? new Error('The lesson was not deleted')
              }
              showModal('Success', 'Lesson deleted successfully!', 'success')
              fetchCourseData()
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

  const confirmPublish = () => {
    if (!course) return
    const isInstitutionCourse = !!course.institution_id
    showModal(
      'Publish course',
      isInstitutionCourse
        ? `Publish "${course.title}"?\n\nIt will appear in your institution's Course Library, ready for your admin to add to programs and cohorts. It will not appear in the public catalog.`
        : `Publish "${course.title}"?\n\nLogged-in learners will be able to find and enroll in it from the course catalog.`,
      'confirm',
      [
        { label: 'Cancel', onClick: closeModal, variant: 'secondary' },
        {
          label: 'Publish',
          onClick: () => {
            closeModal()
            publishCourse()
          },
        },
      ]
    )
  }

  const publishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', course.id)

      if (error) throw error
      {
        if (course.institution_id) {
          toast.success('Published to your institution\'s Course Library. Your admin has been notified.')
          // Fire-and-forget: bell + email for the institution admins.
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return
            fetch(`/api/instructor/courses/${course.id}/notify-published`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {})
          })
        } else {
          toast.success('Course published! Learners can now find it in the catalog.')
        }
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

      if (error) throw error
      {
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

    // A module quiz stays at the end of its module, so it never swaps places
    // with a lesson of the same module.
    const moving = lessons[currentIndex]
    const neighbour = lessons[targetIndex]
    if (
      (isModuleQuiz(moving) || isModuleQuiz(neighbour)) &&
      (moving.module_id || null) === (neighbour.module_id || null)
    ) {
      toast.warning('A module quiz stays at the end of its module.')
      return
    }

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
      case MODULE_QUIZ_TYPE:
        return <ListChecks className="w-4 h-4" />
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
      case MODULE_QUIZ_TYPE:
        return 'Module quiz'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading course..." size="lg" />
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
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
                Course builder
              </p>
              <div className="flex items-center gap-3 mb-3">
                {course?.status === 'published' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Draft
                  </span>
                )}
                {course?.is_free ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Free
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    ₦{course?.price?.toLocaleString()}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 mb-2">
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
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-red-500" />
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-red-500" />
                  {course?.difficulty_level}
                </span>
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-red-500" />
                  {course?.category}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsEditingCourse(true)}
                variant="outline"
                className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => window.open(`/courses/${course?.slug}`, '_blank', 'noopener,noreferrer')}
                variant="outline"
                className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                size="sm"
              >
                <Eye className="w-3.5 h-3.5 mr-2" />
                Preview as learner
              </Button>
              <Button
                onClick={() => router.push(`/instructor/courses/${course?.slug}/analytics`)}
                variant="outline"
                className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                size="sm"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-2" />
                Analytics
              </Button>
              {course?.status === 'published' ? (
                <Button
                  onClick={unpublishCourse}
                  variant="outline"
                  className="bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-full shadow-sm"
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  onClick={confirmPublish}
                  className="relative overflow-hidden bg-green-600 hover:bg-green-700 text-white font-medium rounded-full ring-1 ring-green-600/50 transition-all"
                  size="sm"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              )}
              <Button
                onClick={handleDeleteCourse}
                variant="outline"
                className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-full"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Publish Stepper */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 px-5 py-4">
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
            {/* Step 1: Details */}
            <button
              type="button"
              onClick={() => scrollToSection('builder-details')}
              className="flex items-center gap-3 text-left group"
            >
              <span className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  Details
                </span>
                <span className="block text-xs text-gray-500">Course info saved</span>
              </span>
            </button>

            <span className="hidden sm:block h-px flex-1 bg-red-100" aria-hidden="true" />

            {/* Step 2: Curriculum */}
            <button
              type="button"
              onClick={() => scrollToSection('builder-curriculum')}
              className="flex items-center gap-3 text-left group"
            >
              {curriculumComplete ? (
                <span className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  2
                </span>
              )}
              <span>
                <span className="block text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  Curriculum
                </span>
                <span className="block text-xs text-gray-500">
                  {modules.length} modules · {lessons.length} lessons
                </span>
              </span>
            </button>

            <span className="hidden sm:block h-px flex-1 bg-red-100" aria-hidden="true" />

            {/* Step 3: Publish */}
            <div className="flex items-center gap-3">
              {isPublished ? (
                <span className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </span>
              ) : curriculumComplete ? (
                <span className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 text-sm font-medium text-white">
                  3
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-red-50 border border-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-400">
                  3
                </span>
              )}
              <span>
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  Publish
                  {isPublished && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      <span className="w-1 h-1 rounded-full bg-green-500" aria-hidden="true" />
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
                  onClick={confirmPublish}
                  size="sm"
                  className="ml-1 relative overflow-hidden bg-green-600 hover:bg-green-700 text-white font-medium rounded-full ring-1 ring-green-600/50 transition-all"
                >
                  <Globe className="w-4 h-4 mr-2" />
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
            className="relative overflow-hidden bg-white rounded-xl border border-gray-200"
          >
            <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium tracking-tight">Edit Course Details</CardTitle>
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
                    className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
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
                    className="flex w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    placeholder="Describe what students will learn..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:border-red-400 focus:ring-red-400"
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
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:border-red-400 focus:ring-red-400"
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
                    className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free_edit"
                    checked={courseForm.is_free}
                    onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-200 text-red-500 focus:ring-red-400"
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
                      className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setIsEditingCourse(false)} className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCourse}
                    className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
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
        <Card
          id="builder-curriculum"
          className="relative overflow-hidden bg-white rounded-xl border border-gray-200"
        >
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium tracking-tight flex items-center gap-2">
                    Course Modules
                    {isSavingModuleOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-red-50 border border-gray-200 px-2 py-1 rounded-full">
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
                  className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
                  size="sm"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Module Form */}
            {(isAddingModule || editingModule) && (
              <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
                <h3 className="font-medium tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
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
                      className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      rows={2}
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="What this module covers..."
                      className="flex w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={cancelModuleForm} className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateModule}
                      className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
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
                    className="border border-gray-200 rounded-xl p-4 bg-white/70 hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveModule(module.id, 'up')}
                            disabled={index === 0 || isSavingModuleOrder}
                            className={`p-1 rounded-lg transition-colors ${
                              index === 0 || isSavingModuleOrder
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
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
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Module Number */}
                        <div className="w-10 h-10 bg-red-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-red-500">{index + 1}</span>
                        </div>

                        {/* Module Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{module.title}</h4>
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
                          onClick={() => openModuleQuiz(module)}
                          disabled={creatingQuizForModuleId === module.id}
                          title="A quiz learners take at the end of this module"
                          className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm text-xs"
                        >
                          <ListChecks className="w-3 h-3 mr-1" />
                          {findModuleQuiz(lessons, module.id) ? 'Edit quiz' : 'Add quiz'}
                        </Button>
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
                          className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm text-xs"
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
                <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-red-300" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No modules yet. Create modules to organize lessons into logical groups.
                </p>
                <Button
                  onClick={() => setIsAddingModule(true)}
                  className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
                  size="sm"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add First Module
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════
             COURSE LESSONS CARD
             ══════════════════════════════════════════════════════════════ */}
        <Card className="relative overflow-hidden bg-white rounded-xl border border-gray-200">
          <span className="absolute top-0 inset-x-10 h-px bg-gray-200" aria-hidden="true" />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-medium tracking-tight flex items-center gap-2">
                    Course Lessons
                    {isSavingOrder && (
                      <span className="text-xs font-normal text-gray-500 bg-red-50 border border-gray-200 px-2 py-1 rounded-full">
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
                  className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Lesson Form */}
            {(isAddingLesson || editingLesson) && (
              <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
                <h3 className="font-medium tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    {editingLesson ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  {editingLesson ? (isModuleQuiz(editingLesson) ? 'Edit module quiz' : 'Edit Lesson') : 'Add New Lesson'}
                </h3>
                <div className="space-y-4">
                  <div>
                    {course?.status === 'published' && (
                      <div className="mb-3 flex items-start gap-2 bg-amber-50/80 border border-amber-100 rounded-xl px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                        <p className="text-xs text-amber-700">
                          This course is <strong>live</strong>. Saved changes appear to enrolled learners immediately.
                        </p>
                      </div>
                    )}
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Enter lesson title"
                      className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
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
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:border-red-400 focus:ring-red-400"
                    >
                      {modules.length === 0 && <option value="">Main Content (auto-created)</option>}
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {lessonForm.content_type === MODULE_QUIZ_TYPE ? (
                    <p className="text-xs text-gray-500">
                      This item holds only a quiz. Change its questions with the Questions button in the list below.
                    </p>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                      <select
                        value={lessonForm.content_type}
                        onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:border-red-400 focus:ring-red-400"
                      >
                        <option value="text">Text</option>
                        <option value="youtube">YouTube Video</option>
                        <option value="pdf">PDF Document</option>
                        <option value="powerpoint">PowerPoint</option>
                      </select>
                    </div>
                  )}

                  {lessonForm.content_type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <RichTextEditor
                        content={lessonForm.content}
                        onChange={(newContent) => setLessonForm({ ...lessonForm, content: newContent })}
                        placeholder="Enter lesson content. Use the toolbar to format text, add images, and embed videos..."
                        autosaveKey={`sabitek-lesson-draft-${params.slug}-${editingLesson?.id ?? 'new'}`}
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
                        className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
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
                      className="rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={cancelLessonForm} className="bg-white border border-gray-200 hover:border-gray-200 hover:bg-white rounded-full shadow-sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateLesson}
                      className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
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
                      className="border border-gray-100 rounded-xl p-4 bg-white transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-1">
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
                          <div className="w-10 h-10 bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                            <span className="text-sm font-medium text-red-500">
                              {index + 1}
                            </span>
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{lesson.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                {getContentTypeIcon(lesson.content_type)}
                                {getContentTypeLabel(lesson.content_type)}
                              </span>
                              {parentModule && (
                                <span className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
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
                            className="bg-white border-gray-200 hover:border-gray-200 hover:bg-white rounded-full text-xs shadow-sm"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/instructor/lessons/${lesson.id}/quiz`)}
                            className="bg-gray-50 border-gray-200 text-red-600 hover:bg-red-50 hover:border-gray-200 rounded-full text-xs"
                          >
                            {isModuleQuiz(lesson) ? 'Questions' : 'Quiz'}
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
                <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-red-300" />
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  No lessons yet. Add your first lesson to get started.
                </p>
                <Button
                  onClick={() => setIsAddingLesson(true)}
                  className="relative overflow-hidden bg-red-600 hover:bg-red-700 text-white font-medium rounded-full ring-1 ring-red-600/50 transition-all"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
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