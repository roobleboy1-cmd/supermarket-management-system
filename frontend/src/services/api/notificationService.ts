import api from './client'
import type { NotificationItem, AuditLog } from '@/types'
import { localStore } from '../dataStore'

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await api.get<{ data: NotificationItem[] }>('/notifications')
      return res.data.data
    } catch {
      return localStore.notifications
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch {
      const item = localStore.notifications.find((n) => n.id === id)
      if (item) item.read = true
    }
  },

  async clearAll(): Promise<void> {
    try {
      await api.delete('/notifications')
    } catch {
      localStore.notifications = []
    }
  },

  async getAuditLogs(module?: string): Promise<AuditLog[]> {
    try {
      const res = await api.get<{ data: AuditLog[] }>('/audit-logs', { params: { module } })
      return res.data.data
    } catch {
      if (!module || module === 'all') return localStore.auditLogs
      return localStore.auditLogs.filter((l) => l.module.toLowerCase() === module.toLowerCase())
    }
  },
}
