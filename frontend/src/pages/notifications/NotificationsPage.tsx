import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CalendarClock,
  RotateCcw,
  PackageCheck,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { notificationService } from '@/services/api/notificationService'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/utils/formatters'
import type { NotificationItem } from '@/types'

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success } = useToast()

  const [filter, setFilter] = React.useState<'all' | 'unread'>('all')

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  })

  const filtered = React.useMemo(() => {
    if (!notifications) return []
    if (filter === 'unread') return notifications.filter((n) => !n.read)
    return notifications
  }, [notifications, filter])

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const handleClearAll = async () => {
    await notificationService.clearAll()
    success('Notifications Cleared', 'All notices cleared')
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'expiry':
        return <CalendarClock className="h-4 w-4 text-red-500" />
      case 'refund':
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      case 'purchase':
        return <PackageCheck className="h-4 w-4 text-emerald-500" />
      case 'shift':
        return <Clock className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Notifications & Telemetry Alerts"
        description="Low stock alerts, near-expiry warnings, purchase deliveries, and manager approval requests"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                notifications?.forEach((n) => handleMarkAsRead(n.id))
                success('Marked All as Read', '')
              }}
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark All Read
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear All
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>System Notifications ({filtered.length})</CardTitle>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filter === 'unread' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Unread
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <p className="py-12 text-center text-xs text-slate-400">Loading notifications...</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">No notifications to display.</p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-start justify-between gap-4 transition ${
                    item.read
                      ? 'bg-transparent'
                      : 'bg-blue-50/50 dark:bg-blue-950/20 font-medium'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatDate(item.createdAt, true)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.actionUrl && (
                      <Link to={item.actionUrl}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          Inspect <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                    {!item.read && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
