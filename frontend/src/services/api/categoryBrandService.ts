import api from './client'
import type { Category, Brand } from '@/types'
import { localStore } from '../dataStore'

export const categoryBrandService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await api.get<{ data: Category[] }>('/categories')
      return res.data.data
    } catch {
      return localStore.categories.map((c) => ({
        ...c,
        productCount: localStore.products.filter((p) => p.categoryId === c.id).length,
      }))
    }
  },

  async createCategory(data: { name: string; code: string; description?: string }): Promise<Category> {
    try {
      const res = await api.post<{ data: Category }>('/categories', data)
      return res.data.data
    } catch {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        productCount: 0,
        createdAt: new Date().toISOString(),
      }
      localStore.categories.push(newCat)
      return newCat
    }
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    try {
      const res = await api.put<{ data: Category }>(`/categories/${id}`, data)
      return res.data.data
    } catch {
      const idx = localStore.categories.findIndex((c) => c.id === id)
      if (idx === -1) throw new Error('Category not found')
      const updated = { ...localStore.categories[idx], ...data }
      localStore.categories[idx] = updated
      return updated
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`)
    } catch {
      const idx = localStore.categories.findIndex((c) => c.id === id)
      if (idx !== -1) localStore.categories.splice(idx, 1)
    }
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    try {
      const res = await api.get<{ data: Brand[] }>('/brands')
      return res.data.data
    } catch {
      return localStore.brands.map((b) => ({
        ...b,
        productCount: localStore.products.filter((p) => p.brandId === b.id).length,
      }))
    }
  },

  async createBrand(data: { name: string; code: string; description?: string; logo?: string }): Promise<Brand> {
    try {
      const res = await api.post<{ data: Brand }>('/brands', data)
      return res.data.data
    } catch {
      const newBrand: Brand = {
        id: `br-${Date.now()}`,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        logo: data.logo,
        productCount: 0,
        createdAt: new Date().toISOString(),
      }
      localStore.brands.push(newBrand)
      return newBrand
    }
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
    try {
      const res = await api.put<{ data: Brand }>(`/brands/${id}`, data)
      return res.data.data
    } catch {
      const idx = localStore.brands.findIndex((b) => b.id === id)
      if (idx === -1) throw new Error('Brand not found')
      const updated = { ...localStore.brands[idx], ...data }
      localStore.brands[idx] = updated
      return updated
    }
  },

  async deleteBrand(id: string): Promise<void> {
    try {
      await api.delete(`/brands/${id}`)
    } catch {
      const idx = localStore.brands.findIndex((b) => b.id === id)
      if (idx !== -1) localStore.brands.splice(idx, 1)
    }
  },
}
