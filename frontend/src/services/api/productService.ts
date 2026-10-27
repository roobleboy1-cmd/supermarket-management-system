import api from './client'
import type { Product, StockMovement, PaginatedResponse } from '@/types'
import { localStore } from '../dataStore'

export interface GetProductsParams {
  search?: string
  categoryId?: string
  brandId?: string
  status?: string
  lowStockOnly?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const productService = {
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      const res = await api.get<PaginatedResponse<Product>>('/products', { params })
      return res.data
    } catch {
      // Local fallback with real filtering, sorting, and pagination
      let filtered = [...localStore.products]

      if (params.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q) ||
            p.categoryName?.toLowerCase().includes(q)
        )
      }

      if (params.categoryId && params.categoryId !== 'all') {
        filtered = filtered.filter((p) => p.categoryId === params.categoryId)
      }

      if (params.brandId && params.brandId !== 'all') {
        filtered = filtered.filter((p) => p.brandId === params.brandId)
      }

      if (params.status && params.status !== 'all') {
        filtered = filtered.filter((p) => p.status === params.status)
      }

      if (params.lowStockOnly) {
        filtered = filtered.filter((p) => p.quantity <= p.minStockLevel)
      }

      // Sort
      const sortBy = params.sortBy || 'name'
      const sortOrder = params.sortOrder || 'asc'
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortBy] ?? ''
        const bVal = b[sortBy] ?? ''
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const total = filtered.length
      const totalPages = Math.ceil(total / pageSize)
      const start = (page - 1) * pageSize
      const items = filtered.slice(start, start + pageSize)

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      }
    }
  },

  async getProductById(id: string): Promise<Product> {
    try {
      const res = await api.get<{ data: Product }>(`/products/${id}`)
      return res.data.data
    } catch {
      const found = localStore.products.find((p) => p.id === id)
      if (!found) throw new Error('Product not found')
      return found
    }
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    // Check duplicate SKU or Barcode
    const skuExists = localStore.products.some((p) => p.sku.toLowerCase() === data.sku.toLowerCase())
    if (skuExists) throw new Error(`Product with SKU "${data.sku}" already exists.`)

    const barcodeExists = localStore.products.some((p) => p.barcode === data.barcode)
    if (barcodeExists) throw new Error(`Product with Barcode "${data.barcode}" already exists.`)

    try {
      const res = await api.post<{ data: Product }>('/products', data)
      return res.data.data
    } catch {
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}`,
        categoryName: localStore.categories.find((c) => c.id === data.categoryId)?.name,
        brandName: localStore.brands.find((b) => b.id === data.brandId)?.name,
        supplierName: localStore.suppliers.find((s) => s.id === data.supplierId)?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localStore.products.unshift(newProduct)
      localStore.logAction('System / Staff', 'Inventory Manager', 'CREATE_PRODUCT', 'Products', `Created ${newProduct.name} (${newProduct.sku})`)
      return newProduct
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    // Validate duplicates excluding current product
    if (data.sku) {
      const skuExists = localStore.products.some((p) => p.id !== id && p.sku.toLowerCase() === data.sku!.toLowerCase())
      if (skuExists) throw new Error(`Another product with SKU "${data.sku}" already exists.`)
    }
    if (data.barcode) {
      const barcodeExists = localStore.products.some((p) => p.id !== id && p.barcode === data.barcode)
      if (barcodeExists) throw new Error(`Another product with Barcode "${data.barcode}" already exists.`)
    }

    try {
      const res = await api.put<{ data: Product }>(`/products/${id}`, data)
      return res.data.data
    } catch {
      const index = localStore.products.findIndex((p) => p.id === id)
      if (index === -1) throw new Error('Product not found')

      const updated = {
        ...localStore.products[index],
        ...data,
        categoryName: data.categoryId
          ? localStore.categories.find((c) => c.id === data.categoryId)?.name
          : localStore.products[index].categoryName,
        brandName: data.brandId
          ? localStore.brands.find((b) => b.id === data.brandId)?.name
          : localStore.products[index].brandName,
        supplierName: data.supplierId
          ? localStore.suppliers.find((s) => s.id === data.supplierId)?.name
          : localStore.products[index].supplierName,
        updatedAt: new Date().toISOString(),
      }
      localStore.products[index] = updated
      localStore.logAction('System / Staff', 'Inventory Manager', 'UPDATE_PRODUCT', 'Products', `Updated ${updated.name}`)
      return updated
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`/products/${id}`)
    } catch {
      const index = localStore.products.findIndex((p) => p.id === id)
      if (index !== -1) {
        const prod = localStore.products[index]
        localStore.products.splice(index, 1)
        localStore.logAction('System / Staff', 'Super Admin', 'DELETE_PRODUCT', 'Products', `Deleted ${prod.name}`)
      }
    }
  },

  async importProductsCsv(rows: Record<string, string>[]): Promise<{ importedCount: number; errors: string[] }> {
    try {
      const res = await api.post<{ data: { importedCount: number; errors: string[] } }>('/products/import', { rows })
      return res.data.data
    } catch {
      let count = 0
      const errors: string[] = []

      for (const row of rows) {
        const name = row['Name'] || row['name']
        const sku = row['SKU'] || row['sku']
        const barcode = row['Barcode'] || row['barcode']
        const costPrice = parseFloat(row['CostPrice'] || row['cost_price'] || '0')
        const sellingPrice = parseFloat(row['SellingPrice'] || row['selling_price'] || '0')
        const quantity = parseInt(row['Quantity'] || row['quantity'] || '0', 10)
        const unit = (row['Unit'] || row['unit'] || 'pcs') as any

        if (!name || !sku || !barcode) {
          errors.push(`Row missing required Name, SKU or Barcode: ${JSON.stringify(row)}`)
          continue
        }

        if (localStore.products.some((p) => p.sku === sku || p.barcode === barcode)) {
          errors.push(`Skipped duplicate SKU/Barcode: ${sku} / ${barcode}`)
          continue
        }

        localStore.products.push({
          id: `prod-csv-${Date.now()}-${count}`,
          name,
          sku,
          barcode,
          unit,
          costPrice: isNaN(costPrice) ? 0 : costPrice,
          sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
          quantity: isNaN(quantity) ? 0 : quantity,
          minStockLevel: 10,
          categoryId: localStore.categories[0]?.id || 'cat-1',
          categoryName: localStore.categories[0]?.name || 'General',
          trackExpiry: false,
          taxRate: 5,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        count++
      }

      return { importedCount: count, errors }
    }
  },

  async getMovements(productId: string): Promise<StockMovement[]> {
    try {
      const res = await api.get<{ data: StockMovement[] }>(`/products/${productId}/movements`)
      return res.data.data
    } catch {
      return localStore.stockMovements.filter((m) => m.productId === productId)
    }
  },
}
