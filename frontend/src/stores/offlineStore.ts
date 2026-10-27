import { create } from 'zustand'
import type { QueuedTransaction } from '@/types'
import {
  getQueuedTransactions,
  queueOfflineTransaction,
  updateQueuedTransactionStatus,
  removeQueuedTransaction,
} from '@/utils/idb'
import { posService } from '@/services/api/posService'

interface OfflineState {
  isOnline: boolean
  queuedTransactions: QueuedTransaction[]
  isSyncing: boolean
  lastSyncResult: { successCount: number; failedCount: number } | null
  init: () => Promise<void>
  refreshQueue: () => Promise<void>
  addOfflineSale: (transaction: QueuedTransaction) => Promise<void>
  syncTransactions: () => Promise<void>
  clearResolvedTransactions: () => Promise<void>
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queuedTransactions: [],
  isSyncing: false,
  lastSyncResult: null,

  init: async () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        set({ isOnline: true })
        // Attempt automatic background sync when online
        get().syncTransactions()
      })
      window.addEventListener('offline', () => {
        set({ isOnline: false })
      })
    }
    await get().refreshQueue()
  },

  refreshQueue: async () => {
    try {
      const list = await getQueuedTransactions()
      set({ queuedTransactions: list })
    } catch (e) {
      console.warn('IndexedDB not ready yet:', e)
    }
  },

  addOfflineSale: async (transaction: QueuedTransaction) => {
    await queueOfflineTransaction(transaction)
    await get().refreshQueue()
  },

  syncTransactions: async () => {
    const { isSyncing, refreshQueue } = get()
    if (isSyncing) return

    set({ isSyncing: true, lastSyncResult: null })
    try {
      const queue = await getQueuedTransactions()
      const pending = queue.filter((t) => t.status === 'pending' || t.status === 'failed')

      if (pending.length === 0) {
        set({ isSyncing: false })
        return
      }

      const { synchronizedKeys, rejectedKeys } = await posService.syncOfflineBatch(pending)

      for (const key of synchronizedKeys) {
        await updateQueuedTransactionStatus(key, 'synchronized')
      }

      for (const rej of rejectedKeys) {
        await updateQueuedTransactionStatus(rej.key, 'rejected', rej.error)
      }

      await refreshQueue()
      set({
        isSyncing: false,
        lastSyncResult: {
          successCount: synchronizedKeys.length,
          failedCount: rejectedKeys.length,
        },
      })
    } catch (err) {
      console.error('Offline sync failed:', err)
      set({ isSyncing: false })
    }
  },

  clearResolvedTransactions: async () => {
    const queue = await getQueuedTransactions()
    for (const tx of queue) {
      if (tx.status === 'synchronized') {
        await removeQueuedTransaction(tx.idempotencyKey)
      }
    }
    await get().refreshQueue()
  },
}))
