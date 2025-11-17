'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, PlayCircle, FileText, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ModuleWithLessons } from '@/types/module'
import type { Lesson } from '@/types'

interface ModuleAccordionProps {
  modules: ModuleWithLessons[]
  courseId: string
  currentLessonId?: string
  onLessonClick?: (lesson: Lesson) => void
  showProgress?: boolean
}

export default function ModuleAccordion({
  modules,
  courseId,
  currentLessonId,
  onLessonClick,
  showProgress = true,
}: ModuleAccordionProps) {
  const router = useRouter()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  )

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleLessonClick = (lesson: Lesson) => {
    if (onLessonClick) {
      onLessonClick(lesson)
    } else {
      // Default navigation to lesson page
      router.push(`/courses/${courseId}/lessons/${lesson.slug}`)
    }
  }

  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.content_type) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />
      case 'pdf':
      case 'powerpoint':
        return <FileText className="w-4 h-4" />
      case 'quiz':
        return <Award className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-600">No modules available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const hasProgress = showProgress && module.total_lessons > 0

        return (
          <Card key={module.id} className="overflow-hidden border-gray-200">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    className="mt-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleModule(module.id)
                    }}
                    aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-gray-900 mb-1">
                      {moduleIndex + 1}. {module.title}
                    </CardTitle>

                    {module.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {module.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>
                        {module.total_lessons} {module.total_lessons === 1 ? 'lesson' : 'lessons'}
                      </span>

                      {hasProgress && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>
                            {module.completed_lessons} completed
                          </span>
                        </>
                      )}
                    </div>

                    {hasProgress && (
                      <div className="mt-2">
                        <Progress value={module.completion_percentage} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>

                {hasProgress && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-medium text-gray-700">
                      {module.completion_percentage}%
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            {isExpanded && module.lessons.length > 0 && (
              <CardContent className="p-0 border-t border-gray-200">
                <ul className="divide-y divide-gray-100">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCurrentLesson = lesson.id === currentLessonId
                    const isCompleted = showProgress && module.completed_lessons > lessonIndex

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => handleLessonClick(lesson)}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3',
                            isCurrentLesson && 'bg-red-50 hover:bg-red-50'
                          )}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs text-gray-500">
                                {moduleIndex + 1}.{lessonIndex + 1}
                              </span>
                              <h4
                                className={cn(
                                  'text-sm font-medium truncate',
                                  isCurrentLesson ? 'text-red-700' : 'text-gray-900'
                                )}
                              >
                                {lesson.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                {getLessonIcon(lesson)}
                                {lesson.content_type || 'lesson'}
                              </span>

                              {lesson.duration_minutes && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span>{formatDuration(lesson.duration_minutes)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {isCurrentLesson && (
                            <div className="flex-shrink-0">
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Current
                              </span>
                            </div>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            )}

            {isExpanded && module.lessons.length === 0 && (
              <CardContent className="p-8 text-center border-t border-gray-200">
                <p className="text-sm text-gray-500">No lessons in this module yet.</p>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
