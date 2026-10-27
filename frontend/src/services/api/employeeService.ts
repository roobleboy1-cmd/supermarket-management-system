import api from './client'
import type { User, Role } from '@/types'
import { localStore } from '../dataStore'

export interface RolePermissions {
  role: Role
  canAccessPos: boolean
  canManageProducts: boolean
  canManageInventory: boolean
  canManagePurchases: boolean
  canProcessReturns: boolean
  canViewReports: boolean
  canManageEmployees: boolean
  canManageSettings: boolean
  canVoidSales: boolean
  canApproveRefunds: boolean
  canApproveShifts: boolean
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  'Super Admin': {
    role: 'Super Admin',
    canAccessPos: true,
    canManageProducts: true,
    canManageInventory: true,
    canManagePurchases: true,
    canProcessReturns: true,
    canViewReports: true,
    canManageEmployees: true,
    canManageSettings: true,
    canVoidSales: true,
    canApproveRefunds: true,
    canApproveShifts: true,
  },
  Manager: {
    role: 'Manager',
    canAccessPos: true,
    canManageProducts: true,
    canManageInventory: true,
    canManagePurchases: true,
    canProcessReturns: true,
    canViewReports: true,
    canManageEmployees: false,
    canManageSettings: false,
    canVoidSales: true,
    canApproveRefunds: true,
    canApproveShifts: true,
  },
  'Inventory Manager': {
    role: 'Inventory Manager',
    canAccessPos: false,
    canManageProducts: true,
    canManageInventory: true,
    canManagePurchases: true,
    canProcessReturns: false,
    canViewReports: true,
    canManageEmployees: false,
    canManageSettings: false,
    canVoidSales: false,
    canApproveRefunds: false,
    canApproveShifts: false,
  },
  Cashier: {
    role: 'Cashier',
    canAccessPos: true,
    canManageProducts: false,
    canManageInventory: false,
    canManagePurchases: false,
    canProcessReturns: true, // can initiate return
    canViewReports: false,
    canManageEmployees: false,
    canManageSettings: false,
    canVoidSales: false,
    canApproveRefunds: false,
    canApproveShifts: false,
  },
  Accountant: {
    role: 'Accountant',
    canAccessPos: false,
    canManageProducts: false,
    canManageInventory: false,
    canManagePurchases: true,
    canProcessReturns: false,
    canViewReports: true,
    canManageEmployees: false,
    canManageSettings: false,
    canVoidSales: false,
    canApproveRefunds: false,
    canApproveShifts: true,
  },
  Auditor: {
    role: 'Auditor',
    canAccessPos: false,
    canManageProducts: false,
    canManageInventory: true,
    canManagePurchases: false,
    canProcessReturns: false,
    canViewReports: true,
    canManageEmployees: false,
    canManageSettings: false,
    canVoidSales: false,
    canApproveRefunds: false,
    canApproveShifts: false,
  },
}

export const employeeService = {
  async getEmployees(): Promise<User[]> {
    try {
      const res = await api.get<{ data: User[] }>('/employees')
      return res.data.data
    } catch {
      return localStore.users
    }
  },

  async createEmployee(data: {
    name: string
    email: string
    role: Role
    phone?: string
    status: 'active' | 'inactive' | 'suspended'
  }): Promise<User> {
    try {
      const res = await api.post<{ data: User }>('/employees', data)
      return res.data.data
    } catch {
      const exists = localStore.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
      if (exists) throw new Error(`An employee with email ${data.email} already exists.`)

      const newEmp: User = {
        ...data,
        id: `u-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      localStore.users.push(newEmp)
      localStore.logAction('Admin', 'Super Admin', 'CREATE_EMPLOYEE', 'Employees', `Created staff account for ${newEmp.name} (${newEmp.role})`)
      return newEmp
    }
  },

  async updateEmployee(id: string, data: Partial<User>): Promise<User> {
    try {
      const res = await api.put<{ data: User }>(`/employees/${id}`, data)
      return res.data.data
    } catch {
      const idx = localStore.users.findIndex((u) => u.id === id)
      if (idx === -1) throw new Error('Employee not found')
      const updated = { ...localStore.users[idx], ...data }
      localStore.users[idx] = updated
      return updated
    }
  },

  async toggleStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<User> {
    try {
      const res = await api.patch<{ data: User }>(`/employees/${id}/status`, { status })
      return res.data.data
    } catch {
      const idx = localStore.users.findIndex((u) => u.id === id)
      if (idx === -1) throw new Error('Employee not found')
      localStore.users[idx].status = status
      return localStore.users[idx]
    }
  },

  getRolePermissions(role: Role): RolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['Cashier']
  },
}
