import api from './client'
import type { Promotion, Coupon } from '@/types'
import { localStore } from '../dataStore'

export const promotionService = {
  async getPromotions(): Promise<Promotion[]> {
    try {
      const res = await api.get<{ data: Promotion[] }>('/promotions')
      return res.data.data
    } catch {
      return localStore.promotions
    }
  },

  async createPromotion(data: Omit<Promotion, 'id' | 'createdAt'>): Promise<Promotion> {
    try {
      const res = await api.post<{ data: Promotion }>('/promotions', data)
      return res.data.data
    } catch {
      const newPromo: Promotion = {
        ...data,
        id: `promo-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      localStore.promotions.push(newPromo)
      return newPromo
    }
  },

  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await api.get<{ data: Coupon[] }>('/promotions/coupons')
      return res.data.data
    } catch {
      return localStore.coupons
    }
  },

  async createCoupon(data: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed' | 'status'>): Promise<Coupon> {
    try {
      const res = await api.post<{ data: Coupon }>('/promotions/coupons', data)
      return res.data.data
    } catch {
      const exists = localStore.coupons.some((c) => c.code.toUpperCase() === data.code.toUpperCase())
      if (exists) throw new Error(`Coupon with code ${data.code} already exists.`)

      const newCoupon: Coupon = {
        ...data,
        id: `coup-${Date.now()}`,
        code: data.code.toUpperCase(),
        timesUsed: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      localStore.coupons.push(newCoupon)
      return newCoupon
    }
  },

  async validateCoupon(code: string, currentTotal: number): Promise<{ isValid: boolean; discountAmount: number; coupon?: Coupon; reason?: string }> {
    try {
      const res = await api.post('/promotions/coupons/validate', { code, currentTotal })
      return res.data.data
    } catch {
      const coupon = localStore.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase())
      if (!coupon) return { isValid: false, discountAmount: 0, reason: 'Coupon code not found' }
      if (coupon.status !== 'active') return { isValid: false, discountAmount: 0, reason: 'Coupon is expired or inactive' }
      if (coupon.timesUsed >= coupon.usageLimit) return { isValid: false, discountAmount: 0, reason: 'Coupon usage limit reached' }
      if (currentTotal < coupon.minSpend) {
        return { isValid: false, discountAmount: 0, reason: `Minimum order spend of $${coupon.minSpend.toFixed(2)} required` }
      }

      let discount = coupon.discountType === 'percentage'
        ? (currentTotal * coupon.discountValue) / 100
        : coupon.discountValue

      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }

      return {
        isValid: true,
        discountAmount: Math.round(discount * 100) / 100,
        coupon,
      }
    }
  },
}
