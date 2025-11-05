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

export const CATEGORIES = [
  'STEM (Science, Tech, Engineering, Math)',
  'Technology & Professional Courses',
  'Other',
] as const

export const LEVELS = [
  'Junior Secondary (JSS1-JSS3)',
  'Senior Secondary (SS1-SS3)',
  'Professional Course',
  'University/Tertiary',
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
export const MIN_QUESTIONS_PER_QUIZ = 5
export const MAX_QUESTIONS_PER_QUIZ = 50