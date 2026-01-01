export interface Material {
  id: string
  user_id: string
  filename: string
  file_path: string
  file_size: number
  extracted_text: string | null
  category: string | null
  level: string | null
  status: 'processing' | 'ready' | 'failed'
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'extracting' | 'complete' | 'error'
  error?: string
}

// Updated Categories
export const CATEGORIES = [
  'Technology & Software Development',
  'Digital Skills & Productivity',
  'Data & Analytics',
  'Cybersecurity & Online Safety',
  'Business & Entrepreneurship',
  'Career Development & Employability',
  'Professional Certifications & Exams',
  'Communication & Writing',
  'Leadership & Workplace Skills',
  'General Studies & Personal Development',
  'Other',
] as const

// Updated Levels
export const LEVELS = [
  'Foundation (Beginner)',
  'Intermediate (Developing)',
  'Advanced (Professional)',
  'Certification Prep (Exam Focused)',
  'Career Track (Job Ready)',
  'School Level (JSS & SSS)',
  'Tertiary Level (University & Polytechnic)',
  'Professional Level (Workplace)',
  'Other',
] as const

export type Category = typeof CATEGORIES[number]
export type Level = typeof LEVELS[number]

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned'

export interface Question {
  id: string
  material_id: string | null
  category: string
  level: string | null
  topic: string | null
  question: string
  options: string[]
  correct_answer: number
  rationale: string | null
  difficulty: DifficultyLevel | null
  quality_score: number | null
  status: string | null
  reuse_count: number | null
  created_by: string | null
  reviewed_by: string | null
  created_at: string | null
  updated_at: string | null
}

export interface QuizAttempt {
  id: string
  user_id: string
  material_id: string | null
  title: string
  category: string | null
  difficulty: DifficultyLevel | null
  total_questions: number
  correct_answers: number | null
  score: number | null
  time_taken_seconds: number | null
  status: QuizStatus | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
}

export interface QuizResponse {
  id: string
  attempt_id: string
  question_id: string
  user_id: string
  selected_answer: number | null
  correct: boolean | null
  time_seconds: number | null
  bookmarked: boolean | null
  created_at: string | null
}

export interface QuestionCounts {
  easy: number
  medium: number
  hard: number
  total: number
}

export const DEFAULT_QUESTIONS_PER_QUIZ = 10
export const MIN_QUESTIONS_PER_QUIZ = 1
export const MAX_QUESTIONS_PER_QUIZ = 50

// Question count options for quiz start
export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const