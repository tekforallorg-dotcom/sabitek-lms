'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  Bell,
  Medal,
  Megaphone,
  Users,
  GraduationCap,
  Info,
} from 'lucide-react'

type NotificationType =
  | 'badge'
  | 'announcement'
  | 'cohort'
  | 'completion'
  | 'system'

interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; tile: string; icon_color: string }
> = {
  badge: {
    icon: Medal,
    tile: 'bg-amber-50 border border-amber-100',
    icon_color: 'text-amber-500',
  },
  announcement: {
    icon: Megaphone,
    tile: 'bg-rose-50 border border-rose-100',
    icon_color: 'text-rose-500',
  },
  cohort: {
    icon: Users,
    tile: 'bg-rose-50 border border-rose-100',
    icon_color: 'text-rose-500',
  },
  completion: {
    icon: GraduationCap,
    tile: 'bg-emerald-50 border border-emerald-100',
    icon_color: 'text-emerald-500',
  },
  system: {
    icon: Info,
    tile: 'bg-gray-50 border border-gray-100',
    icon_color: 'text-gray-500',
  },
}

function relativeTime(iso: string): string {
  const then = new Date(iso)
  const now = new Date()
  const sameDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  if (sameDay) return 'today'
  return then.toLocaleDateString()
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => !n.read_at).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)
      if (error) {
        setItems([])
        return
      }
      setItems((data as Notification[]) || [])
    } catch {
      setItems([])
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markAllRead = async () => {
    try {
      const now = new Date().toISOString()
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .is('read_at', null)
      fetchNotifications()
    } catch {
      // ignore
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
    } catch {
      // ignore
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-rose-50 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-b from-red-500 to-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] overflow-hidden">
          <span
            className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between px-4 py-3 border-b border-rose-50">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-red-600 font-semibold hover:text-rose-700 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-10">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-rose-200" />
              </div>
              <p className="text-sm text-gray-500">Nothing yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Badges, announcements and cohort updates land here.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.system
                const Icon = meta.icon
                const isUnread = !n.read_at
                return (
                  <Link
                    key={n.id}
                    href={n.href || '/dashboard'}
                    onClick={() => {
                      if (isUnread) markOneRead(n.id)
                      setOpen(false)
                    }}
                    className={`flex gap-3 px-4 py-3 border-b border-rose-50/60 last:border-0 hover:bg-rose-50/60 transition-colors ${
                      isUnread ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${meta.tile}`}
                    >
                      <Icon className={`w-4 h-4 ${meta.icon_color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isUnread && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
                        )}
                        <p
                          className={`text-sm font-medium truncate ${
                            isUnread ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {n.title}
                        </p>
                      </div>
                      {n.body && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
