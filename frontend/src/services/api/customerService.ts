import api from './client'
import type { Customer, LoyaltyTransaction } from '@/types'
import { localStore } from '../dataStore'

export const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    try {
      const res = await api.get<{ data: Customer[] }>('/customers', { params: { search } })
      return res.data.data
    } catch {
      if (!search) return localStore.customers
      const q = search.toLowerCase()
      return localStore.customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)
      )
    }
  },

  async getCustomerById(id: string): Promise<Customer> {
    try {
      const res = await api.get<{ data: Customer }>(`/customers/${id}`)
      return res.data.data
    } catch {
      const cust = localStore.customers.find((c) => c.id === id)
      if (!cust) throw new Error('Customer not found')
      return cust
    }
  },

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'tier' | 'totalSpent' | 'totalVisits'>): Promise<Customer> {
    try {
      const res = await api.post<{ data: Customer }>('/customers', data)
      return res.data.data
    } catch {
      const newCust: Customer = {
        ...data,
        id: `cust-${Date.now()}`,
        loyaltyPoints: 0,
        tier: 'Standard',
        totalSpent: 0,
        totalVisits: 0,
        createdAt: new Date().toISOString(),
      }
      localStore.customers.unshift(newCust)
      return newCust
    }
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const res = await api.put<{ data: Customer }>(`/customers/${id}`, data)
      return res.data.data
    } catch {
      const idx = localStore.customers.findIndex((c) => c.id === id)
      if (idx === -1) throw new Error('Customer not found')
      const updated = { ...localStore.customers[idx], ...data }
      localStore.customers[idx] = updated
      return updated
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      await api.delete(`/customers/${id}`)
    } catch {
      const idx = localStore.customers.findIndex((c) => c.id === id)
      if (idx !== -1) localStore.customers.splice(idx, 1)
    }
  },

  async getLoyaltyHistory(customerId: string): Promise<LoyaltyTransaction[]> {
    try {
      const res = await api.get<{ data: LoyaltyTransaction[] }>(`/customers/${customerId}/loyalty`)
      return res.data.data
    } catch {
      const cust = localStore.customers.find((c) => c.id === customerId)
      return [
        {
          id: 'lt-1',
          customerId,
          type: 'earned',
          points: 12,
          balanceAfter: cust?.loyaltyPoints || 340,
          invoiceNumber: 'INV-2026-00901',
          description: 'Points earned on transaction INV-2026-00901',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'lt-2',
          customerId,
          type: 'earned',
          points: 25,
          balanceAfter: (cust?.loyaltyPoints || 340) - 12,
          invoiceNumber: 'INV-2026-00840',
          description: 'Points earned on transaction INV-2026-00840',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
    }
  },
}
