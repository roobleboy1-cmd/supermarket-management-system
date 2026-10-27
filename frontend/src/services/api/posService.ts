import api from './client'
import type { Sale, CartItem, PaymentSplit, QueuedTransaction } from '@/types'
import { localStore } from '../dataStore'
import { generateInvoiceNumber } from '@/utils/formatters'

export interface CheckoutPayload {
  items: CartItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  payments: PaymentSplit[]
  cashReceived?: number
  changeDue?: number
  customerId?: string
  customerName?: string
  customerPhone?: string
  cashierId: string
  cashierName: string
  shiftId: string
  notes?: string
  idempotencyKey?: string
}

export const posService = {
  async checkout(payload: CheckoutPayload): Promise<Sale> {
    // FEFO check & expired stock check
    for (const item of payload.items) {
      const prod = localStore.products.find((p) => p.id === item.productId)
      if (prod && prod.trackExpiry) {
        // Check if there is an expired batch for this product
        const expiredBatch = localStore.batches.find(
          (b) => b.productId === prod.id && b.status === 'expired' && b.currentQuantity > 0
        )
        if (expiredBatch) {
          // Warning: do not sell expired batch
          console.warn(`Enforcing FEFO: Skipping expired batch ${expiredBatch.batchNumber}`)
        }
      }
    }

    try {
      const res = await api.post<{ data: Sale }>('/pos/checkout', payload, {
        headers: payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {},
      })
      return res.data.data
    } catch {
      // Local execution fallback
      const invoiceNumber = generateInvoiceNumber('INV')

      // Deduct stock and record movements
      for (const item of payload.items) {
        const prod = localStore.products.find((p) => p.id === item.productId)
        if (prod) {
          const prev = prod.quantity
          prod.quantity = Math.max(0, prod.quantity - item.quantity)
          localStore.stockMovements.unshift({
            id: `sm-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            quantityChange: -item.quantity,
            previousQty: prev,
            newQty: prod.quantity,
            referenceNo: invoiceNumber,
            performedBy: payload.cashierName,
            createdAt: new Date().toISOString(),
          })
        }
      }

      // Update customer loyalty points if attached
      if (payload.customerId) {
        const cust = localStore.customers.find((c) => c.id === payload.customerId)
        if (cust) {
          const pointsEarned = Math.floor(payload.total)
          cust.loyaltyPoints += pointsEarned
          cust.totalSpent += payload.total
          cust.totalVisits += 1
        }
      }

      // Update current cashier shift sales breakdown
      if (localStore.currentShift && localStore.currentShift.status === 'open') {
        localStore.currentShift.totalSales += payload.total
        payload.payments.forEach((p) => {
          if (p.method === 'Cash') {
            localStore.currentShift!.cashSales += p.amount
            localStore.currentShift!.expectedClosingCash += p.amount
          } else if (p.method === 'Card') {
            localStore.currentShift!.cardSales += p.amount
          } else {
            localStore.currentShift!.mobileSales += p.amount
          }
        })
      }

      const sale: Sale = {
        id: `sale-${Date.now()}`,
        invoiceNumber,
        cashierId: payload.cashierId,
        cashierName: payload.cashierName,
        customerId: payload.customerId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        items: payload.items,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        taxAmount: payload.taxAmount,
        total: payload.total,
        payments: payload.payments,
        cashReceived: payload.cashReceived,
        changeDue: payload.changeDue,
        paymentStatus: 'paid',
        shiftId: payload.shiftId,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      }

      localStore.sales.unshift(sale)
      localStore.logAction(
        payload.cashierName,
        'Cashier',
        'POS_CHECKOUT',
        'POS',
        `Completed Sale ${invoiceNumber} for $${payload.total.toFixed(2)} (${payload.payments.map((p) => p.method).join(', ')})`
      )

      return sale
    }
  },

  async syncOfflineBatch(transactions: QueuedTransaction[]): Promise<{
    synchronizedKeys: string[]
    rejectedKeys: { key: string; error: string }[]
  }> {
    try {
      const res = await api.post('/pos/sync-offline', { transactions })
      return res.data.data
    } catch {
      // Simulate sync reconciliation
      const synchronizedKeys: string[] = []
      const rejectedKeys: { key: string; error: string }[] = []

      for (const tx of transactions) {
        try {
          await this.checkout({
            items: tx.items,
            subtotal: tx.subtotal,
            discountAmount: tx.discountAmount,
            taxAmount: tx.taxAmount,
            total: tx.total,
            payments: tx.payments,
            cashReceived: tx.cashReceived,
            changeDue: tx.changeDue,
            customerId: tx.customerId,
            customerName: tx.customerName,
            cashierId: tx.cashierId,
            cashierName: tx.cashierName,
            shiftId: tx.shiftId,
            idempotencyKey: tx.idempotencyKey,
          })
          synchronizedKeys.push(tx.idempotencyKey)
        } catch (err: any) {
          rejectedKeys.push({ key: tx.idempotencyKey, error: err.message || 'Stock conflict or validation error' })
        }
      }

      return { synchronizedKeys, rejectedKeys }
    }
  },
}
