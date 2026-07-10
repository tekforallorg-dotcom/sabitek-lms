import RouteGuard from '@/components/auth/RouteGuard'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard require="instructor">{children}</RouteGuard>
}
