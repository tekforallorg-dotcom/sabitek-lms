'use client'
import { Search, Filter, X } from 'lucide-react'
import { useState } from 'react'

interface UserFiltersProps {
  search: string
  role: string
  status: string
  onSearchChange: (value: string) => void
  onRoleChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClearFilters: () => void
}

export default function UserFilters({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onClearFilters,
}: UserFiltersProps) {
  const hasActiveFilters = search || role || status

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-full lg:w-48">
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="learner">Learner</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}