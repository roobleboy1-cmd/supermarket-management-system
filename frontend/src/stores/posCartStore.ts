import { create } from 'zustand'
import type { CartItem, Customer, Product, SuspendedSale, PaymentSplit } from '@/types'

interface PosCartState {
  items: CartItem[]
  customer: Customer | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  couponCode: string
  notes: string
  suspendedSales: SuspendedSale[]
  selectedTaxRate: number // default 5%

  // Actions
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setCustomer: (customer: Customer | null) => void
  setDiscount: (type: 'percentage' | 'fixed', value: number) => void
  setCoupon: (code: string, discountValue: number, type?: 'percentage' | 'fixed') => void
  clearCoupon: () => void
  setNotes: (notes: string) => void
  setTaxRate: (rate: number) => void

  // Suspend & Resume
  suspendSale: () => SuspendedSale | null
  resumeSale: (id: string) => void
  deleteSuspendedSale: (id: string) => void

  // Computed totals
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTaxAmount: () => number
  getTotal: () => number
  getTotalItemCount: () => number
}

export const usePosCartStore = create<PosCartState>((set, get) => ({
  items: [],
  customer: null,
  discountType: 'percentage',
  discountValue: 0,
  couponCode: '',
  notes: '',
  suspendedSales: [],
  selectedTaxRate: 5,

  addItem: (product: Product, quantity: number = 1) => {
    const { items, selectedTaxRate } = get()
    const existingIndex = items.findIndex((i) => i.productId === product.id)

    if (existingIndex > -1) {
      const existing = items[existingIndex]
      const newQty = existing.quantity + quantity
      const subtotal = newQty * existing.unitPrice
      const taxAmount = (subtotal * existing.taxRate) / 100
      const total = subtotal + taxAmount

      const updated = [...items]
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal,
        taxAmount,
        total,
      }
      set({ items: updated })
    } else {
      const subtotal = quantity * product.sellingPrice
      const taxAmount = (subtotal * (product.taxRate ?? selectedTaxRate)) / 100
      const total = subtotal + taxAmount

      const newItem: CartItem = {
        id: `cart-item-${Date.now()}-${product.id}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        quantity,
        discount: 0,
        taxRate: product.taxRate ?? selectedTaxRate,
        taxAmount,
        subtotal,
        total,
        unit: product.unit,
        maxStock: product.quantity,
      }
      set({ items: [...items, newItem] })
    }
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { items } = get()
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    const updated = items.map((item) => {
      if (item.productId === productId) {
        const subtotal = quantity * item.unitPrice
        const taxAmount = (subtotal * item.taxRate) / 100
        return {
          ...item,
          quantity,
          subtotal,
          taxAmount,
          total: subtotal + taxAmount,
        }
      }
      return item
    })
    set({ items: updated })
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      discountValue: 0,
      couponCode: '',
      notes: '',
    })
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer })
  },

  setDiscount: (type: 'percentage' | 'fixed', value: number) => {
    set({ discountType: type, discountValue: Math.max(0, value) })
  },

  setCoupon: (code: string, discountValue: number, type: 'percentage' | 'fixed' = 'fixed') => {
    set({
      couponCode: code,
      discountType: type,
      discountValue,
    })
  },

  clearCoupon: () => {
    set({ couponCode: '', discountValue: 0 })
  },

  setNotes: (notes: string) => {
    set({ notes })
  },

  setTaxRate: (rate: number) => {
    set({ selectedTaxRate: rate })
  },

  suspendSale: () => {
    const { items, customer, notes, getSubtotal, getDiscountAmount, getTaxAmount, getTotal } = get()
    if (items.length === 0) return null

    const suspended: SuspendedSale = {
      id: `hold-${Date.now()}`,
      holdReference: `HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer,
      items: [...items],
      subtotal: getSubtotal(),
      discountAmount: getDiscountAmount(),
      taxAmount: getTaxAmount(),
      total: getTotal(),
      notes,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      suspendedSales: [suspended, ...state.suspendedSales],
      items: [],
      customer: null,
      discountValue: 0,
      couponCode: '',
      notes: '',
    }))

    return suspended
  },

  resumeSale: (id: string) => {
    const { suspendedSales } = get()
    const target = suspendedSales.find((s) => s.id === id)
    if (!target) return

    set({
      items: target.items,
      customer: target.customer || null,
      notes: target.notes || '',
      suspendedSales: suspendedSales.filter((s) => s.id !== id),
    })
  },

  deleteSuspendedSale: (id: string) => {
    set((state) => ({
      suspendedSales: state.suspendedSales.filter((s) => s.id !== id),
    }))
  },

  getSubtotal: () => {
    return get().items.reduce((acc, i) => acc + i.subtotal, 0)
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal()
    const { discountType, discountValue } = get()
    if (discountValue <= 0) return 0
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100
    }
    return Math.min(discountValue, subtotal)
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getDiscountAmount()
    const taxableAmount = Math.max(0, subtotal - discount)
    const { selectedTaxRate } = get()
    return (taxableAmount * selectedTaxRate) / 100
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getDiscountAmount()
    const tax = get().getTaxAmount()
    return Math.max(0, subtotal - discount + tax)
  },

  getTotalItemCount: () => {
    return get().items.reduce((acc, i) => acc + i.quantity, 0)
  },
}))
