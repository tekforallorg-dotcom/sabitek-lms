// User and Authentication Types
export interface User {
  id: string
  email: string
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'learner' | 'instructor' | 'admin'
  bio?: string
  profile_image_url?: string
  created_at: string
  updated_at?: string
}

// Course Types
export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  instructor_id: string
  category_id?: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  thumbnail_url?: string | null
  trailer_video_url?: string | null
  estimated_duration_minutes?: number
  price_cents?: number
  created_at: string
  updated_at?: string
  published_at?: string | null
  instructor?: UserProfile
}

// Lesson Types
export interface Lesson {
  id: string
  course_id: string
  title: string
  slug: string
  content: string | null
  video_url: string | null
  video_duration_seconds?: number
  lesson_order: number
  created_at: string
  updated_at?: string
}

// Auth Types
export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse<T = any> {
  data: T | null
  error: AuthError | null
}