import SabiLoader from '@/components/ui/SabiLoader'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/30 via-white to-red-50/30">
      <SabiLoader text="Loading..." size="lg" />
    </div>
  )
}