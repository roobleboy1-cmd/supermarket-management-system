import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  CreditCard,
  PauseCircle,
  PlayCircle,
  Printer,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Wallet,
  Clock,
  Layers,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { ThermalReceiptModal } from '@/components/common/ThermalReceiptModal'
import { usePosCartStore } from '@/stores/posCartStore'
import { useAuthStore } from '@/stores/authStore'
import { useOfflineStore } from '@/stores/offlineStore'
import { useToast } from '@/components/ui/Toast'
import { useLanguageStore } from '@/stores/languageStore'
import { productService } from '@/services/api/productService'
import { categoryBrandService } from '@/services/api/categoryBrandService'
import { customerService } from '@/services/api/customerService'
import { posService } from '@/services/api/posService'
import { promotionService } from '@/services/api/promotionService'
import { shiftService } from '@/services/api/shiftService'
import { formatCurrency } from '@/utils/formatters'
import type { Product, PaymentMethod, PaymentSplit, Sale, Customer } from '@/types'

export const PosPage: React.FC = () => {
  const { user } = useAuthStore()
  const { isOnline, addOfflineSale } = useOfflineStore()
  const { success, error, warning } = useToast()
  const { t, language } = useLanguageStore()

  const {
    items,
    customer,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomer,
    setCoupon,
    clearCoupon,
    couponCode,
    discountValue,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getTotalItemCount,
    suspendedSales,
    suspendSale,
    resumeSale,
    deleteSuspendedSale,
  } = usePosCartStore()

  // State
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [barcodeInput, setBarcodeInput] = React.useState('')
  const [checkoutModalOpen, setCheckoutModalOpen] = React.useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>('Cash')
  const [cashReceived, setCashReceived] = React.useState('')
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState(false)
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = React.useState(false)
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false)
  const [couponInput, setCouponInput] = React.useState('')
  const [couponLoading, setCouponLoading] = React.useState(false)
  const [heldSalesModalOpen, setHeldSalesModalOpen] = React.useState(false)
  const [splitPayments, setSplitPayments] = React.useState<PaymentSplit[]>([])
  const [isSplitMode, setIsSplitMode] = React.useState(false)
  const [splitMethod, setSplitMethod] = React.useState<PaymentMethod>('Cash')
  const [splitAmount, setSplitAmount] = React.useState('')

  const barcodeInputRef = React.useRef<HTMLInputElement | null>(null)
  const [mobileView, setMobileView] = React.useState<'products' | 'cart'>('products')

  // Queries
  const { data: productsData } = useQuery({
    queryKey: ['pos-products'],
    queryFn: () => productService.getProducts({ pageSize: 100 }),
  })

  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryBrandService.getCategories(),
  })

  const { data: customers } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => customerService.getCustomers(),
  })

  const { data: activeShift } = useQuery({
    queryKey: ['pos-active-shift'],
    queryFn: () => shiftService.getCurrentShift(),
  })

  // Barcode scanning handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const term = barcodeInput.trim()
    const product = productsData?.items.find(
      (p) => p.barcode === term || p.sku.toLowerCase() === term.toLowerCase()
    )

    if (product) {
      if (product.quantity <= 0) {
        warning('Out of Stock', `${product.name} has 0 quantity available.`)
      } else {
        addItem(product, 1)
        success(`Added to cart: ${product.name}`)
      }
    } else {
      error('Barcode Not Found', `No product matched barcode "${term}"`)
    }
    setBarcodeInput('')
  }

  // Hotkey support (F2 focus barcode, F4 checkout, Escape clear)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
      } else if (e.key === 'F4') {
        e.preventDefault()
        if (items.length > 0) setCheckoutModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items.length])

  // Filter products by category & search
  const filteredProducts = React.useMemo(() => {
    if (!productsData?.items) return []
    return productsData.items.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
      return matchesCategory && matchesSearch
    })
  }, [productsData?.items, selectedCategory, searchTerm])

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const total = getTotal()
  const cashNum = parseFloat(cashReceived) || 0
  const changeDue = Math.max(0, cashNum - total)

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const result = await promotionService.validateCoupon(couponInput.trim(), subtotal)
      if (result.isValid && result.coupon) {
        setCoupon(result.coupon.code, result.discountAmount, result.coupon.discountType)
        success(`Coupon ${result.coupon.code} Applied`, `Saved $${result.discountAmount.toFixed(2)}`)
        setCouponInput('')
      } else {
        error('Invalid Coupon', result.reason || 'This coupon code cannot be applied.')
      }
    } finally {
      setCouponLoading(false)
    }
  }

  // Handle Checkout
  const handleCompleteSale = async () => {
    if (items.length === 0) return
    setIsProcessingCheckout(true)

    // Prepare payment splits
    let payments: PaymentSplit[] = []
    if (isSplitMode && splitPayments.length > 0) {
      payments = splitPayments
    } else {
      payments = [{ method: selectedPaymentMethod, amount: total }]
    }

    const payload = {
      items,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      payments,
      cashReceived: selectedPaymentMethod === 'Cash' ? cashNum : undefined,
      changeDue: selectedPaymentMethod === 'Cash' ? changeDue : undefined,
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      cashierId: user?.id || 'u-cashier',
      cashierName: user?.name || 'Cashier Desk',
      shiftId: activeShift?.id || 'shift-active',
      idempotencyKey: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }

    try {
      if (!isOnline) {
        // Queue in IndexedDB per offline requirement
        await addOfflineSale({
          ...payload,
          receiptNumber: `OFF-${Date.now().toString().slice(-6)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
        warning('Transaction Queued Offline', 'Recorded in IndexedDB. Will synchronize automatically when connection returns.')
        setCheckoutModalOpen(false)
        clearCart()
      } else {
        const sale = await posService.checkout(payload)
        setCompletedSale(sale)
        setReceiptModalOpen(true)
        success('Transaction Completed!', `Receipt ${sale.invoiceNumber} recorded`)
        setCheckoutModalOpen(false)
        clearCart()
      }
    } catch (err: any) {
      error('Checkout Failed', err.message || 'Payment could not be verified by backend.')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  // Split payment add
  const handleAddSplit = () => {
    const amt = parseFloat(splitAmount)
    if (isNaN(amt) || amt <= 0) return
    const currentSum = splitPayments.reduce((s, p) => s + p.amount, 0)
    if (currentSum + amt > total) {
      warning('Exceeds Total', 'Split payments total cannot exceed transaction amount.')
      return
    }
    setSplitPayments([...splitPayments, { method: splitMethod, amount: amt }])
    setSplitAmount('')
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4 overflow-hidden select-none">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] rounded-t-2xl overflow-hidden shrink-0">
        <button
          onClick={() => setMobileView('products')}
          className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            mobileView === 'products'
              ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-xs'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#172338]'
          }`}
        >
          <Layers className="h-4 w-4" />
          {t('nav.products')}
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={`flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 transition relative cursor-pointer ${
            mobileView === 'cart'
              ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-xs'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#172338]'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('pos.cart')}
          {getTotalItemCount() > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                mobileView === 'cart'
                  ? 'bg-white text-[#3B82F6]'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {getTotalItemCount()}
            </span>
          )}
        </button>
      </div>

      {/* LEFT: Product Catalog & Touch Selector */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111C31] border border-[#E2E8F0]/80 dark:border-[#263449]/80 rounded-2xl shadow-xs overflow-hidden ${mobileView !== 'products' ? 'hidden lg:flex' : ''}`}>
        {/* Top Scan & Search Bar */}
        <div className="p-4 border-b border-[#E2E8F0]/80 dark:border-[#263449]/80 bg-[#F5F7FC]/70 dark:bg-[#0B1220]/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Barcode Quick Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-[#3B82F6] dark:text-[#06B6D4]" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder={t('pos.scanBarcode')}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-[#111C31] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] font-mono"
                />
              </div>
              <Button type="submit" variant="primary" size="sm">
                Add Scan
              </Button>
            </form>

            {/* Keyword Product Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder={t('pos.searchProduct')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          {/* Category Shortcut Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-xs'
                  : 'bg-[#F1F5F9] dark:bg-[#172338] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#172338]'
              }`}
            >
              {language === 'so' ? 'Dhammaan Alaabta' : 'All Products'}
            </button>
            {(categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-xs'
                    : 'bg-[#F1F5F9] dark:bg-[#172338] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#172338]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Touch Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#94A3B8]">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No products match this selection</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inStock = product.quantity > 0
              return (
                <button
                  key={product.id}
                  disabled={!inStock}
                  onClick={() => {
                    addItem(product, 1)
                    // On mobile, show a brief indication the item was added
                  }}
                  className={`group flex flex-col justify-between p-3 rounded-xl border text-left transition duration-150 active:scale-98 cursor-pointer ${
                    inStock
                      ? 'bg-white dark:bg-[#111C31] border-[#E2E8F0] dark:border-[#263449] hover:border-blue-500 hover:shadow-md'
                      : 'bg-[#F5F7FC] dark:bg-[#111C31]/40 border-[#E2E8F0] dark:border-[#263449] opacity-60 pointer-events-none'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-[#94A3B8] truncate">
                        {product.sku}
                      </span>
                      {product.quantity <= product.minStockLevel && product.quantity > 0 && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-1 rounded">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#263449]/60 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#3B82F6] dark:text-[#06B6D4]">
                      ${product.sellingPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart, Totals & Checkout */}
      <div className={`w-full lg:w-96 flex flex-col bg-white dark:bg-[#111C31] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl shadow-md overflow-hidden shrink-0 ${mobileView !== 'cart' ? 'hidden lg:flex' : ''}`}>
        {/* Cart Top Bar */}
        <div className="p-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F5F7FC]/50 dark:bg-[#0B1220]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#3B82F6]" />
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Active Cart ({getTotalItemCount()})
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Suspend sale hold button */}
            <button
              onClick={() => {
                if (items.length > 0) {
                  suspendSale()
                  success('Sale Placed on Hold', 'You can resume this customer anytime')
                } else if (suspendedSales.length > 0) {
                  setHeldSalesModalOpen(true)
                }
              }}
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#172338] transition text-xs font-medium inline-flex items-center gap-1"
              title="Hold Sale / Resume"
            >
              <PauseCircle className="h-4 w-4 text-amber-500" />
              {suspendedSales.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1 rounded-full">
                  {suspendedSales.length}
                </span>
              )}
            </button>

            {/* Clear Cart with confirmation */}
            {items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear the entire cart?')) {
                    clearCart()
                  }
                }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Clear Cart"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Attachment Bar */}
        <div className="px-4 py-2 border-b border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between text-xs">
          {customer ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#3B82F6]" />
                <span className="font-semibold text-[#1E293B] dark:text-[#F8FAFC]">{customer.name}</span>
                <span className="text-[10px] text-amber-600 font-bold">({customer.loyaltyPoints} pts)</span>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="text-[10px] text-[#94A3B8] hover:text-red-500 font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCustomerModalOpen(true)}
              className="flex items-center gap-1.5 text-[#64748B] hover:text-[#3B82F6] font-medium cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Attach Customer / Loyalty Member</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] dark:divide-[#263449] p-3 space-y-1">
          {items.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Cart is empty. Scan barcodes or tap items to begin.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    ${item.unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quantity editor */}
                  <div className="flex items-center border border-[#E2E8F0] dark:border-[#263449] rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-[#F1F5F9] dark:hover:bg-[#172338]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="w-16 text-right font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    ${item.total.toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-[#94A3B8] hover:text-red-500 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discounts & Coupon Input */}
        <div className="p-3 border-t border-[#E2E8F0] dark:border-[#263449] bg-[#F5F7FC]/50 dark:bg-[#0B1220]/20">
          {couponCode ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <Tag className="h-3.5 w-3.5" />
                <span>Coupon: {couponCode} (-${discountAmount.toFixed(2)})</span>
              </div>
              <button onClick={clearCoupon} className="text-emerald-600 hover:text-red-500 font-bold">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Promo/Coupon code..."
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C31] uppercase font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyCoupon}
                isLoading={couponLoading}
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Cart Totals Summary */}
        <div className="p-4 border-t border-[#E2E8F0]/80 dark:border-[#263449] space-y-2 text-xs bg-white dark:bg-[#111C31]">
          <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8] font-medium">
            <span>{t('pos.subtotal')}</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>{t('pos.discount')}</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8] font-medium">
            <span>{t('pos.tax')} (5% VAT)</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2.5 border-t border-[#E2E8F0]/80 dark:border-[#263449] font-bold">
            <span className="text-sm font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">{t('pos.total')}</span>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] dark:from-indigo-400 dark:to-cyan-400">
              ${total.toFixed(2)}
            </span>
          </div>

          <Button
            variant="success"
            className="w-full h-12 text-base font-extrabold shadow-md shadow-emerald-500/25 mt-3 gap-2"
            disabled={items.length === 0}
            onClick={() => setCheckoutModalOpen(true)}
          >
            <CreditCard className="h-5 w-5" />
            {t('pos.payNow')} (F4)
          </Button>
        </div>
      </div>

      {/* MODAL: Checkout & Multi-Currency / Mobile Money Payment */}
      <Dialog
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete Transaction Checkout"
        description={`Total due: $${total.toFixed(2)}`}
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] dark:text-[#94A3B8] mb-2">
              Select Primary Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(['Cash', 'EVC Plus', 'eDahab', 'ZAAD', 'Card', 'Bank Transfer'] as PaymentMethod[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod(m)
                      setIsSplitMode(false)
                    }}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      selectedPaymentMethod === m && !isSplitMode
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-[#3B82F6] dark:text-[#06B6D4] font-bold ring-2 ring-blue-500/30'
                        : 'border-[#E2E8F0] dark:border-[#263449] hover:border-[#CBD5E1] text-[#334155] dark:text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {m === 'Cash' ? (
                        <DollarSign className="h-5 w-5" />
                      ) : m === 'Card' ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <Smartphone className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs">{m}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Cash Received & Change Calculations (if Cash selected) */}
          {selectedPaymentMethod === 'Cash' && !isSplitMode && (
            <div className="p-4 rounded-xl bg-[#F5F7FC] dark:bg-[#172338]/40 border border-[#E2E8F0] dark:border-[#263449] space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    label="Cash Received ($)"
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={total.toFixed(2)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-1.5 pt-5">
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashReceived(amt.toString())}
                      className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-[#CBD5E1] dark:border-[#263449] hover:bg-[#E2E8F0] dark:hover:bg-[#172338]"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#263449]">
                <span className="text-xs text-[#64748B] font-medium">Change to return customer:</span>
                <span
                  className={`text-base font-bold ${
                    cashNum >= total ? 'text-emerald-600' : 'text-[#94A3B8]'
                  }`}
                >
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Money Notice for Somali Gateways */}
          {['EVC Plus', 'eDahab', 'ZAAD'].includes(selectedPaymentMethod) && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-[#3B82F6] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-blue-900 dark:text-blue-300">
                  {selectedPaymentMethod} Mobile Checkout
                </p>
                <p className="text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Merchant account will prompt customer on registered merchant USSD/API. Enter phone or reference if prompted.
                </p>
              </div>
            </div>
          )}

          {/* Split Payment Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsSplitMode(!isSplitMode)}
              className="text-xs font-semibold text-[#3B82F6] hover:underline"
            >
              {isSplitMode ? '← Back to Single Payment' : '+ Split across multiple payment methods'}
            </button>

            {isSplitMode && (
              <div className="mt-3 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F5F7FC] dark:bg-[#111C31] space-y-3">
                <h4 className="text-xs font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                  Configure Split Tenders
                </h4>
                <div className="flex gap-2">
                  <select
                    value={splitMethod}
                    onChange={(e) => setSplitMethod(e.target.value as PaymentMethod)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#263449] bg-white dark:bg-[#172338]"
                  >
                    {['Cash', 'EVC Plus', 'eDahab', 'ZAAD', 'Card'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount..."
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#263449] bg-white dark:bg-[#172338] flex-1"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddSplit}>
                    Add
                  </Button>
                </div>

                {splitPayments.length > 0 && (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] text-xs">
                    {splitPayments.map((p, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span>{p.method}</span>
                        <span className="font-bold">${p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
            <Button
              variant="outline"
              onClick={() => setCheckoutModalOpen(false)}
              disabled={isProcessingCheckout}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="px-6 font-bold"
              onClick={handleCompleteSale}
              isLoading={isProcessingCheckout}
              disabled={selectedPaymentMethod === 'Cash' && cashNum < total && !isSplitMode}
            >
              Complete Sale (${total.toFixed(2)})
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL: Attach Customer */}
      <Dialog
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Lookup Customer / Loyalty Account"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search by customer name or phone number..."
            leftIcon={<Search className="h-4 w-4" />}
          />
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#263449] max-h-60 overflow-y-auto">
            {(customers || []).map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCustomer(c)
                  setCustomerModalOpen(false)
                }}
                className="py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-[#172338] px-2 rounded-lg cursor-pointer transition text-xs"
              >
                <div>
                  <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{c.name}</p>
                  <p className="text-[11px] text-[#64748B]">{c.phone}</p>
                </div>
                <div className="text-right">
                  <Badge variant="primary">{c.tier} Member</Badge>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">{c.loyaltyPoints} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* MODAL: Held Sales (Suspended Sales) */}
      <Dialog
        open={heldSalesModalOpen}
        onClose={() => setHeldSalesModalOpen(false)}
        title="Suspended / Held Carts"
        maxWidth="md"
      >
        <div className="space-y-3">
          {suspendedSales.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-6 text-center">No held transactions</p>
          ) : (
            suspendedSales.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{h.holdReference}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {h.items.length} items • ${h.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      resumeSale(h.id)
                      setHeldSalesModalOpen(false)
                    }}
                  >
                    Resume Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteSuspendedSale(h.id)}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* Thermal Receipt Print Dialog */}
      <ThermalReceiptModal
        sale={completedSale}
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  )
}
