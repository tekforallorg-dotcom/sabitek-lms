'use client'
import { Search, X } from 'lucide-react'

interface CourseFiltersProps {
  search: string
  status: string
  difficulty: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  onClearFilters: () => void
}

export default function CourseFilters({
  search,
  status,
  difficulty,
  onSearchChange,
  onStatusChange,
  onDifficultyChange,
  onClearFilters,
}: CourseFiltersProps) {
  const hasActiveFilters = search || status || difficulty

  return (
    <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300" />
            <input
              type="text"
              placeholder="Search by course title..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2 rounded-full bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="w-full lg:w-48">
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-white/70 border border-rose-100 focus:border-red-400 focus:ring-2 focus:ring-red-400 focus:outline-none"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white hover:text-gray-900 rounded-full shadow-sm transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}
