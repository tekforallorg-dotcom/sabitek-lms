'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(1, 'Category is required'),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  intro_video_url: z.string().optional(),
  is_free: z.boolean(),
  price: z.string().optional(),
})

type CourseInput = z.infer<typeof courseSchema>

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

export default function CreateCoursePage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      difficulty_level: 'beginner',
      category: '',
      is_free: true,
      price: '0',
    }
  })

  const isFree = watch('is_free')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
    if (!loading && userProfile && userProfile.role !== 'instructor') {
      router.push('/dashboard')
    }
  }, [user, userProfile, loading, router])

  const onSubmit = async (data: CourseInput) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      const slug = generateSlug(data.title)
      
      // Check if slug already exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingCourse) {
        setError('A course with a similar title already exists. Please choose a different title.')
        setIsSubmitting(false)
        return
      }

      // Create the course
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          slug: slug,
          description: data.description,
          difficulty_level: data.difficulty_level,
          category: data.category,
          cover_image_url: data.cover_image_url || null,
          intro_video_url: data.intro_video_url || null,
          is_free: data.is_free,
          price: data.is_free ? 0 : parseFloat(data.price || '0'),
          instructor_id: user.id,
          status: 'draft'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating course:', insertError)
        setError(insertError.message)
        return
      }

      // Redirect to course management page
      router.push(`/instructor/courses/${slug}`)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || userProfile?.role !== 'instructor') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-black text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-red-400">Sabitek</h1>
              <div className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-gray-300 hover:text-white">
                  Dashboard
                </Link>
                <Link href="/instructor" className="text-gray-300 hover:text-white">
                  Instructor Hub
                </Link>
                <Link href="/instructor/courses/create" className="text-red-400">
                  Create Course
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {userProfile?.full_name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Course</h2>
          <p className="text-gray-600 mt-2">Share your knowledge with learners across Africa</p>
        </div>

        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Fill in the course information. You can add lessons and content after creating the course.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Introduction to Web Development"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    placeholder="Describe what students will learn in this course..."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      {...register('category')}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="difficulty_level" className="text-sm font-medium text-gray-700">
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty_level"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      {...register('difficulty_level')}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Course Media</h3>
                
                <div className="space-y-2">
                  <label htmlFor="cover_image_url" className="text-sm font-medium text-gray-700">
                    Cover Image URL (Optional)
                  </label>
                  <Input
                    id="cover_image_url"
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    {...register('cover_image_url')}
                  />
                  <p className="text-xs text-gray-500">Recommended size: 1280x720px</p>
                  {errors.cover_image_url && (
                    <p className="text-sm text-red-600">{errors.cover_image_url.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="intro_video_url" className="text-sm font-medium text-gray-700">
                    Intro Video URL (Optional)
                  </label>
                  <Input
                    id="intro_video_url"
                    type="text"
                    placeholder="YouTube or Vimeo link"
                    {...register('intro_video_url')}
                  />
                  <p className="text-xs text-gray-500">Add a video to introduce your course</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pricing</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free"
                    {...register('is_free')}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="is_free" className="text-sm font-medium text-gray-700">
                    This course is free
                  </label>
                </div>

                {!isFree && (
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Price (₦)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('price')}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Create Course'}
                </Button>
                <Link href="/instructor">
                  <Button type="button" variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• After creating your course, you&apos;ll add lessons with various content types</li>
            <li>• You can upload PDFs, PowerPoints, or embed YouTube videos for each lesson</li>
            <li>• Courses start in draft mode - publish when you&apos;re ready</li>
            <li>• Students can enroll once your course is published</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
