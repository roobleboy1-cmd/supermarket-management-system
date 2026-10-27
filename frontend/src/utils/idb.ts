import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { QueuedTransaction, Product } from '@/types'

interface SupermarketDBSchema extends DBSchema {
  queuedTransactions: {
    key: string
    value: QueuedTransaction
    indexes: { 'by-status': string; 'by-timestamp': string }
  }
  cachedProducts: {
    key: string
    value: Product
    indexes: { 'by-barcode': string; 'by-sku': string }
  }
  meta: {
    key: string
    value: any
  }
}

const DB_NAME = 'supermarket_pos_offline_db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<SupermarketDBSchema>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SupermarketDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('queuedTransactions')) {
          const txStore = db.createObjectStore('queuedTransactions', { keyPath: 'idempotencyKey' })
          txStore.createIndex('by-status', 'status')
          txStore.createIndex('by-timestamp', 'createdAt')
        }

        if (!db.objectStoreNames.contains('cachedProducts')) {
          const prodStore = db.createObjectStore('cachedProducts', { keyPath: 'id' })
          prodStore.createIndex('by-barcode', 'barcode')
          prodStore.createIndex('by-sku', 'sku')
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

export async function queueOfflineTransaction(transaction: QueuedTransaction): Promise<void> {
  const db = await getDB()
  await db.put('queuedTransactions', transaction)
}

export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
  const db = await getDB()
  return await db.getAll('queuedTransactions')
}

export async function updateQueuedTransactionStatus(
  idempotencyKey: string,
  status: 'pending' | 'synchronized' | 'rejected' | 'failed',
  errorMessage?: string
): Promise<void> {
  const db = await getDB()
  const tx = await db.get('queuedTransactions', idempotencyKey)
  if (tx) {
    tx.status = status
    if (errorMessage) tx.errorMessage = errorMessage
    tx.updatedAt = new Date().toISOString()
    await db.put('queuedTransactions', tx)
  }
}

export async function removeQueuedTransaction(idempotencyKey: string): Promise<void> {
  const db = await getDB()
  await db.delete('queuedTransactions', idempotencyKey)
}

export async function cacheProductsForOffline(products: Product[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('cachedProducts', 'readwrite')
  await tx.store.clear()
  for (const product of products) {
    await tx.store.put(product)
  }
  await tx.done
}

export async function getOfflineCachedProducts(): Promise<Product[]> {
  const db = await getDB()
  return await db.getAll('cachedProducts')
}

export async function getOfflineProductByBarcodeOrSku(term: string): Promise<Product | undefined> {
  const db = await getDB()
  const byBarcode = await db.getFromIndex('cachedProducts', 'by-barcode', term)
  if (byBarcode) return byBarcode
  const bySku = await db.getFromIndex('cachedProducts', 'by-sku', term)
  return bySku
}
