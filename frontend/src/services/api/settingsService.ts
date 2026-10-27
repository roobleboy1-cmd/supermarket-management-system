import api from './client'
import type { StoreSettings } from '@/types'
import { localStore } from '../dataStore'

export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    try {
      const res = await api.get<{ data: StoreSettings }>('/settings')
      return res.data.data
    } catch {
      return localStore.settings
    }
  },

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
      const res = await api.put<{ data: StoreSettings }>('/settings', data)
      return res.data.data
    } catch {
      localStore.settings = { ...localStore.settings, ...data }
      localStore.logAction('Admin', 'Super Admin', 'UPDATE_SETTINGS', 'Store Settings', 'Updated supermarket operational settings')
      return localStore.settings
    }
  },
}
