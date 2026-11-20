'use client'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { User, Bell } from 'lucide-react'

export default function AdminHeader() {
  const { userProfile } = useAdminAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title - Will be set by individual pages */}
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">
            {/* This will be overridden by page content */}
          </h1>
        </div>

        {/* Right Side - Notifications & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center ring-2 ring-gray-200">
                <span className="text-sm font-medium text-red-600">
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            )}

            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
