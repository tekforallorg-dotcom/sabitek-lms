// ============================================
// SABICOMMUNITY TYPES
// ============================================

// Enums (matching database)
export type SkillCategory = 
  | 'technology'
  | 'data'
  | 'design'
  | 'business'
  | 'exams'
  | 'corporate'
  | 'productivity'
  | 'career'
  | 'languages'
  | 'other'

export type SpokenLanguage = 
  | 'english'
  | 'pidgin'
  | 'yoruba'
  | 'hausa'
  | 'igbo'
  | 'french'
  | 'arabic'
  | 'other'

export type SessionLength = '30' | '60' | '90'

export type MeetingMethod = 
  | 'google_meet'
  | 'zoom'
  | 'whatsapp_call'
  | 'phone_call'
  | 'in_person'
  | 'other'

export type SkillType = 'teach' | 'learn'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Request & Session Enums
export type RequestStatus = 'open' | 'in_review' | 'matched' | 'closed' | 'expired'
export type RequestUrgency = 'low' | 'medium' | 'high'
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export type SessionStatus = 'proposed' | 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type SessionRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type MeetingProvider = 'google_meet' | 'zoom' | 'whatsapp' | 'discord' | 'other'
export type NotificationType = 
  | 'session_request'
  | 'session_request_accepted'
  | 'session_request_declined'
  | 'offer'
  | 'offer_accepted'
  | 'offer_declined'
  | 'session_scheduled'
  | 'session_reminder'
  | 'message'
  | 'review_prompt'
export type ThreadContext = 'session_request' | 'offer' | 'general'
export type MessageContentType = 'text' | 'system'
export type ReportStatus = 'open' | 'reviewing' | 'resolved'

// ============================================
// DATABASE TYPES
// ============================================

export interface Skill {
  id: string
  name: string
  slug: string
  category: SkillCategory
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityProfile {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
  bio: string | null
  location: string | null
  timezone: string
  languages: SpokenLanguage[]
  preferred_session_lengths: SessionLength[]
  preferred_meeting_methods: MeetingMethod[]
  meeting_link: string | null
  completion_rate: number
  response_time_hours: number | null
  is_verified: boolean
  is_public: boolean
  is_available_to_mentor: boolean
  is_looking_to_learn: boolean
  is_suspended: boolean
  suspended_reason: string | null
  suspended_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface ProfileSkill {
  id: string
  user_id: string
  skill_id: string
  skill_type: SkillType
  level: SkillLevel
  years_experience: number | null
  proof_links: string[] | null
  description: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  // Joined data
  skill?: Skill
}

export interface AvailabilitySlot {
  id: string
  user_id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface LearningRequest {
  id: string
  user_id: string
  title: string
  description: string
  skill_id: string | null
  level: SkillLevel
  preferred_language: SpokenLanguage
  urgency: RequestUrgency
  session_length: SessionLength
  constraints: string[] | null
  status: RequestStatus
  views_count: number
  offers_count: number
  created_at: string
  updated_at: string
  closed_at: string | null
  // Joined data
  skill?: Skill
  user?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface RequestOffer {
  id: string
  request_id: string
  mentor_id: string
  message: string
  proposed_time: string | null
  proposed_duration: number
  proposed_credits: number
  status: OfferStatus
  created_at: string
  // Joined
  mentor?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface Session {
  id: string
  request_id: string | null
  mentor_id: string
  learner_id: string
  scheduled_at: string
  duration: number
  credits: number
  status: SessionStatus
  meeting_link: string | null
  notes: string | null
  created_at: string
  completed_at: string | null
}

// ============================================
// NEW MESSAGING SYSTEM TYPES
// ============================================

export interface MentorProfileExtended {
  id: string
  bio: string | null
  headline: string | null
  hourly_rate_ngn: number | null
  availability: Record<string, unknown> | null
  verified: boolean
  created_at: string
  updated_at: string
}

export interface SessionRequest {
  id: string
  learner_id: string
  mentor_id: string
  message: string | null
  status: SessionRequestStatus
  created_at: string
  updated_at: string
  // Joined data
  learner?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
  mentor?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface CommunityOffer {
  id: string
  request_id: string
  mentor_id: string
  message: string | null
  proposed_rate_ngn: number | null
  status: OfferStatus
  created_at: string
  updated_at: string
  // Joined data
  mentor?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  request?: LearningRequest
}

export interface CommunitySession {
  id: string
  learner_id: string
  mentor_id: string
  session_request_id: string | null
  offer_id: string | null
  skill_id: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  duration_minutes: number
  meeting_provider: MeetingProvider | null
  meeting_url: string | null
  status: SessionStatus
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  // Joined data
  learner?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  mentor?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  skill?: Skill
}

export interface Thread {
  id: string
  session_id: string | null
  context: ThreadContext
  created_at: string
  updated_at: string
  // Joined/computed
  participants?: ThreadParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ThreadParticipant {
  thread_id: string
  user_id: string
  role: 'learner' | 'mentor'
  last_read_at: string | null
  created_at: string
  // Joined
  user?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  content_type: MessageContentType
  created_at: string
  edited_at: string | null
  is_deleted: boolean
  // Joined
  sender?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  entity_id: string | null
  entity_type: string | null
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  session_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  // Joined
  reviewer?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  session?: CommunitySession
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  thread_id: string | null
  message_id: string | null
  reason: string
  details: string | null
  status: ReportStatus
  created_at: string
}

// ============================================
// FORM TYPES
// ============================================

export interface CommunityProfileForm {
  username: string
  display_name: string
  bio: string
  location: string
  timezone: string
  languages: SpokenLanguage[]
  preferred_session_lengths: SessionLength[]
  preferred_meeting_methods: MeetingMethod[]
  meeting_link: string
  is_public: boolean
  is_available_to_mentor: boolean
  is_looking_to_learn: boolean
}

export interface ProfileSkillForm {
  skill_id: string
  skill_type: SkillType
  level: SkillLevel
  years_experience?: number
  proof_links?: string[]
  description?: string
  tags?: string[]
}

export interface LearningRequestForm {
  title: string
  description: string
  skill_id: string
  level: SkillLevel
  preferred_language: SpokenLanguage
  urgency: RequestUrgency
  session_length: SessionLength
  constraints: string[]
}

export interface SessionRequestForm {
  mentor_id: string
  message: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CommunityProfileWithSkills extends CommunityProfile {
  teaching_skills: (ProfileSkill & { skill: Skill })[]
  learning_skills: (ProfileSkill & { skill: Skill })[]
  availability: AvailabilitySlot[]
}

export interface MentorProfile {
  user_id: string
  username: string | null
  display_name: string
  bio: string | null
  location: string | null
  avatar_url: string | null
  languages: SpokenLanguage[]
  preferred_session_lengths: SessionLength[]
  preferred_meeting_methods: MeetingMethod[]
  is_verified: boolean
  response_time_hours: number | null
  completion_rate: number
  // Computed/joined
  teaching_skills: (ProfileSkill & { skill: Skill })[]
  total_sessions: number
  avg_rating: number
  reviews_count: number
}

export interface MentorProfileFull extends MentorProfile {
  headline: string | null
  hourly_rate_ngn: number | null
  availability: AvailabilitySlot[]
  reviews: Review[]
}

// ============================================
// CONSTANTS
// ============================================

export const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'exams', label: 'Exam Prep' },
  { value: 'corporate', label: 'Corporate Skills' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'career', label: 'Career Development' },
  { value: 'languages', label: 'Languages' },
  { value: 'other', label: 'Other' },
]

export const SPOKEN_LANGUAGES: { value: SpokenLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'pidgin', label: 'Pidgin' },
  { value: 'yoruba', label: 'Yoruba' },
  { value: 'hausa', label: 'Hausa' },
  { value: 'igbo', label: 'Igbo' },
  { value: 'french', label: 'French' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'other', label: 'Other' },
]

export const SESSION_LENGTHS: { value: SessionLength; label: string }[] = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
]

export const MEETING_METHODS: { value: MeetingMethod; label: string }[] = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'whatsapp_call', label: 'WhatsApp Call' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
]

export const MEETING_PROVIDERS: { value: MeetingProvider; label: string }[] = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'discord', label: 'Discord' },
  { value: 'other', label: 'Other' },
]

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export const REQUEST_URGENCIES: { value: RequestUrgency; label: string; color: string }[] = [
  { value: 'low', label: 'No rush', color: 'text-green-600 bg-green-50' },
  { value: 'medium', label: 'Within a week', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'high', label: 'Urgent', color: 'text-red-600 bg-red-50' },
]

export const REQUEST_CONSTRAINTS: { value: string; label: string }[] = [
  { value: 'low_data', label: 'Low data/bandwidth' },
  { value: 'evenings_only', label: 'Evenings only' },
  { value: 'weekends_only', label: 'Weekends only' },
  { value: 'mobile_only', label: 'Mobile only' },
]

export const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'Reviewing Offers' },
  { value: 'matched', label: 'Matched' },
  { value: 'closed', label: 'Closed' },
  { value: 'expired', label: 'Expired' },
]

export const SESSION_STATUSES: { value: SessionStatus; label: string; color: string }[] = [
  { value: 'proposed', label: 'Proposed', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'scheduled', label: 'Scheduled', color: 'text-blue-600 bg-blue-50' },
  { value: 'completed', label: 'Completed', color: 'text-green-600 bg-green-50' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600 bg-gray-50' },
  { value: 'no_show', label: 'No Show', color: 'text-red-600 bg-red-50' },
]

export const SESSION_REQUEST_STATUSES: { value: SessionRequestStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'accepted', label: 'Accepted', color: 'text-green-600 bg-green-50' },
  { value: 'declined', label: 'Declined', color: 'text-red-600 bg-red-50' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600 bg-gray-50' },
]