import RouteGuard from '@/components/auth/RouteGuard'

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard require="institution">{children}</RouteGuard>
}
