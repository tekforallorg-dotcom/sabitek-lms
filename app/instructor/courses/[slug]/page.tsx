'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import FileUploader from '@/components/upload/file-uploader'
import RichTextEditor from '@/components/editor/rich-text-editor'

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
  'Other'
]

export default function CourseManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courseLoading, setCourseLoading] = useState(true)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    cover_image_url: '',
    intro_video_url: '',
    is_free: true,
    price: 0
  })
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    content_type: 'text',
    youtube_url: '',
    pdf_url: '',
    powerpoint_url: '',
    duration_minutes: 0
  })
  const [isAddingLesson, setIsAddingLesson] = useState(false)

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
        price: courseData.price || 0
      })

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('lesson_order')

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setCourseLoading(false)
    }
  }

  const handleUpdateCourse = async () => {
    if (!course || !courseForm.title || courseForm.description.length > 500) {
      alert('Please fill all required fields. Description must be 500 characters or less.')
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
          price: courseForm.is_free ? 0 : courseForm.price
        })
        .eq('id', course.id)

      if (!error) {
        alert('Course updated successfully!')
        setIsEditingCourse(false)
        fetchCourseData()
      } else {
        alert(`Failed to update course: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Failed to update course')
    }
  }

  const handleDeleteCourse = async () => {
    if (!course) return

    if (!confirm(`Are you sure you want to delete "${course.title}"? This will also delete all lessons and cannot be undone.`)) {
      return
    }

    try {
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('course_id', course.id)

      if (lessonsError) {
        alert(`Failed to delete lessons: ${lessonsError.message}`)
        return
      }

      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)

      if (!courseError) {
        alert('Course deleted successfully!')
        router.push('/instructor')
      } else {
        alert(`Failed to delete course: ${courseError.message}`)
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course')
    }
  }

  const handleAddOrUpdateLesson = async () => {
    if (!course || !lessonForm.title) return

    try {
      const lessonData = {
        course_id: course.id,
        title: lessonForm.title,
        slug: generateSlug(lessonForm.title),
        content: lessonForm.content,
        content_type: lessonForm.content_type,
        youtube_url: lessonForm.youtube_url || null,
        pdf_url: lessonForm.pdf_url || null,
        powerpoint_url: lessonForm.powerpoint_url || null,
        duration_minutes: lessonForm.duration_minutes || null,
        lesson_order: editingLesson ? editingLesson.lesson_order : lessons.length + 1
      }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)

        if (!error) {
          alert('Lesson updated successfully!')
          setEditingLesson(null)
        }
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData)

        if (!error) {
          alert('Lesson added successfully!')
          setIsAddingLesson(false)
        }
      }

      setLessonForm({
        title: '',
        content: '',
        content_type: 'text',
        youtube_url: '',
        pdf_url: '',
        powerpoint_url: '',
        duration_minutes: 0
      })
      fetchCourseData()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Failed to save lesson')
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (!error) {
        alert('Lesson deleted successfully!')
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const publishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', course.id)

      if (!error) {
        alert('Course published successfully!')
        setCourse({ ...course, status: 'published' })
      }
    } catch (error) {
      console.error('Error publishing course:', error)
      alert('Failed to publish course')
    }
  }

  const unpublishCourse = async () => {
    if (!course) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'draft' })
        .eq('id', course.id)

      if (!error) {
        alert('Course unpublished successfully!')
        setCourse({ ...course, status: 'draft' })
      }
    } catch (error) {
      console.error('Error unpublishing course:', error)
      alert('Failed to unpublish course')
    }
  }

  if (loading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
              <p className="mt-2 text-gray-600">{course?.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  course?.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course?.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <span className="text-sm text-gray-600">
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setIsEditingCourse(true)}
                variant="outline"
                className="border-gray-300"
              >
                Edit Course
              </Button>
              <Button
                onClick={handleDeleteCourse}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Delete Course
              </Button>
              <Button
                onClick={() => router.push(`/courses/${course?.slug}`)}
                variant="outline"
                className="border-gray-300"
              >
                Preview Course
              </Button>
              {course?.status === 'published' ? (
                <Button
                  onClick={unpublishCourse}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  onClick={publishCourse}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Publish Course
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Course Modal */}
        {isEditingCourse && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Course Details</CardTitle>
              <CardDescription>Update your course information</CardDescription>
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
                    className="flex w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
                    placeholder="Describe what students will learn..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={courseForm.difficulty_level}
                      onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image
                  </label>
                  <FileUploader
                    label="Upload Cover Image"
                    accept="image/*"
                    folder="course-covers"
                    currentUrl={courseForm.cover_image_url}
                    onUpload={(url: string) => setCourseForm({ ...courseForm, cover_image_url: url })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intro Video URL (Optional)
                  </label>
                  <Input
                    value={courseForm.intro_video_url}
                    onChange={(e) => setCourseForm({ ...courseForm, intro_video_url: e.target.value })}
                    placeholder="YouTube or Vimeo link"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free_edit"
                    checked={courseForm.is_free}
                    onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_free_edit" className="text-sm font-medium text-gray-700">
                    This course is free
                  </label>
                </div>

                {!courseForm.is_free && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₦)
                    </label>
                    <Input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingCourse(false)}
                    className="border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateCourse}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>Manage your course content</CardDescription>
              </div>
              {!isAddingLesson && !editingLesson && (
                <Button
                  onClick={() => setIsAddingLesson(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  + Add Lesson
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(isAddingLesson || editingLesson) && (
              <div className="border rounded-lg p-4 mb-6 bg-gray-50">
                <h3 className="font-semibold mb-4">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Title
                    </label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Enter lesson title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Type
                    </label>
                    <select
                      value={lessonForm.content_type}
                      onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="text">Text</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="pdf">PDF Document</option>
                      <option value="powerpoint">PowerPoint</option>
                    </select>
                  </div>

                  {lessonForm.content_type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <RichTextEditor
                        content={lessonForm.content}
                        onChange={(newContent) => setLessonForm({ ...lessonForm, content: newContent })}
                        placeholder="Enter lesson content. Use the toolbar to format text, add images, and embed videos..."
                      />
                    </div>
                  )}

                  {lessonForm.content_type === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        YouTube URL
                      </label>
                      <Input
                        value={lessonForm.youtube_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, youtube_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <Input
                      type="number"
                      value={lessonForm.duration_minutes}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                      placeholder="Estimated duration"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingLesson(false)
                        setEditingLesson(null)
                        setLessonForm({
                          title: '',
                          content: '',
                          content_type: 'text',
                          youtube_url: '',
                          pdf_url: '',
                          powerpoint_url: '',
                          duration_minutes: 0
                        })
                      }}
                      className="border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddOrUpdateLesson}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {index + 1}. {lesson.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Type: {lesson.content_type}</span>
                          {lesson.duration_minutes && (
                            <span>Duration: {lesson.duration_minutes} min</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                              duration_minutes: lesson.duration_minutes || 0
                            })
                          }}
                          className="border-gray-300"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/instructor/lessons/${lesson.id}/quiz`)}
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                        >
                          Quiz
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteLesson(lesson.id)}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No lessons yet. Add your first lesson to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}