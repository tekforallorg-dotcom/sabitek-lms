import { formatDistanceToNow } from 'date-fns'
import {
  UserX,
  UserCheck,
  UserMinus,
  Trash2,
  Activity as ActivityIcon
} from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  entity_type: string
  entity_id: string
  reason: string | null
  created_at: string
  actor: {
    full_name: string
    email: string
  } | null
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_SUSPENDED':
        return <UserX className="w-4 h-4 text-amber-600" />
      case 'USER_ACTIVATED':
        return <UserCheck className="w-4 h-4 text-emerald-600" />
      case 'USER_DEACTIVATED':
        return <UserMinus className="w-4 h-4 text-gray-500" />
      case 'USER_DELETED':
        return <Trash2 className="w-4 h-4 text-red-600" />
      default:
        return <ActivityIcon className="w-4 h-4 text-red-500" />
    }
  }

  const getActionLabel = (action: string) => {
    return action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-start gap-3">
            <div className="w-8 h-8 bg-rose-50/60 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 bg-rose-50/60 rounded-xl w-3/4 mb-2"></div>
              <div className="h-3 bg-rose-50/60 rounded-xl w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">No recent activity to display.</p>
    )
  }

  return (
    <div>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 px-2 py-3 -mx-2 rounded-xl border-b border-rose-50 last:border-b-0 hover:bg-rose-50/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
            {getActionIcon(activity.action)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.actor?.full_name || 'System'}</span>
              {' '}
              <span className="text-gray-600">{getActionLabel(activity.action)}</span>
            </p>
            {activity.reason && (
              <p className="text-xs text-gray-500 mt-1 italic">"{activity.reason}"</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
