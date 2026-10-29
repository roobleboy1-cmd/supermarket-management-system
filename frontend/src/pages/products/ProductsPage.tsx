import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Download,
  Upload,
  Barcode,
  Edit,
  Trash2,
  History,
  FileSpreadsheet,
  AlertTriangle,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Card, CardContent } from '@/components/ui/Card'
import { BarcodeGeneratorModal } from '@/components/common/BarcodeGeneratorModal'
import { productService } from '@/services/api/productService'
import { categoryBrandService } from '@/services/api/categoryBrandService'
import { supplierService } from '@/services/api/supplierService'
import { exportToCsv, parseCsvFile } from '@/utils/exportCsv'
import { generateBarcode, formatCurrency, formatDate } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'
import type { Product, UnitOfMeasure, ProductStatus, StockMovement } from '@/types'

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error, warning } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters & Pagination State
  const [search, setSearch] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  // Modals
  const [isFormOpen, setIsFormOpen] = React.useState(searchParams.get('action') === 'new')
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [barcodeModalProduct, setBarcodeModalProduct] = React.useState<Product | null>(null)
  const [movementProduct, setMovementProduct] = React.useState<Product | null>(null)
  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = React.useState(false)

  // Form Fields State
  const [name, setName] = React.useState('')
  const [sku, setSku] = React.useState('')
  const [barcode, setBarcode] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selectedCat, setSelectedCat] = React.useState('')
  const [selectedBrand, setSelectedBrand] = React.useState('')
  const [selectedSupplier, setSelectedSupplier] = React.useState('')
  const [unit, setUnit] = React.useState<UnitOfMeasure>('pcs')
  const [costPrice, setCostPrice] = React.useState('1.00')
  const [sellingPrice, setSellingPrice] = React.useState('1.50')
  const [quantity, setQuantity] = React.useState('20')
  const [minStockLevel, setMinStockLevel] = React.useState('10')
  const [taxRate, setTaxRate] = React.useState('5')
  const [trackExpiry, setTrackExpiry] = React.useState(false)
  const [status, setStatus] = React.useState<ProductStatus>('active')
  const [formError, setFormError] = React.useState<string | null>(null)

  // CSV Import file input ref
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, categoryId, statusFilter, page, pageSize }],
    queryFn: () =>
      productService.getProducts({
        search,
        categoryId,
        status: statusFilter,
        page,
        pageSize,
      }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryBrandService.getCategories(),
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => categoryBrandService.getBrands(),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  })

  // Profit Margin calculation preview
  const numCost = parseFloat(costPrice) || 0
  const numPrice = parseFloat(sellingPrice) || 0
  const profitMargin = numPrice > 0 ? ((numPrice - numCost) / numPrice) * 100 : 0

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setName('')
    setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`)
    setBarcode(generateBarcode())
    setDescription('')
    setSelectedCat(categories?.[0]?.id || '')
    setSelectedBrand(brands?.[0]?.id || '')
    setSelectedSupplier(suppliers?.[0]?.id || '')
    setUnit('pcs')
    setCostPrice('1.00')
    setSellingPrice('1.50')
    setQuantity('25')
    setMinStockLevel('10')
    setTaxRate('5')
    setTrackExpiry(false)
    setStatus('active')
    setFormError(null)
    setIsFormOpen(true)
  }

  // Open Form for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.sku)
    setBarcode(p.barcode)
    setDescription(p.description || '')
    setSelectedCat(p.categoryId)
    setSelectedBrand(p.brandId || '')
    setSelectedSupplier(p.supplierId || '')
    setUnit(p.unit)
    setCostPrice(p.costPrice.toString())
    setSellingPrice(p.sellingPrice.toString())
    setQuantity(p.quantity.toString())
    setMinStockLevel(p.minStockLevel.toString())
    setTaxRate(p.taxRate.toString())
    setTrackExpiry(p.trackExpiry)
    setStatus(p.status)
    setFormError(null)
    setIsFormOpen(true)
  }

  // Submit Product Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (numPrice <= 0 || numCost < 0) {
      setFormError('Cost price must be ≥ 0 and selling price must be > 0.')
      return
    }

    const payload = {
      name,
      sku,
      barcode,
      description,
      categoryId: selectedCat || categories?.[0]?.id || 'cat-1',
      brandId: selectedBrand || undefined,
      supplierId: selectedSupplier || undefined,
      unit,
      costPrice: numCost,
      sellingPrice: numPrice,
      quantity: parseInt(quantity, 10) || 0,
      minStockLevel: parseInt(minStockLevel, 10) || 5,
      taxRate: parseFloat(taxRate) || 0,
      trackExpiry,
      status,
    }

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload)
        success('Product Updated', `${name} updated successfully`)
      } else {
        await productService.createProduct(payload)
        success('Product Created', `${name} added to catalog`)
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsFormOpen(false)
    } catch (err: any) {
      setFormError(err.message || 'Error saving product')
    }
  }

  // Delete / Archive Product
  const handleDeleteProduct = async (p: Product) => {
    if (confirm(`Are you sure you want to remove "${p.name}"?`)) {
      try {
        await productService.deleteProduct(p.id)
        queryClient.invalidateQueries({ queryKey: ['products'] })
        success('Product Removed', `${p.name} deleted`)
      } catch (err: any) {
        error('Delete Failed', err.message)
      }
    }
  }

  // Export to CSV
  const handleExportCsv = () => {
    if (!productsData?.items) return
    exportToCsv('products_catalog', productsData.items, [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'SKU', key: 'sku' },
      { header: 'Barcode', key: 'barcode' },
      { header: 'Category', key: 'categoryName' },
      { header: 'Unit', key: 'unit' },
      { header: 'CostPrice', key: 'costPrice' },
      { header: 'SellingPrice', key: 'sellingPrice' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'MinStock', key: 'minStockLevel' },
      { header: 'Status', key: 'status' },
    ])
  }

  // Import from CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rows = await parseCsvFile(file)
      const res = await productService.importProductsCsv(rows)
      success('CSV Import Completed', `Imported ${res.importedCount} new products`)
      if (res.errors.length > 0) {
        warning('Some Rows Skipped', `${res.errors.length} rows had duplicate or missing keys.`)
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err: any) {
      error('Import Error', err.message || 'Unable to parse CSV file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // View Stock Movement History
  const handleViewMovements = async (p: Product) => {
    setMovementProduct(p)
    setMovementsLoading(true)
    try {
      const res = await productService.getMovements(p.id)
      setMovements(res)
    } finally {
      setMovementsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Master Catalog"
        description="Comprehensive product catalog, barcode generation, inventory status, and CSV import/export"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Bulk CSV Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add New Product
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search products by title, SKU, barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setPage(1)
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31]"
              >
                <option value="all">All Categories</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-36">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FC] dark:bg-[#0B1220]/40 text-[#64748B] border-b border-[#E2E8F0] dark:border-[#263449] uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category / Brand</th>
                <th className="py-3 px-4">Pricing & Margin</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4">Barcode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#263449]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                    Loading products catalog...
                  </td>
                </tr>
              ) : productsData?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                    No products matched your search filter.
                  </td>
                </tr>
              ) : (
                productsData?.items.map((prod) => {
                  const marginPct =
                    prod.sellingPrice > 0
                      ? ((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100
                      : 0
                  const isLow = prod.quantity <= prod.minStockLevel

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-[#F5F7FC]/70 dark:hover:bg-[#172338]/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {prod.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#94A3B8]">SKU: {prod.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1E293B] dark:text-[#F8FAFC]">
                          {prod.categoryName || 'General'}
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">{prod.brandName || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          ${prod.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">
                          Cost: ${prod.costPrice.toFixed(2)} ({marginPct.toFixed(0)}% margin)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {prod.quantity} {prod.unit}
                        </div>
                        {isLow && (
                          <span className="text-[10px] text-amber-600 font-bold block">
                            Min: {prod.minStockLevel}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">
                        {prod.barcode}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            prod.status === 'active'
                              ? 'success'
                              : prod.status === 'archived'
                              ? 'secondary'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {prod.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setBarcodeModalProduct(prod)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                            title="Generate & Print Barcode Label"
                          >
                            <Barcode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewMovements(prod)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                            title="Stock Movement Ledger"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                            title="Remove Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {productsData && productsData.totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              Showing page {productsData.page} of {productsData.totalPages} ({productsData.total}{' '}
              total products)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= productsData.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Register New Product'}
        description="All fields are confirmed and validated by the backend"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Product Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Almarai Fresh Milk 1L"
              />
            </div>

            <Input
              label="SKU Code"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ALM-MILK-1L"
            />

            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#94A3B8] mb-1.5">
                Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#263449] bg-white dark:bg-[#111C31] font-mono"
                  placeholder="Barcode..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setBarcode(generateBarcode())}
                  title="Generate Random UPC/EAN Barcode"
                >
                  Generate
                </Button>
              </div>
            </div>

            <Select
              label="Category"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">None / Generic</option>
              {(brands || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>

            <Select
              label="Unit of Measurement"
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="litre">Litres (L)</option>
              <option value="ml">Millilitres (ml)</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="bottle">Bottle</option>
              <option value="carton">Carton</option>
            </Select>

            <Select
              label="Primary Supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">None selected</option>
              {(suppliers || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              required
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />

            <Input
              label="Selling Price ($)"
              type="number"
              step="0.01"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />

            {/* Profit Margin Preview Card */}
            <div className="md:col-span-2 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-300">
                Gross Profit Margin Preview:
              </span>
              <span className="font-bold text-sm text-blue-700 dark:text-[#06B6D4]">
                {profitMargin.toFixed(1)}% (${(numPrice - numCost).toFixed(2)} per unit)
              </span>
            </div>

            <Input
              label="Current Initial Quantity"
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              label="Minimum Stock Alert Level"
              type="number"
              required
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
            />

            <Input
              label="Tax Rate (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />

            <Select
              label="Catalog Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="active">Active (Sellable)</option>
              <option value="archived">Archived</option>
              <option value="discontinued">Discontinued</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] dark:border-[#263449]">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Save Product Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Stock Movement History Drawer / Modal */}
      <Dialog
        open={!!movementProduct}
        onClose={() => setMovementProduct(null)}
        title={`Stock Movements: ${movementProduct?.name}`}
        description={`SKU: ${movementProduct?.sku} • Barcode: ${movementProduct?.barcode}`}
        maxWidth="lg"
      >
        <div className="space-y-3">
          {movementsLoading ? (
            <p className="py-8 text-center text-xs text-[#94A3B8]">Loading ledger movements...</p>
          ) : movements.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#94A3B8]">No stock movements recorded yet for this item.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] text-xs">
              {movements.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          m.type === 'purchase'
                            ? 'success'
                            : m.type === 'sale'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {m.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {m.reason || m.referenceNo || 'Transaction'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      By {m.performedBy} • {formatDate(m.createdAt, true)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        m.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                    <p className="text-[10px] text-[#94A3B8]">
                      Balance: {m.newQty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>

      {/* Barcode Printing Modal */}
      <BarcodeGeneratorModal
        product={barcodeModalProduct}
        open={!!barcodeModalProduct}
        onClose={() => setBarcodeModalProduct(null)}
      />
    </div>
  )
}
