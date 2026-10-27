import api from './client'
import type { Sale, SalesReturn, ReturnItem, PaymentMethod } from '@/types'
import { localStore } from '../dataStore'

export interface GetSalesParams {
  search?: string
  cashierId?: string
  paymentMethod?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export const salesService = {
  async getSales(params: GetSalesParams = {}): Promise<{ items: Sale[]; total: number }> {
    try {
      const res = await api.get<{ data: { items: Sale[]; total: number } }>('/sales', { params })
      return res.data.data
    } catch {
      let filtered = [...localStore.sales]

      if (params.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter(
          (s) =>
            s.invoiceNumber.toLowerCase().includes(q) ||
            s.cashierName.toLowerCase().includes(q) ||
            s.customerName?.toLowerCase().includes(q) ||
            s.customerPhone?.includes(q)
        )
      }

      if (params.cashierId && params.cashierId !== 'all') {
        filtered = filtered.filter((s) => s.cashierId === params.cashierId)
      }

      if (params.paymentMethod && params.paymentMethod !== 'all') {
        filtered = filtered.filter((s) => s.payments.some((p) => p.method === params.paymentMethod))
      }

      return {
        items: filtered,
        total: filtered.length,
      }
    }
  },

  async getSaleById(id: string): Promise<Sale> {
    try {
      const res = await api.get<{ data: Sale }>(`/sales/${id}`)
      return res.data.data
    } catch {
      const sale = localStore.sales.find((s) => s.id === id || s.invoiceNumber === id)
      if (!sale) throw new Error('Sale not found')
      return sale
    }
  },

  async voidSale(id: string, reason: string, authorizedBy: string): Promise<Sale> {
    try {
      const res = await api.post<{ data: Sale }>(`/sales/${id}/void`, { reason, authorizedBy })
      return res.data.data
    } catch {
      const sale = localStore.sales.find((s) => s.id === id || s.invoiceNumber === id)
      if (!sale) throw new Error('Sale not found')
      if (sale.paymentStatus === 'voided') throw new Error('Sale is already voided')

      sale.paymentStatus = 'voided'
      sale.notes = (sale.notes ? sale.notes + '\n' : '') + `[VOIDED by ${authorizedBy}]: ${reason}`

      // Revert product quantities
      for (const item of sale.items) {
        const prod = localStore.products.find((p) => p.id === item.productId)
        if (prod) {
          const prev = prod.quantity
          prod.quantity += item.quantity
          localStore.stockMovements.unshift({
            id: `sm-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            type: 'return',
            quantityChange: item.quantity,
            previousQty: prev,
            newQty: prod.quantity,
            reason: `Sale Voided (${reason})`,
            referenceNo: sale.invoiceNumber,
            performedBy: authorizedBy,
            createdAt: new Date().toISOString(),
          })
        }
      }

      localStore.logAction(authorizedBy, 'Manager', 'VOID_SALE', 'Sales', `Voided sale ${sale.invoiceNumber}: ${reason}`)
      return sale
    }
  },

  // Returns and Refunds
  async getReturns(): Promise<SalesReturn[]> {
    try {
      const res = await api.get<{ data: SalesReturn[] }>('/sales/returns')
      return res.data.data
    } catch {
      return localStore.returns
    }
  },

  async createReturn(payload: {
    originalInvoiceNumber: string
    saleId: string
    items: ReturnItem[]
    refundMethod: PaymentMethod
    notes?: string
    inspectedBy: string
  }): Promise<SalesReturn> {
    try {
      const res = await api.post<{ data: SalesReturn }>('/sales/returns', payload)
      return res.data.data
    } catch {
      const sale = localStore.sales.find((s) => s.invoiceNumber === payload.originalInvoiceNumber)
      const totalRefundAmount = payload.items.reduce((sum, item) => sum + item.refundAmount, 0)

      const newReturn: SalesReturn = {
        id: `ret-${Date.now()}`,
        returnNumber: `RET-2026-${Math.floor(100 + Math.random() * 900)}`,
        originalInvoiceNumber: payload.originalInvoiceNumber,
        saleId: payload.saleId || (sale ? sale.id : `sale-${Date.now()}`),
        customerName: sale?.customerName,
        customerPhone: sale?.customerPhone,
        items: payload.items,
        totalRefundAmount,
        refundMethod: payload.refundMethod,
        refundStatus: 'pending_approval',
        inspectedBy: payload.inspectedBy,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      }

      localStore.returns.unshift(newReturn)
      localStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'New Refund Approval Request',
        message: `Return ${newReturn.returnNumber} for $${totalRefundAmount.toFixed(2)} submitted by ${payload.inspectedBy}.`,
        type: 'refund',
        read: false,
        actionUrl: '/returns',
        createdAt: new Date().toISOString(),
      })

      localStore.logAction(
        payload.inspectedBy,
        'Cashier',
        'SUBMIT_RETURN',
        'Returns',
        `Submitted return request ${newReturn.returnNumber} for $${totalRefundAmount.toFixed(2)}`
      )

      return newReturn
    }
  },

  async approveRefund(returnId: string, approvedBy: string): Promise<SalesReturn> {
    try {
      const res = await api.post<{ data: SalesReturn }>(`/sales/returns/${returnId}/approve`, { approvedBy })
      return res.data.data
    } catch {
      const ret = localStore.returns.find((r) => r.id === returnId)
      if (!ret) throw new Error('Return not found')

      ret.refundStatus = 'approved'
      ret.approvedBy = approvedBy

      // Note per requirement:
      // "Returned goods must not automatically become sellable inventory until the backend records the appropriate inspection and authorization result."
      // Only items flagged with returnToInventory = true return to active stock!
      for (const item of ret.items) {
        if (item.returnToInventory) {
          const prod = localStore.products.find((p) => p.id === item.productId)
          if (prod) {
            const prev = prod.quantity
            prod.quantity += item.quantity
            localStore.stockMovements.unshift({
              id: `sm-${Date.now()}-${item.productId}`,
              productId: prod.id,
              productName: prod.name,
              type: 'return',
              quantityChange: item.quantity,
              previousQty: prev,
              newQty: prod.quantity,
              reason: `Approved return ${ret.returnNumber} (Passed quality inspection)`,
              referenceNo: ret.returnNumber,
              performedBy: approvedBy,
              createdAt: new Date().toISOString(),
            })
          }
        }
      }

      localStore.logAction(
        approvedBy,
        'Manager',
        'APPROVE_REFUND',
        'Returns',
        `Approved refund ${ret.returnNumber} for $${ret.totalRefundAmount.toFixed(2)}`
      )

      return ret
    }
  },

  async rejectRefund(returnId: string, rejectedBy: string, reason: string): Promise<SalesReturn> {
    try {
      const res = await api.post<{ data: SalesReturn }>(`/sales/returns/${returnId}/reject`, { rejectedBy, reason })
      return res.data.data
    } catch {
      const ret = localStore.returns.find((r) => r.id === returnId)
      if (!ret) throw new Error('Return not found')

      ret.refundStatus = 'rejected'
      ret.notes = (ret.notes ? ret.notes + '\n' : '') + `[REJECTED by ${rejectedBy}]: ${reason}`

      localStore.logAction(
        rejectedBy,
        'Manager',
        'REJECT_REFUND',
        'Returns',
        `Rejected refund ${ret.returnNumber}: ${reason}`
      )

      return ret
    }
  },
}
