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
        return <UserX className="w-4 h-4 text-orange-600" />
      case 'USER_ACTIVATED':
        return <UserCheck className="w-4 h-4 text-green-600" />
      case 'USER_DEACTIVATED':
        return <UserMinus className="w-4 h-4 text-gray-600" />
      case 'USER_DELETED':
        return <Trash2 className="w-4 h-4 text-red-600" />
      default:
        return <ActivityIcon className="w-4 h-4 text-blue-600" />
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
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
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