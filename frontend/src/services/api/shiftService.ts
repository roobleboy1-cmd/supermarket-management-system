import api from './client'
import type { CashierShift, CashMovement, CashMovementType } from '@/types'
import { localStore } from '../dataStore'

export const shiftService = {
  async getCurrentShift(): Promise<CashierShift | null> {
    try {
      const res = await api.get<{ data: CashierShift | null }>('/shifts/current')
      return res.data.data
    } catch {
      return localStore.currentShift
    }
  },

  async openShift(openingCash: number, cashierId: string, cashierName: string): Promise<CashierShift> {
    try {
      const res = await api.post<{ data: CashierShift }>('/shifts/open', { openingCash, cashierId, cashierName })
      return res.data.data
    } catch {
      if (localStore.currentShift && localStore.currentShift.status === 'open') {
        throw new Error('An active cashier shift is already open. Please close the active shift first.')
      }

      const shiftNumber = `SH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`
      const newShift: CashierShift = {
        id: `shift-${Date.now()}`,
        shiftNumber,
        cashierId,
        cashierName,
        status: 'open',
        openingTime: new Date().toISOString(),
        openingCash,
        totalSales: 0,
        cashSales: 0,
        cardSales: 0,
        mobileSales: 0,
        cashIn: 0,
        cashOut: 0,
        expectedClosingCash: openingCash,
        movements: [
          {
            id: `mov-${Date.now()}`,
            shiftId: `shift-${Date.now()}`,
            type: 'drawer_start',
            amount: openingCash,
            reason: 'Opening cash float',
            authorizedBy: cashierName,
            createdAt: new Date().toISOString(),
          },
        ],
      }

      localStore.currentShift = newShift
      localStore.logAction(cashierName, 'Cashier', 'OPEN_SHIFT', 'Cashier Shifts', `Opened shift ${shiftNumber} with $${openingCash.toFixed(2)} float`)
      return newShift
    }
  },

  async addCashMovement(
    shiftId: string,
    payload: {
      type: CashMovementType
      amount: number
      reason: string
      authorizedBy: string
    }
  ): Promise<CashMovement> {
    try {
      const res = await api.post<{ data: CashMovement }>(`/shifts/${shiftId}/cash-movement`, payload)
      return res.data.data
    } catch {
      const shift = localStore.currentShift
      if (!shift || shift.id !== shiftId) throw new Error('Active shift not found')

      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        shiftId,
        type: payload.type,
        amount: payload.amount,
        reason: payload.reason,
        authorizedBy: payload.authorizedBy,
        createdAt: new Date().toISOString(),
      }

      shift.movements.push(movement)
      if (payload.type === 'pay_in') {
        shift.cashIn += payload.amount
        shift.expectedClosingCash += payload.amount
      } else if (payload.type === 'drop_out') {
        shift.cashOut += payload.amount
        shift.expectedClosingCash -= payload.amount
      }

      localStore.logAction(
        payload.authorizedBy,
        'Manager',
        'CASH_MOVEMENT',
        'Cashier Shifts',
        `${payload.type.toUpperCase()}: $${payload.amount.toFixed(2)} (${payload.reason})`
      )

      return movement
    }
  },

  async closeShift(
    shiftId: string,
    actualClosingCash: number,
    notes?: string
  ): Promise<CashierShift> {
    try {
      const res = await api.post<{ data: CashierShift }>(`/shifts/${shiftId}/close`, { actualClosingCash, notes })
      return res.data.data
    } catch {
      const shift = localStore.currentShift
      if (!shift || shift.id !== shiftId) throw new Error('Shift not found')

      const discrepancy = actualClosingCash - shift.expectedClosingCash
      shift.actualClosingCash = actualClosingCash
      shift.discrepancy = discrepancy
      shift.status = 'pending_approval' // awaits manager approval
      shift.closingTime = new Date().toISOString()
      shift.notes = notes

      localStore.shiftHistory.unshift({ ...shift })

      localStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Shift Closing Pending Approval',
        message: `Shift ${shift.shiftNumber} closed by ${shift.cashierName}. Discrepancy: ${discrepancy >= 0 ? '+' : ''}$${discrepancy.toFixed(2)}.`,
        type: 'shift',
        read: false,
        actionUrl: '/shifts',
        createdAt: new Date().toISOString(),
      })

      localStore.logAction(
        shift.cashierName,
        'Cashier',
        'CLOSE_SHIFT',
        'Cashier Shifts',
        `Closed shift ${shift.shiftNumber}. Expected: $${shift.expectedClosingCash.toFixed(2)}, Actual: $${actualClosingCash.toFixed(2)}`
      )

      return shift
    }
  },

  async approveShift(shiftId: string, approvedBy: string): Promise<CashierShift> {
    try {
      const res = await api.post<{ data: CashierShift }>(`/shifts/${shiftId}/approve`, { approvedBy })
      return res.data.data
    } catch {
      let target = localStore.shiftHistory.find((s) => s.id === shiftId)
      if (!target && localStore.currentShift?.id === shiftId) {
        target = localStore.currentShift
      }
      if (!target) throw new Error('Shift not found')

      target.status = 'closed'
      target.approvedBy = approvedBy
      if (localStore.currentShift?.id === shiftId) {
        localStore.currentShift = null // cleared for next shift
      }

      localStore.logAction(approvedBy, 'Manager', 'APPROVE_SHIFT', 'Cashier Shifts', `Approved shift reconciliation for ${target.shiftNumber}`)
      return target
    }
  },

  async getShifts(): Promise<CashierShift[]> {
    try {
      const res = await api.get<{ data: CashierShift[] }>('/shifts')
      return res.data.data
    } catch {
      const all = [...localStore.shiftHistory]
      if (localStore.currentShift && !all.some((s) => s.id === localStore.currentShift!.id)) {
        all.unshift(localStore.currentShift)
      }
      return all
    }
  },
}
