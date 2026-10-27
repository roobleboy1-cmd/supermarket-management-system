import api from './client'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import { localStore } from '../dataStore'

export const expenseService = {
  async getExpenses(category?: string): Promise<Expense[]> {
    try {
      const res = await api.get<{ data: Expense[] }>('/expenses', { params: { category } })
      return res.data.data
    } catch {
      if (!category || category === 'all') return localStore.expenses
      return localStore.expenses.filter((e) => e.category === category)
    }
  },

  async createExpense(data: {
    title: string
    category: ExpenseCategory
    amount: number
    paymentMethod: PaymentMethod
    expenseDate: string
    paidTo: string
    receiptReference?: string
    notes?: string
    recordedBy: string
  }): Promise<Expense> {
    try {
      const res = await api.post<{ data: Expense }>('/expenses', data)
      return res.data.data
    } catch {
      const newExp: Expense = {
        ...data,
        id: `exp-${Date.now()}`,
        expenseNumber: `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
      }
      localStore.expenses.unshift(newExp)
      localStore.logAction(data.recordedBy, 'Accountant', 'RECORD_EXPENSE', 'Expenses', `Recorded expense ${newExp.expenseNumber} ($${data.amount.toFixed(2)}) for ${data.title}`)
      return newExp
    }
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await api.delete(`/expenses/${id}`)
    } catch {
      const idx = localStore.expenses.findIndex((e) => e.id === id)
      if (idx !== -1) localStore.expenses.splice(idx, 1)
    }
  },
}
