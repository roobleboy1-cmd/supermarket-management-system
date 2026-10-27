import api from './client'
import type { Supplier } from '@/types'
import { localStore } from '../dataStore'

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const res = await api.get<{ data: Supplier[] }>('/suppliers')
      return res.data.data
    } catch {
      return localStore.suppliers
    }
  },

  async getSupplierById(id: string): Promise<Supplier> {
    try {
      const res = await api.get<{ data: Supplier }>(`/suppliers/${id}`)
      return res.data.data
    } catch {
      const sup = localStore.suppliers.find((s) => s.id === id)
      if (!sup) throw new Error('Supplier not found')
      return sup
    }
  },

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'currentBalance'>): Promise<Supplier> {
    try {
      const res = await api.post<{ data: Supplier }>('/suppliers', data)
      return res.data.data
    } catch {
      const newSup: Supplier = {
        ...data,
        id: `sup-${Date.now()}`,
        currentBalance: 0,
        createdAt: new Date().toISOString(),
      }
      localStore.suppliers.push(newSup)
      localStore.logAction('Staff', 'Inventory Manager', 'CREATE_SUPPLIER', 'Suppliers', `Created supplier ${newSup.name}`)
      return newSup
    }
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    try {
      const res = await api.put<{ data: Supplier }>(`/suppliers/${id}`, data)
      return res.data.data
    } catch {
      const idx = localStore.suppliers.findIndex((s) => s.id === id)
      if (idx === -1) throw new Error('Supplier not found')
      const updated = { ...localStore.suppliers[idx], ...data }
      localStore.suppliers[idx] = updated
      return updated
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    try {
      await api.delete(`/suppliers/${id}`)
    } catch {
      const idx = localStore.suppliers.findIndex((s) => s.id === id)
      if (idx !== -1) localStore.suppliers.splice(idx, 1)
    }
  },
}
