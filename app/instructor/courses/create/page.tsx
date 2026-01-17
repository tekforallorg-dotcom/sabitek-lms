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
import FileUploader from '@/components/upload/file-uploader'
import { 
  BookOpen, 
  Image, 
  DollarSign, 
  ChevronLeft,
  Sparkles,
  CheckCircle,
  FileText,
  Video,
  Upload,
  GraduationCap,
  Layers,
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

      // Create the course
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-red-100 rounded-full"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-pink-900/20" />
        
        {/* Floating elements */}
        <div className="absolute top-10 right-[15%] w-20 h-20 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <button 
            onClick={() => router.push('/instructor')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Course</h1>
              <p className="text-gray-400 text-sm mt-1">Share your knowledge with learners across Africa</p>
            </div>
          </div>
        </div>

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Course Details</CardTitle>
                <CardDescription className="text-xs">
                  Fill in the course information. You can add lessons after creating the course.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Introduction to Web Development"
                    className="rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
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
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                    <span className={`text-xs ml-2 ${(description?.length || 0) > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                      ({description?.length || 0}/500)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    className="flex w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                    <label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                    <label htmlFor="difficulty_level" className="text-sm font-medium text-gray-700">
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty_level"
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Image className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-semibold text-gray-900">Course Media</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cover Image <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <FileUploader
                    label="Upload Cover Image"
                    accept="image/*"
                    folder="course-covers"
                    currentUrl={coverImageUrl}
                    onUpload={(url: string) => setCoverImageUrl(url)}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Recommended size: 1280×720px (16:9 ratio)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="intro_video_url" className="text-sm font-medium text-gray-700">
                    Intro Video URL <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="intro_video_url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
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
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-5 h-5 flex items-center justify-center text-red-500 font-bold text-sm">₦</span>  
                  <h3 className="text-base font-semibold text-gray-900">Pricing</h3>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_free"
                    {...register('is_free')}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="is_free" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>This course is free</span>
                    {isFree && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Free for all learners
                      </span>
                    )}
                  </label>
                </div>

                {!isFree && (
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Price (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 pl-8"
                        {...register('price')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Create Course
                    </span>
                  )}
                </Button>
                <Link href="/instructor">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-200 hover:bg-gray-50 rounded-xl"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* What happens next */}
        <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Add lessons with PDFs, PowerPoints, or YouTube videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Create quizzes to test learner understanding</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Course starts in draft mode — publish when you&apos;re ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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