import type { Lesson } from './index'

/**
 * Module represents a section/chapter within a course
 * Courses can have multiple modules, each containing lessons
 */
export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

/**
 * Extended Module interface with nested lessons and progress calculations
 * Used when displaying module accordion with lessons
 */
export interface ModuleWithLessons extends Module {
  lessons: Lesson[]
  total_lessons: number
  completed_lessons: number
  completion_percentage: number
}

/**
 * Module progress tracking for a specific user
 * Calculated from lesson_progress table
 */
export interface ModuleProgress {
  module_id: string
  total_lessons: number
  completed_lessons: number
  is_completed: boolean
  completion_percentage: number
}

/**
 * Input type for creating a new module
 */
export interface CreateModuleInput {
  course_id: string
  title: string
  description?: string
  order_index: number
}

/**
 * Input type for updating an existing module
 */
export interface UpdateModuleInput {
  title?: string
  description?: string | null
  order_index?: number
}

/**
 * Module reordering input
 */
export interface ModuleReorderInput {
  id: string
  order_index: number
}
