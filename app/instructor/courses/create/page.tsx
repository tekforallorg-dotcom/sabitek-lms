'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import FileUploader from '@/components/upload/file-uploader'
import {
  Image,
  ChevronLeft,
  CheckCircle,
  FileText,
  Video,
  Upload,
  GraduationCap,
  AlertCircle
} from 'lucide-react'

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  difficulty_level: z.enum(['absolute-beginner', 'beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'expert', 'all-levels']),
  category: z.string().min(1, 'Category is required'),
  intro_video_url: z.string().optional(),
  is_free: z.boolean(),
  price: z.string().optional(),
})

type CourseInput = z.infer<typeof courseSchema>

const categories = [
  'Technology & IT',
  'Web Development',
  'Mobile Development',
  'Data Science & Analytics',
  'Artificial Intelligence',
  'Cybersecurity',
  'Cloud Computing',
  'Business & Entrepreneurship',
  'Digital Marketing',
  'Finance & Accounting',
  'Project Management',
  'Design & Creative',
  'UI/UX Design',
  'Graphic Design',
  'Video & Animation',
  'Photography',
  'Music & Audio',
  'Writing & Content',
  'Personal Development',
  'Leadership & Management',
  'Communication Skills',
  'Health & Wellness',
  'Fitness & Nutrition',
  'Languages',
  'Education & Teaching',
  'Engineering',
  'Science & Research',
  'Agriculture & Farming',
  'Law & Legal',
  'Real Estate',
  'Hospitality & Tourism',
  'Fashion & Beauty',
  'Arts & Crafts',
  'Religion & Spirituality',
  'Parenting & Family',
  'Career Development',
  'Other'
]

const difficultyLevels = [
  { value: 'absolute-beginner', label: 'Absolute Beginner', description: 'No prior knowledge needed' },
  { value: 'beginner', label: 'Beginner', description: 'Basic understanding helpful' },
  { value: 'elementary', label: 'Elementary', description: 'Some foundational knowledge' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics' },
  { value: 'upper-intermediate', label: 'Upper Intermediate', description: 'Strong foundation required' },
  { value: 'advanced', label: 'Advanced', description: 'Significant experience needed' },
  { value: 'expert', label: 'Expert', description: 'Professional-level content' },
  { value: 'all-levels', label: 'All Levels', description: 'Suitable for everyone' },
]

const builderSteps = [
  { number: 1, label: 'Details', sublabel: 'Title, category & pricing', status: 'current' as const },
  { number: 2, label: 'Curriculum', sublabel: 'Next: add modules & lessons', status: 'upcoming' as const },
  { number: 3, label: 'Publish', sublabel: 'Review & go live', status: 'upcoming' as const },
]

export default function CreateCoursePage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState('')

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
  const description = watch('description')
  const difficultyLevel = watch('difficulty_level')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
    if (!loading && userProfile && userProfile.role !== 'instructor') {
      router.push('/dashboard')
    }
  }, [user, userProfile, loading, router])

  const onSubmit = async (data: CourseInput) => {
    console.log('🚀 Form submitted with data:', data)
    console.log('📝 Description length:', data.description.length)

    if (!user) {
      console.log('❌ No user')
      return
    }

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

      // Institution instructors author PROPRIETARY courses: stamp the
      // owning institution so tenancy rules scope visibility to its
      // members and cohorts. Independent instructors stay public (null).
      let institutionId: string | null = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const memberRes = await fetch('/api/institutions/my-membership', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (memberRes.ok) {
            const membership = await memberRes.json()
            institutionId = membership?.institution_id || null
          }
        }
      } catch {
        // No membership -> public course
      }

      // Create the course
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          institution_id: institutionId,
          title: data.title,
          slug: slug,
          description: data.description,
          difficulty_level: data.difficulty_level,
          category: data.category,
          cover_image_url: coverImageUrl || null,
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
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14">
            <div className="w-14 h-14 border-4 border-rose-100 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || userProfile?.role !== 'instructor') {
    return null
  }

  const inputClasses = "rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
  const labelClasses = "text-[13px] font-medium text-gray-700"

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <button
          onClick={() => router.push('/instructor')}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Course builder</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            Create a new <span className="font-serif italic text-red-600">course</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">Share your knowledge with learners across Africa</p>
        </div>

        {/* Stepper */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] px-5 sm:px-6 py-4 mb-8">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {builderSteps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-4 sm:gap-5 sm:flex-1">
                <div className="flex items-center gap-3">
                  {step.status === 'current' ? (
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                      {step.number}
                    </span>
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 text-gray-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {step.number}
                    </span>
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${step.status === 'current' ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">{step.sublabel}</p>
                  </div>
                </div>
                {index < builderSteps.length - 1 && (
                  <span className="hidden sm:block h-px flex-1 bg-rose-100" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-5 sm:px-8 py-6 border-b border-rose-100/70">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Course Details</h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill in the course information. You can add lessons after creating the course.
            </p>
          </div>
          <div className="px-5 sm:px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-100/70">
                  <FileText className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">Basic Information</h3>
                </div>

                <div className="space-y-2">
                  <label htmlFor="title" className={labelClasses}>
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Introduction to Web Development"
                    className={inputClasses}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className={labelClasses}>
                    Description <span className="text-red-500">*</span>
                    <span className={`text-xs ml-2 ${(description?.length || 0) > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                      ({description?.length || 0}/500)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    className="flex w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400"
                    placeholder="Describe what students will learn in this course..."
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className={labelClasses}>
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400"
                      {...register('category')}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="difficulty_level" className={labelClasses}>
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty_level"
                      className="flex h-10 w-full rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400"
                      {...register('difficulty_level')}
                    >
                      {difficultyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                           {level.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      {difficultyLevels.find(l => l.value === difficultyLevel)?.description || 'Select a difficulty level'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-100/70">
                  <Image className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">Course Media</h3>
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>
                    Cover Image <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="border border-dashed border-rose-200 bg-rose-50/40 rounded-2xl p-3">
                    <FileUploader
                      label="Upload Cover Image"
                      accept="image/*"
                      folder="course-covers"
                      currentUrl={coverImageUrl}
                      onUpload={(url: string) => setCoverImageUrl(url)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Recommended size: 1280×720px (16:9 ratio)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="intro_video_url" className={labelClasses}>
                    Intro Video URL <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="intro_video_url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={inputClasses}
                    {...register('intro_video_url')}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Add a YouTube or Vimeo link to introduce your course
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-100/70">
                  <span className="w-5 h-5 flex items-center justify-center text-red-500 font-bold text-sm">₦</span>
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">Pricing</h3>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-rose-50/60 border border-rose-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_free"
                    {...register('is_free')}
                    className="h-5 w-5 rounded border-rose-200 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="is_free" className={`${labelClasses} flex items-center gap-2`}>
                    <span>This course is free</span>
                    {isFree && (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        Free for all learners
                      </span>
                    )}
                  </label>
                </div>

                {!isFree && (
                  <div className="space-y-2">
                    <label htmlFor="price" className={labelClasses}>
                      Price (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={`${inputClasses} pl-8`}
                        {...register('price')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-rose-100/70">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  {isSubmitting ? (
                    <span className="relative flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="relative">Create Course</span>
                  )}
                </Button>
                <Link href="/instructor">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* What happens next */}
        <div className="relative overflow-hidden mt-6 p-5 sm:p-6 bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Add lessons with PDFs, PowerPoints, or YouTube videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Create quizzes to test learner understanding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Course starts in draft mode — publish when you&apos;re ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Students can enroll once your course is published</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
