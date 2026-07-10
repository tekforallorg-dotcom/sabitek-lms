import RouteGuard from '@/components/auth/RouteGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard require="learner">{children}</RouteGuard>
}
