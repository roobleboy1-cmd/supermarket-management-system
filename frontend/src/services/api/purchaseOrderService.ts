import api from './client'
import type { PurchaseOrder, POLineItem } from '@/types'
import { localStore } from '../dataStore'

export const purchaseOrderService = {
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const res = await api.get<{ data: PurchaseOrder[] }>('/purchases')
      return res.data.data
    } catch {
      return localStore.purchaseOrders
    }
  },

  async getPOById(id: string): Promise<PurchaseOrder> {
    try {
      const res = await api.get<{ data: PurchaseOrder }>(`/purchases/${id}`)
      return res.data.data
    } catch {
      const po = localStore.purchaseOrders.find((p) => p.id === id || p.poNumber === id)
      if (!po) throw new Error('Purchase order not found')
      return po
    }
  },

  async createPO(payload: {
    supplierId: string
    items: { productId: string; quantityOrdered: number; unitCost: number }[]
    expectedDeliveryDate?: string
    notes?: string
    createdBy: string
  }): Promise<PurchaseOrder> {
    try {
      const res = await api.post<{ data: PurchaseOrder }>('/purchases', payload)
      return res.data.data
    } catch {
      const supplier = localStore.suppliers.find((s) => s.id === payload.supplierId)
      if (!supplier) throw new Error('Supplier not found')

      const lineItems: POLineItem[] = payload.items.map((item) => {
        const prod = localStore.products.find((p) => p.id === item.productId)
        return {
          productId: item.productId,
          productName: prod?.name || 'Item',
          sku: prod?.sku || 'SKU',
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unitCost: item.unitCost,
          subtotal: item.quantityOrdered * item.unitCost,
        }
      })

      const totalAmount = lineItems.reduce((acc, item) => acc + item.subtotal, 0)
      const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        status: 'ordered',
        items: lineItems,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        expectedDeliveryDate: payload.expectedDeliveryDate,
        notes: payload.notes,
        createdBy: payload.createdBy,
        createdAt: new Date().toISOString(),
      }

      localStore.purchaseOrders.unshift(newPO)
      supplier.currentBalance += totalAmount

      localStore.logAction(
        payload.createdBy,
        'Inventory Manager',
        'CREATE_PO',
        'Purchases',
        `Created ${poNumber} for supplier ${supplier.name} totaling $${totalAmount.toFixed(2)}`
      )

      return newPO
    }
  },

  async receivePOItems(
    poId: string,
    receivedQuantities: { productId: string; quantityReceivedNow: number }[],
    receivedBy: string
  ): Promise<PurchaseOrder> {
    try {
      const res = await api.post<{ data: PurchaseOrder }>(`/purchases/${poId}/receive`, {
        receivedQuantities,
        receivedBy,
      })
      return res.data.data
    } catch {
      const po = localStore.purchaseOrders.find((p) => p.id === poId)
      if (!po) throw new Error('Purchase order not found')

      let allComplete = true
      let anyReceived = false

      for (const rec of receivedQuantities) {
        const line = po.items.find((i) => i.productId === rec.productId)
        if (line && rec.quantityReceivedNow > 0) {
          line.quantityReceived += rec.quantityReceivedNow
          anyReceived = true

          // Update inventory stock now that goods are confirmed received
          const prod = localStore.products.find((p) => p.id === rec.productId)
          if (prod) {
            const prev = prod.quantity
            prod.quantity += rec.quantityReceivedNow
            // Update cost price to latest received cost if available
            prod.costPrice = line.unitCost
            prod.updatedAt = new Date().toISOString()

            localStore.stockMovements.unshift({
              id: `sm-${Date.now()}-${rec.productId}`,
              productId: prod.id,
              productName: prod.name,
              type: 'purchase',
              quantityChange: rec.quantityReceivedNow,
              previousQty: prev,
              newQty: prod.quantity,
              reason: `Received from ${po.poNumber} (${po.supplierName})`,
              referenceNo: po.poNumber,
              performedBy: receivedBy,
              createdAt: new Date().toISOString(),
            })
          }
        }
      }

      for (const item of po.items) {
        if (item.quantityReceived < item.quantityOrdered) {
          allComplete = false
          break
        }
      }

      po.status = allComplete ? 'received' : anyReceived ? 'partially_received' : po.status
      if (allComplete) po.receivedAt = new Date().toISOString()

      localStore.logAction(
        receivedBy,
        'Inventory Manager',
        'RECEIVE_PO',
        'Purchases',
        `Received items for ${po.poNumber} (Status: ${po.status})`
      )

      return po
    }
  },

  async cancelPO(poId: string, cancelledBy: string, reason: string): Promise<PurchaseOrder> {
    try {
      const res = await api.post<{ data: PurchaseOrder }>(`/purchases/${poId}/cancel`, { cancelledBy, reason })
      return res.data.data
    } catch {
      const po = localStore.purchaseOrders.find((p) => p.id === poId)
      if (!po) throw new Error('Purchase order not found')
      po.status = 'cancelled'
      po.notes = (po.notes ? po.notes + '\n' : '') + `[CANCELLED by ${cancelledBy}]: ${reason}`

      localStore.logAction(cancelledBy, 'Manager', 'CANCEL_PO', 'Purchases', `Cancelled ${po.poNumber}: ${reason}`)
      return po
    }
  },
}
