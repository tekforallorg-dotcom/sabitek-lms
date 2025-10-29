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
  is_super_admin?: boolean
  status?: 'active' | 'suspended' | 'deactivated' | 'soft_deleted'
  last_seen_at?: string | null
  bio?: string
  avatar_url?: string
  phone?: string
  location?: string
  website?: string
  created_at: string
  updated_at?: string
}

// Admin-specific types
export interface AdminUserListItem {
  id: string
  email: string
  full_name: string
  role: 'learner' | 'instructor'
  is_super_admin: boolean
  status: 'active' | 'suspended' | 'deactivated' | 'soft_deleted'
  created_at: string
  last_seen_at: string | null
}

export interface AuditLogEntry {
  actor_user_id: string
  action: string
  entity_type: string
  entity_id: string
  before?: any
  after?: any
  reason?: string
  ip_address?: string
  user_agent?: string
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

// Course Admin Types
export interface AdminCourseListItem {
  id: string
  title: string
  slug: string
  description: string | null
  instructor_id: string
  instructor_name: string
  instructor_email: string
  category: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  thumbnail_url: string | null
  price_cents: number | null
  is_free: boolean
  estimated_duration_minutes: number | null
  enrollment_count: number
  created_at: string
  published_at: string | null
}

// Certificate Admin Types
export interface AdminCertificateListItem {
  id: string
  certificate_number: string
  user_id: string
  user_name: string
  user_email: string
  course_id: string
  course_title: string
  issued_at: string
  revoked_at: string | null
  revoke_reason: string | null
  completion_date: string
  grade_percentage: number | null
  certificate_url: string | null
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