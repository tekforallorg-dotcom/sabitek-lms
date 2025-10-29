import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: LucideIcon
  bgColor: string
  iconColor: string
  subtitle?: string
}

export default function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  bgColor,
  iconColor,
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUp className="w-4 h-4" />
            ) : trend === 'down' ? (
              <ArrowDown className="w-4 h-4" />
            ) : null}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}