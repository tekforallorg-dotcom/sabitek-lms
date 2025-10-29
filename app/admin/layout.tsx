import { ReactNode } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { AuthProvider } from '@/components/providers/auth-provider'

export const metadata = {
  title: 'Sabitek Admin - Dashboard',
  description: 'Sabitek LMS Admin Panel',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}